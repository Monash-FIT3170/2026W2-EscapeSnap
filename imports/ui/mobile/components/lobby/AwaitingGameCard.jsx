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
    <section className="flex gap-4 px-1 pt-2">
      <div className="mt-0.5 flex-shrink-0 text-brand-bright">
        {inSession ? <ClockIcon /> : <HourglassIcon />}
      </div>
      <div className="min-w-0">
        <h3 className="flex items-center gap-2 text-xl font-semibold text-ink">
          {inSession ? t('mobile.lobby.gameInSession') : t('mobile.lobby.awaitingHost')}
          <span className="es-led" data-state="busy" aria-hidden="true" />
          <span className="sr-only">
            {inSession ? t('mobile.lobby.active') : t('mobile.lobby.standby')}
          </span>
        </h3>
        <p className="mt-1 text-sm leading-6 text-muted">
          {inSession ? t('mobile.lobby.gameInSessionBody') : t('mobile.lobby.awaitingHostBody')}
        </p>
      </div>
    </section>
  );
}
