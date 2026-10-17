// React must remain in scope for Meteor's classic JSX transform.
import React from 'react';
import { usePlayerResult } from '/imports/ui/shared/hooks/useGameResults';
import { BadgeList } from '/imports/ui/shared/components/achievements/BadgeList';
import { useT } from '../../../../languages/LanguageProvider';

export function PlayerResultSummary({ playerId }) {
  const t = useT();
  const { loading, result } = usePlayerResult(playerId);

  if (loading) {
    return (
      <p className="pulse-text font-display text-base text-dim">
        {t('mobile.share.loadingAwards')}
      </p>
    );
  }
  if (!result) return null;

  return (
    <section className="es-plate w-full px-5 py-4 text-left">
      <p className="es-label">
        {t('mobile.share.finalRank', { n: result.rank })}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <span className="es-title text-2xl text-ink">
          {result.playerName}
        </span>
        <BadgeList badges={result.badges} size={25} />
      </div>
      <p className="mt-3 font-display text-base tracking-[0.02em] text-muted">
        {t('mobile.share.solvedAccuracy', {
          correct: result.stats.correctCount,
          total: result.stats.totalRounds,
          accuracy: result.stats.accuracyPercent,
        })}
      </p>
    </section>
  );
}
