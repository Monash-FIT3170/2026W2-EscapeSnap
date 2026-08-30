import React, { useRef, useEffect, useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { useT } from '../../../../languages/LanguageProvider';

// Widest edge of a captured frame, in px. Also bounds what gets stored on the
// submission, so keep it in step with the `photoUrl` cap in the schema.
const CAPTURE_MAX_WIDTH = 900;

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
      setCameraError(t('mobile.riddle.errCameraSecure'));
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
        ? t('mobile.riddle.errCameraPermission')
        : err.name === 'NotFoundError'
          ? t('mobile.riddle.errCameraNotFound')
          : t('mobile.riddle.errCameraUnavailable');
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
            if (result.outcome === 'fail' && onCorrect) onCorrect('?', false);
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
      if (onCorrect) onCorrect(letter, true);
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
      <div className="px-5 pt-6 text-center font-mono text-xs uppercase tracking-[0.2em] text-[#aa8984]">
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
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="px-8 text-center font-mono text-xs uppercase tracking-widest text-[#aa8984]">
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
            alt={t('mobile.riddle.capturedAlt')}
            className="absolute inset-0 h-full w-full object-cover opacity-75"
          />
        )}

        {(validationState === 'fail' || validationState === 'error') && (
          <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-1 bg-[#0e0e0e]/90 px-6 py-4">
            <span
              className={`font-mono text-xs uppercase tracking-widest ${
                validationState === 'error' ? 'text-[#aa8984]' : 'text-[#ef4444]'
              }`}
            >
              {validationState === 'error' ? t('mobile.riddle.couldntVerify') : t('mobile.riddle.notAMatch')}
            </span>
            {explanation && (
              <span className="text-center font-mono text-[11px] leading-5 text-[#aa8984]">
                {explanation}
              </span>
            )}
          </div>
        )}

        {!uploading && !inResultsMode && !isExpired && !cameraError && (
          <>
            <div className="pointer-events-none absolute left-5 top-5 h-8 w-8 border-l-2 border-t-2 border-[#8b0000]" />
            <div className="pointer-events-none absolute right-5 top-5 h-8 w-8 border-r-2 border-t-2 border-[#8b0000]" />
            <div className="pointer-events-none absolute bottom-5 left-5 h-8 w-8 border-b-2 border-l-2 border-[#8b0000]" />
            <div className="pointer-events-none absolute bottom-5 right-5 h-8 w-8 border-b-2 border-r-2 border-[#8b0000]" />
          </>
        )}

        {uploading && (
          <>
            <div className="pointer-events-none absolute left-5 top-5 h-8 w-8 border-l-2 border-t-2 border-[#8b0000]" />
            <div className="pointer-events-none absolute right-5 top-5 h-8 w-8 border-r-2 border-t-2 border-[#8b0000]" />
            <div className="pointer-events-none absolute bottom-5 left-5 h-8 w-8 border-b-2 border-l-2 border-[#8b0000]" />
            <div className="pointer-events-none absolute bottom-5 right-5 h-8 w-8 border-b-2 border-r-2 border-[#8b0000]" />

            <div className="pointer-events-none absolute inset-5 overflow-hidden">
              <div className="scan-sweep absolute inset-x-0 h-0.5 bg-[#8b0000] shadow-[0_0_8px_2px_rgba(139,0,0,0.8)]" />
            </div>

            <div className="absolute inset-x-0 bottom-6 flex items-center justify-center">
              <span className="pulse-text bg-[#0e0e0e]/80 px-4 py-2 font-mono text-xs uppercase tracking-[0.25em] text-[#aa8984]">
                {t('mobile.riddle.analysing')}
              </span>
            </div>
          </>
        )}

        {isExpired && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#0e0e0e]/80">
            <span className="font-mono text-3xl text-[#ef4444]">✗</span>
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-[#ef4444]">
              {t('mobile.riddle.roundEnded')}
            </span>
            <span className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-[#555]">
              {t('mobile.riddle.noSubmissionAccepted')}
            </span>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <div className="flex flex-shrink-0 items-center justify-center bg-[#0e0e0e] py-5">
        {!isExpired && (
          <button
            onClick={handleCapture}
            disabled={uploading || !!cameraError}
            className="flex h-[72px] w-[72px] items-center justify-center rounded-full border-2 border-[#8b0000] bg-[#8b0000] text-[#e5e2e1] transition active:scale-95 active:bg-[#a50000] disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label={t('mobile.riddle.capturePhotoAria')}
          >
            <CameraIcon />
          </button>
        )}

        {isExpired && (
          <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full border-2 border-[#353534] bg-[#1c1b1b] text-[#555]">
            <CameraIcon />
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileRiddlePage;
