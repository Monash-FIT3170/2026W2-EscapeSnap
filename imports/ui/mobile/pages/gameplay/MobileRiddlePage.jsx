import React, { useRef, useEffect, useState } from 'react';
import { Meteor } from 'meteor/meteor';

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
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-7 w-7"
    >
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

const MobileRiddlePage = ({
  roundId,
  riddleText,
  targetObject,
  isExpired = false,
  onCorrect,
}) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [cameraError, setCameraError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [capturedUrl, setCapturedUrl] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [validationState, setValidationState] = useState(null);

  useEffect(() => {
    if (isExpired) return;
    startCamera();
    return () => stopCamera();
  }, []);

  useEffect(() => {
    if (isExpired) stopCamera();
  }, [isExpired]);

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      console.error('[camera] navigator.mediaDevices is unavailable - likely an insecure (non-HTTPS) context');
      setCameraError('Camera requires a secure connection (HTTPS).');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('[camera] getUserMedia failed:', err.name, err.message);
      const message = err.name === 'NotAllowedError'
        ? 'Camera permission denied - check your browser settings.'
        : err.name === 'NotFoundError'
          ? 'No camera found on this device.'
          : 'Camera access denied or unavailable.';
      setCameraError(message);
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }

  async function handleCapture() {
    if (isExpired || !roundId) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedUrl(dataUrl);
    setValidationState(null);
    setExplanation(null);
    setUploading(true);

    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          setUploading(false);
          setValidationState('error');
          setExplanation('Could not process the photo — please try again.');
          return;
        }

        const base64 = await blobToBase64(blob);

        try {
          const result = await Meteor.callAsync(
            'submissions.classify',
            base64,
            targetObject ?? 'object'
          );
          setValidationState(result.outcome);
          setExplanation(result.explanation || null);

          if (result.outcome === 'pass') {
            await submitRiddle(base64);
          } else {
            setUploading(false);
            if (result.outcome === 'fail' && onCorrect) onCorrect('?', false);
          }
        } catch (err) {
          console.error('[submissions.classify] failed:', err.error || err.reason || err.message);
          setUploading(false);
          setValidationState('error');
          setExplanation('Connection error — please try again.');
        }
      },
      'image/jpeg',
      0.85
    );
  }

  async function submitRiddle(photoUrl) {
    if (isExpired || !roundId) return;
    try {
      const letter = await Meteor.callAsync(
        'rounds.submit',
        roundId,
        photoUrl,
        true
      );
      if (onCorrect) onCorrect(letter, true);
    } catch (err) {
      console.error('[rounds.submit] failed:', err.error || err.reason || err.message);
      setValidationState('error');
      setExplanation('Connection error — your submission was not saved. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  if (!roundId) {
    return (
      <div className="pt-5 font-mono text-sm text-slate-500 text-center">
        Loading round...
      </div>
    );
  }

  const showCapturedPhoto =
    (uploading || validationState !== null) && capturedUrl;
  const inResultsMode = validationState !== null;

  return (
    <div className="flex flex-col flex-1">
      <div className="relative flex-1 overflow-hidden bg-black">
        {cameraError ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="px-8 text-center font-mono text-xs uppercase tracking-widest text-slate-500">
              {cameraError}
            </p>
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

        {showCapturedPhoto && (
          <img
            src={capturedUrl}
            alt="captured"
            className="absolute inset-0 h-full w-full object-cover opacity-75"
          />
        )}

        {(validationState === 'fail' || validationState === 'error') && (
          <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-1 bg-black/80 px-6 py-4">
            <span
              className={`font-mono text-xs uppercase tracking-widest ${
                validationState === 'error' ? 'text-amber-400' : 'text-red-500'
              }`}
            >
              {validationState === 'error' ? 'Couldn’t Verify' : 'Not A Match'}
            </span>
            {explanation && (
              <span className="text-center font-mono text-[11px] text-slate-400">
                {explanation}
              </span>
            )}
          </div>
        )}

        {!uploading && !inResultsMode && !isExpired && !cameraError && (
          <>
            <div className="pointer-events-none absolute left-5 top-5 h-8 w-8 border-l-2 border-t-2 border-red-500" />
            <div className="pointer-events-none absolute right-5 top-5 h-8 w-8 border-r-2 border-t-2 border-red-500" />
            <div className="pointer-events-none absolute bottom-5 left-5 h-8 w-8 border-b-2 border-l-2 border-red-500" />
            <div className="pointer-events-none absolute bottom-5 right-5 h-8 w-8 border-b-2 border-r-2 border-red-500" />
          </>
        )}

        {uploading && (
          <>
            <div className="pointer-events-none absolute left-5 top-5 h-8 w-8 border-l-2 border-t-2 border-red-500" />
            <div className="pointer-events-none absolute right-5 top-5 h-8 w-8 border-r-2 border-t-2 border-red-500" />
            <div className="pointer-events-none absolute bottom-5 left-5 h-8 w-8 border-b-2 border-l-2 border-red-500" />
            <div className="pointer-events-none absolute bottom-5 right-5 h-8 w-8 border-b-2 border-r-2 border-red-500" />

            <div className="pointer-events-none absolute inset-5 overflow-hidden">
              <div className="scan-sweep absolute inset-x-0 h-0.5 bg-red-500 shadow-[0_0_8px_2px_rgba(239,68,68,0.7)]" />
            </div>

            <div className="absolute inset-x-0 bottom-6 flex items-center justify-center">
              <span className="pulse-text bg-black/70 px-4 py-2 font-mono text-sm uppercase tracking-widest text-red-400">
                Analysing...
              </span>
            </div>
          </>
        )}

        {isExpired && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70">
            <span className="font-mono text-3xl text-red-500">✗</span>
            <span className="font-mono text-xs uppercase tracking-widest text-red-400">
              Round Ended
            </span>
            <span className="mt-1 font-mono text-[10px] uppercase tracking-widest text-red-700">
              No submission accepted
            </span>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <div className="flex items-center justify-center py-6 bg-black">
        {!isExpired && (
          <button
            onClick={handleCapture}
            disabled={uploading || !!cameraError}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-white shadow-lg shadow-red-900/50 transition active:scale-95 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Capture photo"
          >
            <CameraIcon />
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
