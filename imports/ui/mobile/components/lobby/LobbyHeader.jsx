import React from 'react';

export function LobbyHeader({ unitLabel = 'OPERATIONAL_UNIT_01', playerCount = 0, onExit }) {
  return (
    <header className="flex items-center justify-between px-1 py-2">
      <h1 className="font-mono text-xl font-semibold tracking-wide text-slate-100">
        {unitLabel}
      </h1>

      <div className="flex items-center gap-4 text-slate-300">
        <button type="button" className="rounded-full p-1 transition hover:text-red-400">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
        </button>

        <button type="button" className="relative rounded-full p-1 transition hover:text-red-400">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
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
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>

        {onExit && (
          <button
            type="button"
            onClick={onExit}
            className="border border-slate-800/80 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-slate-500 transition hover:border-red-500/60 hover:text-red-400"
          >
            Exit
          </button>
        )}
      </div>
    </header>
  );
}
