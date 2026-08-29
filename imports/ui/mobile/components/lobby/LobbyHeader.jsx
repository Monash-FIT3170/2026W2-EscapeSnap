import React from 'react';
import { useT } from '../../../../languages/LanguageProvider';
import { LanguagePicker } from '../../../../languages/LanguagePicker';

export function LobbyHeader({ unitLabel = 'OPERATIONAL_UNIT_01', playerCount = 0, onExit }) {
  const t = useT();

  return (
    <header className="flex items-center justify-between px-1 py-2 gap-3">

      {/* Language picker — top left (locked once the riddle starts) */}
      <div className="flex-shrink-0">
        <LanguagePicker compact align="left" />
      </div>

      {/* Game code */}
      <h1 className="flex-1 font-mono text-xl font-semibold tracking-wide text-slate-100">
        {unitLabel}
      </h1>

      {/* Icons + Exit */}
      <div className="flex items-center gap-3 text-slate-300">
        <button type="button" className="relative rounded-full p-1 transition hover:text-red-400">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
            <circle cx="9.5" cy="7.5" r="3.5" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          {playerCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
              {playerCount}
            </span>
          )}
        </button>

        <button type="button" className="rounded-full p-1 text-red-500 transition hover:text-red-300">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>

        {onExit && (
          <button
            type="button"
            onClick={onExit}
            className="border border-red-600 bg-red-600/10 px-4 py-2 font-mono text-xs font-semibold uppercase tracking-widest text-red-400 transition hover:bg-red-600 hover:text-white"
          >
            {t('common.exit')}
          </button>
        )}
      </div>
    </header>
  );
}
