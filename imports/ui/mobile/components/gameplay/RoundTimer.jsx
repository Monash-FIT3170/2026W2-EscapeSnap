// Meteor's JSX transform still requires React in module scope.
// eslint-disable-next-line no-unused-vars
import React from 'react';
import { COLORS } from '../../theme';
import { useT } from '../../../../languages/LanguageProvider';

const SIZE = 48;
const VIEW = 44;
const RADIUS = 18;
const STROKE = 3;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// Ring + mm:ss for the whole-game clock, sized for the dashboard header.
export function RoundTimer({ timeLeft, totalTime }) {
  const t = useT();
  const fraction = totalTime > 0 ? Math.min(1, Math.max(0, timeLeft / totalTime)) : 0;
  const isExpired = timeLeft <= 0;
  // The last minute is the one worth reacting to on a game-length clock.
  const isLow = !isExpired && timeLeft <= 60;

  const color = isExpired ? COLORS.dim : isLow ? COLORS.incorrect : COLORS.text;
  const mm = String(Math.floor(Math.max(0, timeLeft) / 60)).padStart(2, '0');
  const ss = String(Math.max(0, timeLeft) % 60).padStart(2, '0');

  return (
    <div className="relative flex items-center justify-center" style={{ width: SIZE, height: SIZE }}>
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${VIEW} ${VIEW}`}
        style={{ transform: 'rotate(-90deg)' }}
        role="img"
        aria-label={
          isExpired
            ? t('mobile.roundTimer.timesUpAria')
            : t('mobile.roundTimer.secondsRemainingAria', { n: timeLeft })
        }
      >
        <circle cx={VIEW / 2} cy={VIEW / 2} r={RADIUS} fill="none" stroke={COLORS.border} strokeWidth={STROKE} />
        <circle
          cx={VIEW / 2}
          cy={VIEW / 2}
          r={RADIUS}
          fill="none"
          stroke={isExpired ? COLORS.dim : COLORS.accent}
          strokeWidth={STROKE}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - fraction)}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s' }}
        />
      </svg>

      <span className="absolute select-none text-center leading-none" aria-hidden="true">
        {isExpired ? (
          <span className="font-mono text-[7px] font-bold uppercase tracking-widest" style={{ color: COLORS.incorrect }}>
            {t('mobile.roundTimer.timesUpLine1')}
            <br />
            {t('mobile.roundTimer.timesUpLine2')}
          </span>
        ) : (
          <span className="font-mono text-[11px] font-bold tabular-nums" style={{ color }}>
            {mm}:{ss}
          </span>
        )}
      </span>
    </div>
  );
}
