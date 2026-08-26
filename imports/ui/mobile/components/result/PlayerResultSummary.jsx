// React must remain in scope for Meteor's classic JSX transform.
// eslint-disable-next-line no-unused-vars
import React from 'react';
import { usePlayerResult } from '/imports/ui/shared/hooks/useGameResults';
import { BadgeList } from '/imports/ui/shared/components/achievements/BadgeList';

export function PlayerResultSummary({ playerId }) {
  const { loading, result } = usePlayerResult(playerId);

  if (loading) {
    return (
      <p className="font-mono text-xs uppercase tracking-widest text-slate-600">
        Loading awards...
      </p>
    );
  }
  if (!result) return null;

  return (
    <section className="w-full border border-slate-800 bg-slate-950/60 px-5 py-4 text-left">
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">
        Final rank #{result.rank}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <span className="font-mono text-sm font-bold uppercase tracking-wider text-white">
          {result.playerName}
        </span>
        <BadgeList badges={result.badges} size={25} />
      </div>
      <p className="mt-3 font-mono text-[11px] uppercase tracking-wider text-slate-500">
        {result.stats.correctCount}/{result.stats.totalRounds} solved ·{' '}
        {result.stats.accuracyPercent}% accuracy
      </p>
    </section>
  );
}
