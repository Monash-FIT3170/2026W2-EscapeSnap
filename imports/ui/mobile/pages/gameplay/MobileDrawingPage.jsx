import React, { useRef, useEffect, useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { useT } from '../../../../languages/LanguageProvider';
import { COLORS } from '../../theme';

// Widest edge of the exported sketch, in px. Matches CAPTURE_MAX_WIDTH on the
// camera page so stored submissions stay within the `photoUrl` cap.
const EXPORT_MAX_EDGE = 900;
// Stroke widths in CSS px; scaled to the canvas's device-pixel backing store.
const PEN_WIDTH = 6;
const ERASER_WIDTH = 28;

function Icon({ children }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      {children}
    </svg>
  );
}

function PenIcon() {
  return (
    <Icon>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </Icon>
  );
}

function EraserIcon() {
  return (
    <Icon>
      <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
      <path d="M22 21H7" />
      <path d="m5 11 9 9" />
    </Icon>
  );
}

function TrashIcon() {
  return (
    <Icon>
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </Icon>
  );
}

// `pressed` is only passed for the Draw/Erase toggle; Clear is a plain action.
function ToolButton({ pressed, disabled, onClick, label, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={pressed}
      className="flex flex-col items-center justify-center gap-1 py-3 font-mono text-[10px] uppercase tracking-[0.2em] transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
      style={{
        border: `1px solid ${pressed ? COLORS.accent : COLORS.border}`,
        background: pressed ? '#1c0000' : 'transparent',
        color: pressed ? COLORS.text : COLORS.muted,
      }}
    >
      {children}
      <span>{label}</span>
    </button>
  );
}

function Corners() {
  return (
    <>
      <div className="pointer-events-none absolute left-5 top-5 h-8 w-8 border-l-2 border-t-2 border-[#8b0000]" />
      <div className="pointer-events-none absolute right-5 top-5 h-8 w-8 border-r-2 border-t-2 border-[#8b0000]" />
      <div className="pointer-events-none absolute bottom-5 left-5 h-8 w-8 border-b-2 border-l-2 border-[#8b0000]" />
      <div className="pointer-events-none absolute bottom-5 right-5 h-8 w-8 border-b-2 border-r-2 border-[#8b0000]" />
    </>
  );
}

