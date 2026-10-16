import React from 'react';
import PostGameLeaderboard from '../../components/leaderboard/PostGameLeaderboard';
import { useT } from '../../../../languages/LanguageProvider';

const WinScreen = ({ gameId, onPlayAgain, onViewSummary, onViewLeaderboard }) => {
  const t = useT();
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'rgb(var(--es-ground))', color: 'rgb(var(--es-ink))' }}>

      <header className="px-8 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgb(var(--es-panel))' }}>
        <span className="font-display text-xl font-black tracking-wide text-brand">
          ESCAPESNAP
        </span>
        <span className="text-xs tracking-widest uppercase" style={{ color: 'rgb(var(--es-muted))' }}>
          {t('host.winScreen.missionComplete')}
        </span>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center">
        <p className="text-xs tracking-widest mb-3" style={{ color: 'rgb(var(--es-brand))' }}>
          {t('host.winScreen.missionSuccess')}
        </p>
        <h1
          className="font-extrabold uppercase mb-4"
          style={{
            color: 'rgb(var(--es-ink))',
            fontSize: '6rem',
            letterSpacing: '0.1em',
            lineHeight: 1,
          }}
        >
          {t('host.winScreen.youEscaped')}
        </h1>

        <p
          className="uppercase mb-16"
          style={{ letterSpacing: '0.3em', fontSize: '1rem', color: 'rgb(var(--es-muted))' }}
        >
          {t('host.winScreen.riddleSolved')}
        </p>

          <div className="w-full mb-12">
            <PostGameLeaderboard gameId={gameId} />
          </div>

        <div className="flex items-center gap-4">
          <button
            onClick={onPlayAgain}
            className="font-bold uppercase transition-colors duration-200"
            style={{
              background: 'rgb(var(--es-brand))',
              color: 'rgb(var(--es-on-brand))',
              letterSpacing: '0.2em',
              fontSize: '1rem',
              padding: '1rem 4rem',
              border: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgb(var(--es-brand-bright))')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgb(var(--es-brand))')}
          >
            {t('host.winScreen.playAgain')}
          </button>

          <button
            onClick={onViewLeaderboard}
            className="font-bold uppercase transition-colors duration-200"
            style={{
              background: 'rgb(var(--es-brand))',
              color: 'rgb(var(--es-on-brand))',
              letterSpacing: '0.2em',
              fontSize: '1rem',
              padding: '1rem 4rem',
              border: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgb(var(--es-brand-bright))')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgb(var(--es-brand))')}
          >
            {t('host.winScreen.viewLeaderboard')}
          </button>

          {onViewSummary && (
            <button
              onClick={onViewSummary}
              className="font-bold uppercase transition-colors duration-200"
              style={{
                background: 'transparent',
                color: 'rgb(var(--es-muted))',
                letterSpacing: '0.2em',
                fontSize: '1rem',
                padding: '1rem 4rem',
                border: '1px solid rgb(var(--es-line))',
                cursor: 'pointer',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgb(var(--es-ink))')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgb(var(--es-muted))')}
            >
              {t('host.winScreen.viewDebrief')}
            </button>
          )}
        </div>
      </div>

    </div>
  );
};

export default WinScreen;
