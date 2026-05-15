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

const MobileRiddlePage = ({ gameId, playerId = 'player1', round = 1, onCorrect }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [cameraError, setCameraError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [capturedUrl, setCapturedUrl] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [validationState, setValidationState] = useState(null);

  const riddle = HARDCODED_RIDDLES.find(
    r => r.playerId === playerId && r.round === round
  );
  const targetObject = riddle?.answerKeyword ?? 'object';

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

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
        if (outcome === 'pass') {
          submitRiddle();
        } else {
          if (onCorrect) onCorrect('?', false);
        }
      });
    }, 'image/jpeg', 0.85);
  }

  async function submitRiddle() {
    try {
      const revealed = await Meteor.callAsync(
        'games.submitRiddle',
        gameId,
        playerId,
        round
      );

      if (onCorrect) onCorrect(revealed, true);
    } catch (err) {
      if (onCorrect) onCorrect('?', false);
    }
  }

  const inResultsMode = predictions !== null;

  if (!riddle) {
    return <div className="text-red-500 p-4">RIDDLE NOT FOUND</div>;
  }

  return (
    <div className="flex flex-col gap-4 pt-5">

      {/* Riddle card */}
      <div className="border border-slate-800 bg-slate-950/60 px-4 py-4">
        <p className="font-mono text-xs text-slate-400">{riddle.id}</p>
        <p className="mt-3 text-sm text-slate-200">"{riddle.riddle}"</p>
      </div>

      {/* Viewfinder / captured image */}
      <div className="relative border border-slate-800 min-h-[250px] bg-black overflow-hidden flex items-center justify-center">
        {cameraError ? (
          <p className="text-slate-500 text-xs px-4 text-center">{cameraError}</p>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {inResultsMode && capturedUrl && (
          <img
            src={capturedUrl}
            alt="captured"
            className="absolute inset-0 w-full h-full object-cover opacity-70"
          />
        )}

        {!inResultsMode && !cameraError && (
          <>
            <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-red-700 pointer-events-none" />
            <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-red-700 pointer-events-none" />
            <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-red-700 pointer-events-none" />
            <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-red-700 pointer-events-none" />
          </>
        )}

        {inResultsMode && (
          <div className="absolute inset-0 flex items-center justify-center">
            {validationState === 'pass' && (
              <span className="text-green-400 text-sm font-mono bg-black/60 px-3 py-1">{'✓'} OBJECT CONFIRMED</span>
            )}
            {validationState === 'fail' && (
              <span className="text-red-500 text-sm font-mono bg-black/60 px-3 py-1">{'✕'} WRONG OBJECT</span>
            )}
            {uploading && (
              <span className="text-slate-400 text-sm font-mono bg-black/60 px-3 py-1">ANALYSING...</span>
            )}
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* Action buttons */}
      {inResultsMode ? (
        <button
          onClick={handleBackToCamera}
          className="border border-red-500 py-4 text-red-400 font-mono text-sm"
        >
          {'←'} RETAKE
        </button>
      ) : (
        <button
          onClick={handleCapture}
          disabled={uploading || !!cameraError}
          className="bg-red-700 py-4 text-center text-white font-mono text-sm disabled:opacity-40"
        >
          {uploading ? 'ANALYSING...' : 'CAPTURE & ANALYSE'}
        </button>
      )}
    </div>
  );
};

export default MobileRiddlePage;
