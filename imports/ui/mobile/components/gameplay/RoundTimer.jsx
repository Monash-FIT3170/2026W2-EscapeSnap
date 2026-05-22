import React from 'react';

export function RoundTimer({ timeLeft, totalTime, compact = false }) {
  const size = compact ? 48 : 128;
  const radius = compact ? 18 : 52;
  const strokeWidth = compact ? 3 : 8;
  const circumference = 2 * Math.PI * radius;
  const fraction = Math.max(0, timeLeft / totalTime);
  const strokeDashoffset = circumference * (1 - fraction);
  const isLow = timeLeft > 0 && timeLeft <= 10;
  const isExpired = timeLeft <= 0;

  const ringColor = isExpired ? '#7f1d1d' : isLow ? '#ef4444' : '#dc2626';
  const textColor = isExpired ? '#7f1d1d' : isLow ? '#ef4444' : '#ffffff';

  const viewSize = compact ? 44 : 120;
  const cx = viewSize / 2;
  const cy = viewSize / 2;

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const ss = String(timeLeft % 60).padStart(2, '0');

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${viewSize} ${viewSize}`}
        style={{ transform: 'rotate(-90deg)' }}
        aria-label={isExpired ? "Time's up" : `${timeLeft} seconds remaining`}
      >
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#1e293b" strokeWidth={strokeWidth} />
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke={ringColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s' }}
        />
      </svg>

      <div className="absolute flex flex-col items-center select-none">
        {isExpired ? (
          <span className={`font-bold text-red-700 uppercase tracking-widest leading-tight text-center ${compact ? 'text-[7px]' : 'text-xs'}`}>
            TIME&apos;S<br />UP
          </span>
        ) : compact ? (
          <span className="font-mono font-bold tabular-nums leading-none" style={{ fontSize: 12, color: textColor }}>
            {mm}:{ss}
          </span>
        ) : (
          <>
            <span
              className="text-3xl font-mono font-bold leading-none"
              style={{ color: textColor, animation: isLow ? 'pulse 1s ease-in-out infinite' : 'none' }}
            >
              {timeLeft}
            </span>
            <span className="text-xs text-slate-500 uppercase tracking-wider mt-0.5">sec</span>
          </>
        )}
      </div>
    </div>
  );
}
