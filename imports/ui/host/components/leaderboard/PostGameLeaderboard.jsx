// React must remain in scope for Meteor's classic JSX transform.
import React from 'react';
import { useGameResults } from '/imports/ui/shared/hooks/useGameResults';
import { BadgeList } from '/imports/ui/shared/components/achievements/BadgeList';
import { useT } from '../../../../languages/LanguageProvider';

function formatSolveTime(milliseconds) {
  if (!Number.isFinite(milliseconds)) return '—';
  const totalSeconds = Math.max(0, Math.round(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0
    ? `${minutes}m ${String(seconds).padStart(2, '0')}s`
    : `${seconds}s`;
}

export default function PostGameLeaderboard({ gameId }) {
  const t = useT();
  const { loading, results } = useGameResults(gameId);

  return (
    <section
      aria-labelledby="post-game-leaderboard-title"
      style={{ background: '#151515', border: '1px solid #353534' }}
    >
      <div
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: '1px solid #353534' }}
      >
        <div className="flex items-center gap-3">
          <div style={{ width: 4, height: 18, background: '#8b0000' }} />
          <h2
            id="post-game-leaderboard-title"
            className="font-bold uppercase"
            style={{ color: '#e5e2e1', fontSize: 14, letterSpacing: '1.5px' }}
          >
            {t('host.leaderboard.finalLeaderboard')}
          </h2>
        </div>
        <span
          className="font-mono uppercase"
          style={{ color: '#aa8984', fontSize: 9 }}
        >
          {t('host.leaderboard.hoverBadgeHint')}
        </span>
      </div>

      {loading && (
        <p
          className="px-6 py-8 text-center font-mono"
          style={{ color: '#aa8984', fontSize: 11 }}
        >
          {t('host.leaderboard.calculatingResults')}
        </p>
      )}

      {!loading && results.length === 0 && (
        <p
          className="px-6 py-8 text-center font-mono"
          style={{ color: '#aa8984', fontSize: 11 }}
        >
          {t('host.leaderboard.noPlayerResults')}
        </p>
      )}

      {!loading && results.length > 0 && (
        <div style={{ overflow: 'visible' }}>
          <div
            className="grid min-w-[720px] px-6 py-3 font-mono uppercase"
            style={{
              gridTemplateColumns: '64px minmax(280px, 1fr) 110px 110px 130px',
              background: '#0e0e0e',
              color: '#aa8984',
              fontSize: 9,
              letterSpacing: '1px',
            }}
          >
            <span>{t('host.leaderboard.rank')}</span>
            <span>{t('host.leaderboard.playerAndAchievements')}</span>
            <span className="text-center">{t('host.leaderboard.solved')}</span>
            <span className="text-center">{t('host.leaderboard.accuracy')}</span>
            <span className="text-right">{t('host.leaderboard.fastest')}</span>
          </div>

          {results.map((result, index) => (
            <div
              key={result.playerId}
              className="grid min-w-[720px] items-center px-6 py-4"
              style={{
                gridTemplateColumns:
                  '64px minmax(280px, 1fr) 110px 110px 130px',
                borderTop: index > 0 ? '1px solid #292929' : 'none',
              }}
            >
              <span
                className="font-mono font-bold"
                style={{ color: '#aa8984', fontSize: 13 }}
              >
                #{String(result.rank).padStart(2, '0')}
              </span>
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="truncate font-bold uppercase"
                  style={{
                    color: '#e5e2e1',
                    fontSize: 13,
                    letterSpacing: '0.8px',
                  }}
                >
                  {result.playerName}
                </span>
                <BadgeList badges={result.badges} size={23} />
              </div>
              <span
                className="text-center font-mono"
                style={{ color: '#e5e2e1', fontSize: 12 }}
              >
                {result.stats.correctCount}/{result.stats.totalRounds}
              </span>
              <span
                className="text-center font-mono"
                style={{ color: '#e5e2e1', fontSize: 12 }}
              >
                {result.stats.accuracyPercent}%
              </span>
              <span
                className="text-right font-mono"
                style={{ color: '#e5e2e1', fontSize: 12 }}
              >
                {formatSolveTime(result.stats.fastestSolveMs)}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
