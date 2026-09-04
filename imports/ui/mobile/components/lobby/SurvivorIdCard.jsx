// Meteor's JSX transform still requires React in module scope.
// eslint-disable-next-line no-unused-vars
import React from 'react';
import { useT } from '../../../../languages/LanguageProvider';

function OperativeGlyph() {
  return (
    <svg viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden="true">
      <rect width="200" height="200" fill="#0e0e0e" />
      <circle cx="100" cy="80" r="32" fill="#353534" />
      <path d="M40 200 C 40 140, 160 140, 160 200 Z" fill="#1c1b1b" />
    </svg>
  );
}

export function SurvivorIdCard({ callSign, refCode, status }) {
  const t = useT();
  const resolvedCallSign = callSign || t('mobile.lobby.playerDefault');
  const resolvedStatus = status ?? t('mobile.lobby.awaitingGuidance');

  return (
    <section className="flex w-full flex-col items-center">
      <div className="relative aspect-[4/5]" style={{ width: 'min(200px, 52vw, 30vh)' }}>
        <span className="pointer-events-none absolute -left-1 -top-1 h-5 w-5 border-l-2 border-t-2 border-[#8b0000]" />
        <span className="pointer-events-none absolute -right-1 -top-1 h-5 w-5 border-r-2 border-t-2 border-[#8b0000]" />
        <span className="pointer-events-none absolute -bottom-1 -left-1 h-5 w-5 border-b-2 border-l-2 border-[#8b0000]" />
        <span className="pointer-events-none absolute -bottom-1 -right-1 h-5 w-5 border-b-2 border-r-2 border-[#8b0000]" />

        <div className="absolute inset-0 overflow-hidden bg-[#1c1b1b]">
          <OperativeGlyph />
        </div>

        {refCode && (
          <p className="pointer-events-none absolute right-2 top-2 font-mono text-[10px] tracking-[0.15em] text-[#aa8984]">
            {refCode}
          </p>
        )}
      </div>

      <h2 className="mt-3 truncate font-display text-xl font-bold tracking-[0.1em] text-[#e5e2e1]">
        {resolvedCallSign}
      </h2>

      <div className="mt-2 flex w-full items-center gap-3">
        <span className="h-px flex-1 bg-[#353534]" />
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#aa8984]">{resolvedStatus}</p>
        <span className="h-px flex-1 bg-[#353534]" />
      </div>
    </section>
  );
}
