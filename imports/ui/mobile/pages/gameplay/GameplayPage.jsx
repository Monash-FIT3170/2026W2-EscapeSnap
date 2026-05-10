import React, { useRef, useEffect, useState } from 'react';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';
import { Meteor } from 'meteor/meteor';

// Hardcoded for testing - will come from MongoDB subscription later
const TARGET_OBJECT = 'bottle';

function evaluatePredictions(predictions, target) {
  const match = predictions.find((p) => p.class === target);
  if (match) {
    return match.score >= 0.65 ? 'pass' : 'escalate';
  }
  const top = predictions[0];
  if (top && top.score >= 0.8) return 'fail';
  return 'escalate';
}

export function GameplayPage() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const modelRef = useRef(null);

  const [cameraError, setCameraError] = useState(null);
  const [modelReady, setModelReady] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [capturedUrl, setCapturedUrl] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [validationState, setValidationState] = useState(null);

  useEffect(() => {
    startCamera();
    loadModel();
    return () => stopCamera();
  }, []);

  async function loadModel() {
    if (modelRef.current) return;
    modelRef.current = await cocoSsd.load();
    setModelReady(true);
    console.log('COCO-SSD model ready');
  }

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setCameraError('Camera access denied or unavailable.');
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }

  function handleBackToCamera() {
    setCapturedUrl(null);
    setPredictions(null);
    setValidationState(null);
  }

  async function handleCapture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !modelRef.current) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedUrl(dataUrl);
    setValidationState(null);

    console.log('%c ', `background:url(${dataUrl}) no-repeat center/contain;padding:120px 200px;`);

    const detected = await modelRef.current.detect(canvasRef.current);
    console.log('Predictions:', detected);
    setPredictions(detected);

    const outcome = evaluatePredictions(detected, TARGET_OBJECT);
    console.log('Outcome:', outcome);

    if (outcome === 'escalate') {
      setUploading(true);
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const arrayBuffer = await blob.arrayBuffer();
        Meteor.call('submissions.validate', arrayBuffer, TARGET_OBJECT, (err, result) => {
          setUploading(false);
          if (err) {
            console.error('Meteor method error:', err);
            setValidationState('fail');
            return;
          }
          setValidationState(result?.outcome ?? 'fail');
        });
      }, 'image/jpeg', 0.85);
    } else {
      setValidationState(outcome);
    }
  }

  const inResultsMode = predictions !== null;
  const isButtonDisabled = uploading || !!cameraError || !modelReady;

  return (
    <div className="flex flex-col h-screen bg-[#131313] text-white font-mono select-none">

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <span className="text-lg font-bold tracking-widest text-[#E5E2E1]">ESCAPESNAP</span>
        <div className="flex gap-4 text-[#E5E2E1] text-xl">
          <span>{'\u23F1'}</span>
          <span>{'\uD83D\uDC64'}</span>
          <span>{'\uD83D\uDD14'}</span>
        </div>
      </div>

      {/* Round + Progress */}
      <div className="flex items-center px-5 py-2 border-t border-[#1C1B1B]">
        <span className="text-xs font-bold tracking-widest text-[#E5E2E1] w-20">ROUND 1</span>
        <div className="flex-1 mx-4">
          <div className="h-1.5 bg-[#1C1B1B] rounded-full overflow-hidden">
            <div className="h-full bg-[#8B0000] rounded-full" style={{ width: '65%' }} />
          </div>
        </div>
        <span className="text-xs text-[#E5E2E1] tracking-widest">PROG</span>
        <span className="text-xs font-bold text-[#E5E2E1] ml-2">65%</span>
      </div>

      {/* Objective Card */}
      <div className="mx-4 my-2 bg-[#1C1B1B] rounded p-3 flex items-start justify-between">
        <div className="flex gap-3 items-start flex-1">
          <span className="bg-[#8B0000] text-[#E5E2E1] text-[10px] font-bold px-2 py-0.5 rounded shrink-0">
            OBJ_014
          </span>
          <p className="text-xs text-[#E5E2E1] leading-relaxed">
            "I possess eyes but cannot see; I am peeled of my skin but feel no pain. Capture the source..."
          </p>
        </div>
        <div className="ml-3 text-right shrink-0">
          <p className="text-[#8B0000] text-sm font-bold">03:44</p>
          <p className="text-[#AA8984] text-[10px] tracking-widest">REMAINING</p>
        </div>
      </div>

      {/* Main area - video always mounted; results panel layers on top */}
      <div className="flex-1 mx-4 my-2 flex flex-col min-h-0">

        {/* Camera viewfinder - always in DOM so the stream stays attached */}
        <div className={`relative bg-black rounded overflow-hidden ${inResultsMode ? 'h-36 shrink-0' : 'flex-1'}`}>
          {cameraError ? (
            <div className="absolute inset-0 flex items-center justify-center text-[#AA8984] text-xs tracking-widest px-6 text-center">
              {cameraError}
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}

          {/* Captured still overlay - shown in results mode */}
          {inResultsMode && capturedUrl && (
            <img src={capturedUrl} alt="captured" className="absolute inset-0 w-full h-full object-cover opacity-60" />
          )}

          {/* Corner brackets - only in camera mode */}
          {!inResultsMode && (
            <>
              <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-[#8B0000] pointer-events-none" />
              <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-[#8B0000] pointer-events-none" />
              <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-[#8B0000] pointer-events-none" />
              <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-[#8B0000] pointer-events-none" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-6 h-6">
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[#8B0000] opacity-60" />
                  <div className="absolute top-1/2 left-0 right-0 h-px bg-[#8B0000] opacity-60" />
                </div>
              </div>
              {!modelReady && (
                <div className="absolute bottom-2 left-0 right-0 flex justify-center pointer-events-none">
                  <span className="text-[#AA8984] text-[10px] tracking-widest">LOADING MODEL...</span>
                </div>
              )}
            </>
          )}

          {/* Outcome badge - shown in results mode over the thumbnail */}
          {inResultsMode && (
            <>
              {validationState === 'pass' && (
                <div className="absolute inset-0 flex items-center justify-center gap-2">
                  <span className="text-green-400 text-2xl">{'\u2713'}</span>
                  <span className="text-green-400 text-xs tracking-widest">OBJECT CONFIRMED</span>
                </div>
              )}
              {validationState === 'fail' && (
                <div className="absolute inset-0 flex items-center justify-center gap-2">
                  <span className="text-[#8B0000] text-2xl">{'\u2715'}</span>
                  <span className="text-[#8B0000] text-xs tracking-widest">WRONG OBJECT</span>
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[#8B0000] text-xs tracking-widest">PROCESSING...</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Detection list - only in results mode */}
        {inResultsMode && (
          <div className="flex-1 mt-2 bg-[#1C1B1B] rounded overflow-y-auto min-h-0">
            <div className="px-3 pt-3 pb-1">
              <span className="text-[10px] tracking-widest text-[#AA8984]">
                DETECTIONS - TARGET: {TARGET_OBJECT.toUpperCase()}
              </span>
            </div>
            {predictions.length === 0 ? (
              <p className="px-3 py-4 text-xs text-[#AA8984] tracking-widest">NO OBJECTS DETECTED</p>
            ) : (
              predictions
                .slice()
                .sort((a, b) => b.score - a.score)
                .map((p, i) => {
                  const pct = Math.round(p.score * 100);
                  const isTarget = p.class === TARGET_OBJECT;
                  return (
                    <div key={i} className="flex items-center gap-3 px-3 py-2 border-t border-[#131313]">
                      <span className={`text-xs font-bold w-4 text-center ${isTarget ? 'text-green-400' : 'text-[#AA8984]'}`}>
                        {isTarget ? '\u2605' : `${i + 1}`}
                      </span>
                      <span className={`text-xs flex-1 uppercase tracking-wider ${isTarget ? 'text-[#E5E2E1]' : 'text-[#AA8984]'}`}>
                        {p.class}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-[#131313] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${isTarget ? 'bg-green-500' : 'bg-[#8B0000]'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className={`text-xs w-8 text-right ${isTarget ? 'text-green-400' : 'text-[#AA8984]'}`}>
                          {pct}%
                        </span>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        )}
      </div>

      {/* Off-screen canvas - never rendered */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Bottom action button - capture OR back to camera */}
      <div className="flex justify-center py-4">
        {inResultsMode ? (
          <button
            onClick={handleBackToCamera}
            className="flex items-center gap-2 px-6 py-3 rounded-full border border-[#8B0000] text-[#8B0000] text-xs tracking-widest active:bg-[#8B0000]/20 transition-colors"
          >
            {'\u2190'} BACK TO CAMERA
          </button>
        ) : (
          <button
            onClick={handleCapture}
            disabled={isButtonDisabled}
            className="w-20 h-20 rounded-full bg-[#8B0000] flex items-center justify-center shadow-lg active:scale-95 transition-transform disabled:opacity-40"
            aria-label="Take photo"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-9 h-9 text-[#E5E2E1]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </button>
        )}
      </div>

      {/* Bottom Nav */}
      <div className="flex border-t border-[#1C1B1B] bg-[#0E0E0E]">
        {[
          { label: 'CLUES', icon: '\uD83D\uDD0D' },
          { label: 'SCANNER', icon: '\u229E', active: true },
          { label: 'STATUS', icon: '\uD83D\uDCCA' },
        ].map(({ label, icon, active }) => (
          <button
            key={label}
            className={`flex-1 flex flex-col items-center py-3 gap-1 text-[10px] tracking-widest ${
              active ? 'text-[#8B0000] border-t-2 border-[#8B0000]' : 'text-[#AA8984]'
            }`}
          >
            <span className="text-base">{icon}</span>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