function paintBackground(canvas) {
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = COLORS.panel;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

const MobileDrawingPage = ({
  roundId,
  targetObject,
  isExpired = false,
  onCorrect,
}) => {
  const t = useT();
  const canvasRef = useRef(null);
  // { pointerId, last } while a stroke is in progress; one pointer at a time
  // so a second finger or a resting palm can't draw a jump line.
  const strokeRef = useRef(null);

  const [tool, setTool] = useState('draw');
  const [hasStrokes, setHasStrokes] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [validationState, setValidationState] = useState(null);
  const [explanation, setExplanation] = useState(null);

  // Keep the backing store at device-pixel resolution. Resizing a canvas
  // wipes it, so the existing sketch is copied across (rotation keeps the
  // drawing at its original pixel size rather than stretching it).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    function fit() {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = Math.round(rect.width * dpr);
      const height = Math.round(rect.height * dpr);
      if (!width || !height) return;
      if (canvas.width === width && canvas.height === height) return;

      const snapshot = document.createElement('canvas');
      snapshot.width = canvas.width;
      snapshot.height = canvas.height;
      snapshot.getContext('2d').drawImage(canvas, 0, 0);

      canvas.width = width;
      canvas.height = height;
      paintBackground(canvas);
      canvas.getContext('2d').drawImage(snapshot, 0, 0);
    }

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [roundId]);

  const canDraw = !isExpired && !uploading;

  function toCanvasPoint(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scale = canvas.width / rect.width;
    return {
      x: (e.clientX - rect.left) * scale,
      y: (e.clientY - rect.top) * scale,
      scale,
    };
  }

  function strokeSegment(from, to) {
    const ctx = canvasRef.current.getContext('2d');
    ctx.strokeStyle = tool === 'erase' ? COLORS.panel : COLORS.text;
    ctx.lineWidth = (tool === 'erase' ? ERASER_WIDTH : PEN_WIDTH) * to.scale;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  }

  function handlePointerDown(e) {
    if (!canDraw || strokeRef.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const point = toCanvasPoint(e);
    strokeRef.current = { pointerId: e.pointerId, last: point };
    strokeSegment(point, point); // a tap leaves a dot
    if (tool === 'draw') setHasStrokes(true);
    if (validationState) {
      setValidationState(null);
      setExplanation(null);
    }
  }

  function handlePointerMove(e) {
    const stroke = strokeRef.current;
    if (!stroke || stroke.pointerId !== e.pointerId) return;
    const point = toCanvasPoint(e);
    strokeSegment(stroke.last, point);
    stroke.last = point;
  }

  function endStroke(e) {
    if (strokeRef.current?.pointerId === e.pointerId) strokeRef.current = null;
  }

  function handleClear() {
    paintBackground(canvasRef.current);
    setHasStrokes(false);
    setTool('draw');
    setValidationState(null);
    setExplanation(null);
  }

  function exportSketch() {
    const canvas = canvasRef.current;
    const scale = Math.min(
      1,
      EXPORT_MAX_EDGE / Math.max(canvas.width, canvas.height)
    );
    const out = document.createElement('canvas');
    out.width = Math.round(canvas.width * scale);
    out.height = Math.round(canvas.height * scale);
    out.getContext('2d').drawImage(canvas, 0, 0, out.width, out.height);
    return out.toDataURL('image/png').split(',')[1];
  }

  async function submitRiddle() {
    try {
      const letter = await Meteor.callAsync('rounds.submit', roundId, true);
      if (onCorrect) onCorrect(letter, true);
    } catch (err) {
      console.error(
        '[rounds.submit] failed:',
        err.error || err.reason || err.message
      );
      setValidationState('error');
      setExplanation(t('mobile.riddle.errSubmissionNotSaved'));
    }
  }

  async function handleSubmit() {
    if (!canDraw || !hasStrokes || !roundId) return;

    const base64 = exportSketch();
    setValidationState(null);
    setExplanation(null);
    setUploading(true);

    try {
      const result = await Meteor.callAsync(
        'submissions.classify',
        base64,
        targetObject ?? 'object',
        roundId,
        'drawing'
      );
      setValidationState(result.outcome);
      setExplanation(result.explanation || null);

      if (result.outcome === 'pass') {
        await submitRiddle();
      } else if (result.outcome === 'fail' && onCorrect) {
        onCorrect('?', false);
      }
    } catch (err) {
      console.error(
        '[submissions.classify] failed:',
        err.error || err.reason || err.message
      );
      setValidationState('error');
      setExplanation(t('mobile.riddle.errConnection'));
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

  const showResult = validationState === 'fail' || validationState === 'error';

  return (
    <div className="flex flex-col flex-1">
      <div className="relative min-h-0 flex-1 overflow-hidden bg-[#1c1b1b]">
        <canvas
          ref={canvasRef}
          aria-label={t('mobile.riddle.canvasAria')}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endStroke}
          onPointerCancel={endStroke}
          className="absolute inset-0 h-full w-full touch-none"
        />

        {!hasStrokes && !isExpired && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-[#555]">
              {t('mobile.riddle.drawPrompt')}
            </span>
          </div>
        )}

        {!isExpired && <Corners />}

        {uploading && (
          <>
            <div className="pointer-events-none absolute inset-5 overflow-hidden">
              <div className="scan-sweep absolute inset-x-0 h-0.5 bg-[#8b0000] shadow-[0_0_8px_2px_rgba(139,0,0,0.8)]" />
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-6 flex items-center justify-center">
              <span className="pulse-text bg-[#0e0e0e]/80 px-4 py-2 font-mono text-xs uppercase tracking-[0.25em] text-[#aa8984]">
                {t('mobile.riddle.analysing')}
              </span>
            </div>
          </>
        )}

        {showResult && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-1 bg-[#0e0e0e]/90 px-6 py-4">
            <span
              className={`font-mono text-xs uppercase tracking-widest ${
                validationState === 'error'
                  ? 'text-[#aa8984]'
                  : 'text-[#ef4444]'
              }`}
            >
              {validationState === 'error'
                ? t('mobile.riddle.couldntVerify')
                : t('mobile.riddle.notAMatch')}
            </span>
            {explanation && (
              <span className="text-center font-mono text-[11px] leading-5 text-[#aa8984]">
                {explanation}
              </span>
            )}
          </div>
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

      {!isExpired && (
        <div className="flex-shrink-0 space-y-3 bg-[#0e0e0e] px-5 pb-5 pt-4">
          <div className="grid grid-cols-3 gap-2">
            <ToolButton
              pressed={tool === 'draw'}
              disabled={uploading}
              onClick={() => setTool('draw')}
              label={t('mobile.riddle.toolDraw')}
            >
              <PenIcon />
            </ToolButton>
            <ToolButton
              pressed={tool === 'erase'}
              disabled={uploading}
              onClick={() => setTool('erase')}
              label={t('mobile.riddle.toolErase')}
            >
              <EraserIcon />
            </ToolButton>
            <ToolButton
              disabled={uploading || !hasStrokes}
              onClick={handleClear}
              label={t('mobile.riddle.toolClear')}
            >
              <TrashIcon />
            </ToolButton>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={uploading || !hasStrokes}
            className="w-full bg-[#8b0000] py-4 font-mono text-sm uppercase tracking-[0.25em] text-[#e5e2e1] transition active:bg-[#a50000] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {uploading
              ? t('mobile.riddle.analysing')
              : t('mobile.riddle.submitSketch')}
          </button>
        </div>
      )}
    </div>
  );
};

export default MobileDrawingPage;
