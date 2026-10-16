import React, { useRef, useEffect, useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { useT } from '../../../../languages/LanguageProvider';

// Widest edge of a captured frame, in px. Also bounds what gets stored on the
// submission, so keep it in step with the `photoUrl` cap in the schema.
const CAPTURE_MAX_WIDTH = 900;

// How long to wait on a camera request before showing an error with Retry.
// Long enough for a player to answer the browser's permission prompt.
const CAMERA_TIMEOUT_MS = 20_000;

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
  targetObject,
  isExpired = false,
  onCorrect,
}) => {
  const t = useT();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [cameraError, setCameraError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [capturedUrl, setCapturedUrl] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [validationState, setValidationState] = useState(null);

  // getUserMedia can resolve after this screen has unmounted (the result
  // screen swaps in and out between rounds), after the round has expired, or
  // after we've given up waiting on it. A stream that arrives then has no
  // owner left to stop it, so it stays live, keeping the camera on and
  // blanking the next screen's feed. Each camera request takes a number; any
  // of those events bumps the counter, and a stream for an old number is
  // stopped on arrival.
  const cameraRequestRef = useRef(0);
  const isExpiredRef = useRef(isExpired);
  isExpiredRef.current = isExpired;

  useEffect(() => {
    if (isExpired) return;
    startCamera();
    return () => {
      cameraRequestRef.current++;
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (!isExpired) return;
    cameraRequestRef.current++;
    stopCamera();
  }, [isExpired]);

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      console.error('[camera] navigator.mediaDevices is unavailable - likely an insecure (non-HTTPS) context');
      setCameraError(t('mobile.riddle.errCameraSecure'));
      return;
    }
    const request = ++cameraRequestRef.current;
    // Some browsers never answer a camera request (no stream, no error),
    // which would leave a black feed and a shutter that does nothing.
    const timeout = setTimeout(() => {
      if (request !== cameraRequestRef.current) return;
      console.error(
        `[camera] getUserMedia gave no answer after ${CAMERA_TIMEOUT_MS} ms`
      );
      cameraRequestRef.current++;
      setCameraError(t('mobile.riddle.errCameraUnavailable'));
    }, CAMERA_TIMEOUT_MS);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      if (request !== cameraRequestRef.current || isExpiredRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      if (request !== cameraRequestRef.current) return;
      console.error('[camera] getUserMedia failed:', err.name, err.message);
      const message = err.name === 'NotAllowedError'
        ? t('mobile.riddle.errCameraPermission')
        : err.name === 'NotFoundError'
          ? t('mobile.riddle.errCameraNotFound')
          : t('mobile.riddle.errCameraUnavailable');
      setCameraError(message);
    } finally {
      clearTimeout(timeout);
    }
  }

  function retryCamera() {
    stopCamera();
    setCameraError(null);
    startCamera();
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }

  async function handleCapture() {
    if (isExpired || !roundId) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    // Downscale on capture: a full-resolution phone frame is far more than
    // Gemini needs to recognise an object, and the whole frame is stored on
    // the submission for the end-game gallery.
    const scale = Math.min(1, CAPTURE_MAX_WIDTH / video.videoWidth);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);

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
          setExplanation(t('mobile.riddle.errProcessPhoto'));
          return;
        }

        const base64 = await blobToBase64(blob);

        try {
          const result = await Meteor.callAsync(
            'submissions.classify',
            base64,
            targetObject ?? 'object',
            roundId
          );
          setValidationState(result.outcome);
          setExplanation(result.explanation || null);

          if (result.outcome === 'pass') {
            await submitRiddle(base64);
          } else {
            setUploading(false);
            if (result.outcome === 'fail' && onCorrect) onCorrect('?', false, roundId);
          }
        } catch (err) {
          console.error('[submissions.classify] failed:', err.error || err.reason || err.message);
          setUploading(false);
          setValidationState('error');
          setExplanation(t('mobile.riddle.errConnection'));
        }
      },
      'image/jpeg',
      0.85
    );
  }

  async function submitRiddle() {
    if (isExpired || !roundId) return;
    try {
      const letter = await Meteor.callAsync('rounds.submit', roundId, true);
      if (onCorrect) onCorrect(letter, true, roundId);
    } catch (err) {
      console.error('[rounds.submit] failed:', err.error || err.reason || err.message);
      setValidationState('error');
      setExplanation(t('mobile.riddle.errSubmissionNotSaved'));
    } finally {
      setUploading(false);
    }
  }

  if (!roundId) {
    return (
      <div className="px-5 pt-6 text-center font-mono text-xs uppercase tracking-[0.2em] text-muted">
        {t('mobile.riddle.loadingRound')}
      </div>
    );
  }

  const showCapturedPhoto =
    (uploading || validationState !== null) && capturedUrl;
  const inResultsMode = validationState !== null;

  return (
    <div className="flex flex-col flex-1">
      <div className="relative min-h-0 flex-1 overflow-hidden bg-black">
        {cameraError ? (
          // The camera area is black in every theme, so this text stays light.
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <p className="px-8 text-center font-mono text-xs uppercase tracking-widest text-white/70">
              {cameraError}
            </p>
            {!isExpired && (
              <button
                type="button"
                onClick={retryCamera}
                className="border border-white/60 px-5 py-2 font-mono text-xs uppercase tracking-widest text-white"
              >
                {t('mobile.dashboard.retry')}
              </button>
            )}
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
            alt={t('mobile.riddle.capturedAlt')}
            className="absolute inset-0 h-full w-full object-cover opacity-75"
          />
        )}

        {(validationState === 'fail' || validationState === 'error') && (
          <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-1 bg-ground/90 px-6 py-4">
            <span
              className={`font-mono text-xs uppercase tracking-widest ${
                validationState === 'error' ? 'text-muted' : 'text-incorrect'
              }`}
            >
              {validationState === 'error' ? t('mobile.riddle.couldntVerify') : t('mobile.riddle.notAMatch')}
            </span>
            {explanation && (
              <span className="text-center font-mono text-[11px] leading-5 text-muted">
                {explanation}
              </span>
            )}
          </div>
        )}

        {!uploading && !inResultsMode && !isExpired && !cameraError && (
          <>
            <div className="pointer-events-none absolute left-5 top-5 h-8 w-8 border-l-2 border-t-2 border-brand" />
            <div className="pointer-events-none absolute right-5 top-5 h-8 w-8 border-r-2 border-t-2 border-brand" />
            <div className="pointer-events-none absolute bottom-5 left-5 h-8 w-8 border-b-2 border-l-2 border-brand" />
            <div className="pointer-events-none absolute bottom-5 right-5 h-8 w-8 border-b-2 border-r-2 border-brand" />
          </>
        )}

        {uploading && (
          <>
            <div className="pointer-events-none absolute left-5 top-5 h-8 w-8 border-l-2 border-t-2 border-brand" />
            <div className="pointer-events-none absolute right-5 top-5 h-8 w-8 border-r-2 border-t-2 border-brand" />
            <div className="pointer-events-none absolute bottom-5 left-5 h-8 w-8 border-b-2 border-l-2 border-brand" />
            <div className="pointer-events-none absolute bottom-5 right-5 h-8 w-8 border-b-2 border-r-2 border-brand" />

            <div className="pointer-events-none absolute inset-5 overflow-hidden">
              <div className="scan-sweep absolute inset-x-0 h-0.5 bg-brand shadow-[0_0_8px_2px_rgb(var(--es-brand)/0.8)]" />
            </div>

            <div className="absolute inset-x-0 bottom-6 flex items-center justify-center">
              <span className="pulse-text bg-ground/80 px-4 py-2 font-mono text-xs uppercase tracking-[0.25em] text-muted">
                {t('mobile.riddle.analysing')}
              </span>
            </div>
          </>
        )}

        {isExpired && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-ground/80">
            <span className="font-mono text-3xl text-incorrect">✗</span>
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-incorrect">
              {t('mobile.riddle.roundEnded')}
            </span>
            <span className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-dim">
              {t('mobile.riddle.noSubmissionAccepted')}
            </span>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <div className="flex flex-shrink-0 items-center justify-center bg-ground py-5">
        {!isExpired && (
          <button
            onClick={handleCapture}
            disabled={uploading || !!cameraError}
            className="flex h-[72px] w-[72px] items-center justify-center rounded-full border-2 border-brand bg-brand text-on-brand transition active:scale-95 active:bg-brand-bright disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label={t('mobile.riddle.capturePhotoAria')}
          >
            <CameraIcon />
          </button>
        )}

        {isExpired && (
          <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full border-2 border-line bg-panel text-dim">
            <CameraIcon />
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileRiddlePage;
