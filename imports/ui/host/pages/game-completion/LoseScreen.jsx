import React from 'react';
import PostGameLeaderboard from '../../components/leaderboard/PostGameLeaderboard';
import { useT } from '../../../../languages/LanguageProvider';

const LoseScreen = ({ gameId, onPlayAgain, onViewSummary, onViewLeaderboard }) => {
  const t = useT();
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0e0e0e', color: '#e5e2e1' }}>

      <header className="px-8 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #1c1b1b' }}>
        <span className="font-bold text-xl tracking-widest uppercase" style={{ color: '#e5e2e1' }}>
          ESCAPESNAP
        </span>
        <span className="text-xs tracking-widest uppercase" style={{ color: '#aa8984' }}>
          {t('host.loseScreen.missionFailed')}
        </span>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <p className="text-xs tracking-widest" style={{ color: '#8b0000' }}>
          {t('host.loseScreen.missionFailed')}
        </p>

        <h1
          className="font-bold uppercase"
          style={{
            fontSize: '5rem',
            letterSpacing: '0.1em',
            lineHeight: 1,
            color: '#e5e2e1',
          }}
        >
          {t('host.loseScreen.noEscape')}
        </h1>

        <p className="uppercase" style={{ fontSize: 12, letterSpacing: '2px', color: '#aa8984' }}>
          {t('host.loseScreen.riddleUnsolved')}
        </p>

        <div className="mt-6 w-full mb-12">
          <PostGameLeaderboard gameId={gameId} />
        </div>

        <div className="flex items-center gap-4" style={{ marginTop: 32 }}>
          <button
            onClick={onPlayAgain}
            className="font-bold uppercase"
            style={{
              padding: '14px 64px',
              background: '#8b0000',
              color: '#e5e2e1',
              fontSize: 13,
              letterSpacing: '1.5px',
              cursor: 'pointer',
              border: 'none',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#a50000')}
            onMouseLeave={e => (e.currentTarget.style.background = '#8b0000')}
          >
            {t('host.loseScreen.tryAgain')}
          </button>

          <button
            onClick={onViewLeaderboard}
            className="font-bold uppercase"
            style={{
              padding: '14px 64px',
              background: '#8b0000',
              color: '#e5e2e1',
              fontSize: 13,
              letterSpacing: '1.5px',
              cursor: 'pointer',
              border: 'none',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#a50000')}
            onMouseLeave={e => (e.currentTarget.style.background = '#8b0000')}
          >
            {t('host.loseScreen.viewLeaderboard')}
          </button>

          {onViewSummary && (
            <button
              onClick={onViewSummary}
              className="font-bold uppercase"
              style={{
                padding: '14px 64px',
                background: 'transparent',
                color: '#aa8984',
                fontSize: 13,
                letterSpacing: '1.5px',
                cursor: 'pointer',
                border: '1px solid #353534',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#e5e2e1')}
              onMouseLeave={e => (e.currentTarget.style.color = '#aa8984')}
            >
              {t('host.loseScreen.viewDebrief')}
            </button>
          )}
        </div>
      </div>

    </div>
  );
};

export default LoseScreen;
