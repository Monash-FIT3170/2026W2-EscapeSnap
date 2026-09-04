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
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#555]">
        {t('mobile.share.loadingAwards')}
      </p>
    );
  }
  if (!result) return null;

  return (
    <section className="w-full border border-[#353534] bg-[#1c1b1b] px-5 py-4 text-left">
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#aa8984]">
        {t('mobile.share.finalRank', { n: result.rank })}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <span className="font-mono text-sm font-bold uppercase tracking-[0.15em] text-[#e5e2e1]">
          {result.playerName}
        </span>
        <BadgeList badges={result.badges} size={25} />
      </div>
      <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.15em] text-[#aa8984]">
        {t('mobile.share.solvedAccuracy', {
          correct: result.stats.correctCount,
          total: result.stats.totalRounds,
          accuracy: result.stats.accuracyPercent,
        })}
      </p>
    </section>
  );
}
