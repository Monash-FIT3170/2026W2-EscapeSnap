import React, { useRef, useEffect, useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { HARDCODED_RIDDLES } from '/imports/lib/riddles';

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

const MobileRiddlePage = ({ gameId, sessionId, playerId = 'player1', isExpired = false, onCorrect }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [cameraError, setCameraError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [capturedUrl, setCapturedUrl] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [validationState, setValidationState] = useState(null);

  const riddle = HARDCODED_RIDDLES.find(r => r.playerId === playerId);
  const targetObject = riddle?.answerKeyword ?? 'object';

  useEffect(() => {
    if (isExpired) return;
    startCamera();
    return () => stopCamera();
  }, []);

  useEffect(() => {
    if (isExpired) stopCamera();
  }, [isExpired]);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      setCameraError('Camera access denied or unavailable.');
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop());
  }

  function handleBackToCamera() {
    setCapturedUrl(null);
    setPredictions(null);
    setValidationState(null);
  }

  async function handleCapture() {
    if (isExpired) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedUrl(dataUrl);
    setValidationState(null);
    setUploading(true);

    canvas.toBlob(async (blob) => {
      if (!blob) { setUploading(false); return; }
      const base64 = await blobToBase64(blob);
      Meteor.call('submissions.detect', base64, targetObject, (err, result) => {
        setUploading(false);
        if (err) { setValidationState('fail'); return; }
        setPredictions(result.predictions ?? []);
        const outcome = result.outcome === 'escalate' ? 'fail' : result.outcome;
        setValidationState(outcome);
        if (outcome === 'pass') submitRiddle();
      });
    }, 'image/jpeg', 0.85);
  }

  async function submitRiddle() {
    if (isExpired) return;
    try {
      const revealed = await Meteor.callAsync('games.submitRiddle', sessionId, playerId);
      if (onCorrect) onCorrect(revealed);
    } catch (err) {
      console.error('submitRiddle error:', err);
    }
  }

  if (!riddle) {
    return <div className="pt-5 font-mono text-sm text-red-500">RIDDLE NOT FOUND</div>;
  }

  const inResultsMode = predictions !== null;

  return (
    <div className="flex flex-col flex-1">

      {/* Full-screen viewfinder */}
      <div className="relative flex-1 overflow-hidden bg-black">

        {cameraError ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="px-8 text-center font-mono text-xs uppercase tracking-widest text-slate-500">{cameraError}</p>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}

        {/* Captured still */}
        {inResultsMode && capturedUrl && (
          <img
            src={capturedUrl}
            alt="captured"
            className="absolute inset-0 h-full w-full object-cover opacity-75"
          />
        )}

        {/* Corner brackets — live only */}
        {!inResultsMode && !isExpired && !cameraError && (
          <>
            <div className="pointer-events-none absolute left-5 top-5 h-8 w-8 border-l-2 border-t-2 border-red-500" />
            <div className="pointer-events-none absolute right-5 top-5 h-8 w-8 border-r-2 border-t-2 border-red-500" />
            <div className="pointer-events-none absolute bottom-5 left-5 h-8 w-8 border-b-2 border-l-2 border-red-500" />
            <div className="pointer-events-none absolute bottom-5 right-5 h-8 w-8 border-b-2 border-r-2 border-red-500" />
          </>
        )}

        {/* Detection result overlay */}
        {inResultsMode && (
          <div className="absolute inset-0 flex items-center justify-center">
            {uploading && (
              <span className="bg-black/70 px-4 py-2 font-mono text-sm uppercase tracking-widest text-slate-300">
                Analysing...
              </span>
            )}
            {validationState === 'pass' && (
              <span className="bg-black/70 px-4 py-2 font-mono text-sm uppercase tracking-widest text-green-400">
                ✓ Object Confirmed
              </span>
            )}
            {validationState === 'fail' && (
              <span className="bg-black/70 px-4 py-2 font-mono text-sm uppercase tracking-widest text-red-400">
                ✕ Wrong Object
              </span>
            )}
          </div>
        )}

        {/* Expired overlay */}
        {isExpired && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70">
            <span className="font-mono text-3xl text-red-500">✗</span>
            <span className="font-mono text-xs uppercase tracking-widest text-red-400">Round Ended</span>
            <span className="mt-1 font-mono text-[10px] uppercase tracking-widest text-red-700">
              No submission accepted
            </span>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* Capture / retake button */}
      <div className="flex items-center justify-center py-6 bg-black">
        {!isExpired && !inResultsMode && (
          <button
            onClick={handleCapture}
            disabled={uploading || !!cameraError}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-white shadow-lg shadow-red-900/50 transition active:scale-95 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Capture photo"
          >
            <CameraIcon />
          </button>
        )}

        {!isExpired && inResultsMode && (
          <button
            onClick={handleBackToCamera}
            className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-red-600 text-red-400 transition hover:bg-red-950/40"
            aria-label="Retake photo"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>
        )}

        {isExpired && (
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-slate-800 bg-slate-950 opacity-40">
            <CameraIcon />
          </div>
        )}
      </div>

    </div>
  );
};

export default MobileRiddlePage;
