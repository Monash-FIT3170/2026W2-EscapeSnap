// Meteor's JSX transform still requires React in module scope.
// eslint-disable-next-line no-unused-vars
import React from 'react';
import { useT } from '../../../../languages/LanguageProvider';

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function HourglassIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <path d="M6 3h12M6 21h12" />
      <path d="M7 3v3a5 5 0 0 0 2.5 4.33L12 12l-2.5 1.67A5 5 0 0 0 7 18v3" />
      <path d="M17 3v3a5 5 0 0 1-2.5 4.33L12 12l2.5 1.67A5 5 0 0 1 17 18v3" />
    </svg>
  );
}

export function AwaitingGameCard({ inSession = false }) {
  const t = useT();

  return (
    <section className="border border-[#353534] bg-[#1c1b1b] px-5 py-4 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center border border-[#8b0000] bg-[#0e0e0e] text-[#8b0000]">
        {inSession ? <ClockIcon /> : <HourglassIcon />}
      </div>

      <h3 className="mt-3 font-mono text-sm font-semibold uppercase tracking-[0.2em] text-[#e5e2e1]">
        {inSession ? t('mobile.lobby.gameInSession') : t('mobile.lobby.awaitingHost')}
      </h3>

      <p className="mx-auto mt-2 max-w-[34ch] font-mono text-xs leading-5 text-[#aa8984]">
        {inSession ? t('mobile.lobby.gameInSessionBody') : t('mobile.lobby.awaitingHostBody')}
      </p>

      <div className="mt-3 flex items-center justify-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-[#8b0000] animate-pulse" />
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#555]">
          {inSession ? t('mobile.lobby.active') : t('mobile.lobby.standby')}
        </span>
        <span className="h-1.5 w-1.5 rounded-full bg-[#8b0000] animate-pulse" />
      </div>
    </section>
  );
}
