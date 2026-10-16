import React from 'react';
import { useT } from '../../../../languages/LanguageProvider';

export default function GameCompletionActions({
  playAgainLabel,
  onPlayAgain,
  onViewLeaderboard,
}) {
  const t = useT();
  return (
    <div className="mt-10 flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={onPlayAgain}
        className="font-bold uppercase transition-colors duration-200"
        style={{
          padding: '14px 64px',
          background: 'rgb(var(--es-brand))',
          color: 'rgb(var(--es-on-brand))',
          fontSize: 13,
          letterSpacing: '1.5px',
          cursor: 'pointer',
          border: 'none',
        }}
        onMouseEnter={event => {
          event.currentTarget.style.background = 'rgb(var(--es-brand-bright))';
        }}
        onMouseLeave={event => {
          event.currentTarget.style.background = 'rgb(var(--es-brand))';
        }}
      >
        {playAgainLabel}
      </button>

      <button
        type="button"
        onClick={onViewLeaderboard}
        className="uppercase transition-colors duration-200"
        style={{
          padding: '10px 32px',
          background: 'transparent',
          color: 'rgb(var(--es-muted))',
          fontSize: 11,
          letterSpacing: '1.5px',
          cursor: 'pointer',
          border: '1px solid rgb(var(--es-line))',
        }}
      >
        {t('host.gameCompletion.viewGroupLeaderboard')}
      </button>
    </div>
  );
}
