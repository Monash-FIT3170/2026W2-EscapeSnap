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
          background: '#8b0000',
          color: '#e5e2e1',
          fontSize: 13,
          letterSpacing: '1.5px',
          cursor: 'pointer',
          border: 'none',
        }}
        onMouseEnter={event => {
          event.currentTarget.style.background = '#a50000';
        }}
        onMouseLeave={event => {
          event.currentTarget.style.background = '#8b0000';
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
          color: '#aa8984',
          fontSize: 11,
          letterSpacing: '1.5px',
          cursor: 'pointer',
          border: '1px solid #353534',
        }}
      >
        {t('host.gameCompletion.viewGroupLeaderboard')}
      </button>
    </div>
  );
}
