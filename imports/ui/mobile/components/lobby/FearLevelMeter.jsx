import React from 'react';
import { useT } from '../../../../languages/LanguageProvider';

export function FearLevelMeter({
  value = 0,
  label,
}) {
  const t = useT();
  const resolvedLabel = label ?? t('mobile.lobby.fearLevelStabilizing');
  const clamped = Math.min(100, Math.max(0, Math.round(value)));

  return (
    <section className="px-1 pt-3" aria-label={t('mobile.lobby.fearLevelAria')}>
      <div className="flex items-center justify-between font-mono text-[11px] tracking-[0.25em] text-slate-300">
        <span>{resolvedLabel}</span>
        <span className="text-white">{clamped}%</span>
      </div>

      <progress
        className="progress progress-error mt-2 h-1.5 w-full"
        value={clamped}
        max={100}
        aria-label={resolvedLabel}
      />
    </section>
  );
}
