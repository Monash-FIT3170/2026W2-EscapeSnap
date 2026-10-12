import React from 'react';
import PostGameLeaderboard from '../../components/leaderboard/PostGameLeaderboard';
import { useT } from '../../../../languages/LanguageProvider';

const LoseScreen = ({ gameId, onPlayAgain, onViewSummary, onViewLeaderboard }) => {
  const t = useT();
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'rgb(var(--es-ground))', color: 'rgb(var(--es-ink))' }}>

      <header className="px-8 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgb(var(--es-panel))' }}>
        <span className="font-display text-xl font-black tracking-wide text-brand">
          ESCAPESNAP
        </span>
        <span className="text-xs tracking-widest uppercase" style={{ color: 'rgb(var(--es-muted))' }}>
          {t('host.loseScreen.missionFailed')}
        </span>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <p className="text-xs tracking-widest" style={{ color: 'rgb(var(--es-brand))' }}>
          {t('host.loseScreen.missionFailed')}
        </p>

        <h1
          className="font-bold uppercase"
          style={{
            fontSize: '5rem',
            letterSpacing: '0.1em',
            lineHeight: 1,
            color: 'rgb(var(--es-ink))',
          }}
        >
          {t('host.loseScreen.noEscape')}
        </h1>

        <p className="uppercase" style={{ fontSize: 12, letterSpacing: '2px', color: 'rgb(var(--es-muted))' }}>
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
              background: 'rgb(var(--es-brand))',
              color: 'rgb(var(--es-on-brand))',
              fontSize: 13,
              letterSpacing: '1.5px',
              cursor: 'pointer',
              border: 'none',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgb(var(--es-brand-bright))')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgb(var(--es-brand))')}
          >
            {t('host.loseScreen.tryAgain')}
          </button>

          <button
            onClick={onViewLeaderboard}
            className="font-bold uppercase"
            style={{
              padding: '14px 64px',
              background: 'rgb(var(--es-brand))',
              color: 'rgb(var(--es-on-brand))',
              fontSize: 13,
              letterSpacing: '1.5px',
              cursor: 'pointer',
              border: 'none',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgb(var(--es-brand-bright))')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgb(var(--es-brand))')}
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
                color: 'rgb(var(--es-muted))',
                fontSize: 13,
                letterSpacing: '1.5px',
                cursor: 'pointer',
                border: '1px solid rgb(var(--es-line))',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgb(var(--es-ink))')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgb(var(--es-muted))')}
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
