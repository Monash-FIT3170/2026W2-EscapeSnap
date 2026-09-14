import React from 'react';
import { useT } from '../../../../languages/LanguageProvider';
import { LanguagePicker } from '../../../../languages/LanguagePicker';
import { BRAND, INK, LABEL, LINE } from './theme';

export default function LandingHeader() {
  const t = useT();

  return (
    <header
      className="px-6 md:px-12 py-4 flex items-center justify-between gap-4"
      style={{ borderBottom: `1px solid ${LINE}` }}
    >
      <div className="flex items-center gap-4">
        <span
          className="font-display text-lg font-bold tracking-widest"
          style={{ color: INK }}
        >
          ESCAPESNAP
        </span>
        {/* Carries over the status line from the player terminal. */}
        <span className="hidden sm:flex items-center gap-2">
          <span
            className="h-1.5 w-1.5 rounded-full animate-pulse"
            style={{ background: BRAND }}
          />
          <span className="font-mono text-xs uppercase" style={LABEL}>
            {t('mobile.home.systemOnline')}
          </span>
        </span>
      </div>
      <LanguagePicker />
    </header>
  );
}
