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

const COLUMNS = '64px minmax(280px, 1fr) 110px 110px 130px';

export default function PostGameLeaderboard({ gameId }) {
  const t = useT();
  const { loading, results } = useGameResults(gameId);

  return (
    <section aria-labelledby="post-game-leaderboard-title" className="es-plate overflow-x-auto">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line px-6 py-4">
        <h2 id="post-game-leaderboard-title" className="es-title text-2xl text-ink">
          {t('host.leaderboard.finalLeaderboard')}
        </h2>
        <span className="text-sm text-muted">{t('host.leaderboard.hoverBadgeHint')}</span>
      </div>

      {loading && (
        <p className="pulse-text px-6 py-8 text-center text-muted">
          {t('host.leaderboard.calculatingResults')}
        </p>
      )}

      {!loading && results.length === 0 && (
        <p className="px-6 py-8 text-center text-muted">{t('host.leaderboard.noPlayerResults')}</p>
      )}

      {!loading && results.length > 0 && (
        <div style={{ overflow: 'visible' }}>
          <div
            className="es-label grid min-w-[720px] px-6 py-3"
            style={{ gridTemplateColumns: COLUMNS }}
          >
            <span>{t('host.leaderboard.rank')}</span>
            <span>{t('host.leaderboard.playerAndAchievements')}</span>
            <span className="text-center">{t('host.leaderboard.solved')}</span>
            <span className="text-center">{t('host.leaderboard.accuracy')}</span>
            <span className="text-right">{t('host.leaderboard.fastest')}</span>
          </div>

          {results.map((result) => (
            <div
              key={result.playerId}
              className="grid min-w-[720px] items-center border-t border-line/70 px-6 py-4"
              style={{ gridTemplateColumns: COLUMNS }}
            >
              <span
                className={`font-display text-2xl font-semibold tabular-nums ${
                  result.rank === 1 ? 'es-lcd-text' : 'text-muted'
                }`}
              >
                {String(result.rank).padStart(2, '0')}
              </span>
              <div className="flex min-w-0 items-center gap-3">
                <span className="truncate font-display text-xl font-semibold tracking-[0.02em] text-ink">
                  {result.playerName}
                </span>
                <BadgeList badges={result.badges} size={23} />
              </div>
              <span className="text-center font-display text-lg tabular-nums text-ink">
                {result.stats.correctCount}/{result.stats.totalRounds}
              </span>
              <span className="text-center font-display text-lg tabular-nums text-ink">{result.stats.accuracyPercent}%</span>
              <span className="text-right font-display text-lg tabular-nums text-ink">
                {formatSolveTime(result.stats.fastestSolveMs)}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
