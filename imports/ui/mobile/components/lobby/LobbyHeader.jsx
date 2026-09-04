// Meteor's JSX transform still requires React in module scope.
// eslint-disable-next-line no-unused-vars
import React from 'react';
import { useT } from '../../../../languages/LanguageProvider';
import { LanguagePicker } from '../../../../languages/LanguagePicker';

export function LobbyHeader({ unitLabel, onExit }) {
  const t = useT();

  return (
    <header className="flex items-center justify-between gap-3 border-b border-[#353534] pb-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="h-4 w-1 flex-shrink-0 bg-[#8b0000]" />
        <h1 className="truncate font-mono text-lg font-bold tracking-[0.15em] text-[#e5e2e1]">
          {unitLabel}
        </h1>
      </div>

      <div className="flex flex-shrink-0 items-center gap-2">
        <LanguagePicker compact />
        {onExit && (
          <button
            type="button"
            onClick={onExit}
            className="min-h-[44px] border border-[#8b0000] px-4 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[#aa8984] transition active:bg-[#8b0000] active:text-[#e5e2e1]"
          >
            {t('common.exit')}
          </button>
        )}
      </div>
    </header>
  );
}
