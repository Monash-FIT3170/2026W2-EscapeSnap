// Meteor's JSX transform still requires React in module scope.
// eslint-disable-next-line no-unused-vars
import React from 'react';
import { useT } from '../../../../languages/LanguageProvider';

function OperativeGlyph() {
  return (
    <svg viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden="true">
      <rect width="200" height="200" fill="#1a1512" />
      <circle cx="100" cy="82" r="32" fill="#3b342e" />
      <path d="M40 200 C 40 140, 160 140, 160 200 Z" fill="#2a2420" />
    </svg>
  );
}

// The player's ID photo, pinned up like the polaroids on the landing page's
// evidence board, with their name written on the border.
export function SurvivorIdCard({ callSign, refCode, status }) {
  const t = useT();
  const resolvedCallSign = callSign || t('mobile.lobby.playerDefault');
  const resolvedStatus = status ?? t('mobile.lobby.awaitingGuidance');

  return (
    <section className="flex w-full flex-col items-center">
      <div className="es-pola relative" style={{ width: 'min(210px, 56vw, 32vh)' }}>
        <span className="es-pin" aria-hidden="true" />
        <div className="es-pola-photo aspect-square">
          <OperativeGlyph />
          {refCode && (
            <p className="pointer-events-none absolute right-2 top-2 font-mono text-xs text-[#dfd5c1]/70">
              {refCode}
            </p>
          )}
        </div>
        <h2 className="es-pola-note mt-3 truncate px-1 text-lg">{resolvedCallSign}</h2>
      </div>

      <p className="mt-6 text-center text-sm text-muted">{resolvedStatus}</p>
    </section>
  );
}
