// Meteor's JSX transform still requires React in module scope.
// eslint-disable-next-line no-unused-vars
import React from 'react';
import { useT } from '../../../../languages/LanguageProvider';
import { LanguagePicker } from '../../../../languages/LanguagePicker';
import { ThemePicker } from '../../../shared/components/theme/ThemePicker';

export function LobbyHeader({ unitLabel, onExit }) {
  const t = useT();

  return (
    <header className="flex items-center justify-between gap-3 border-b border-line pb-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="h-4 w-1 flex-shrink-0 bg-brand" />
        <h1 className="truncate font-mono text-lg font-bold tracking-[0.15em] text-ink">
          {unitLabel}
        </h1>
      </div>

      <div className="flex flex-shrink-0 items-center gap-2">
        <ThemePicker compact />
        <LanguagePicker compact />
        {onExit && (
          <button
            type="button"
            onClick={onExit}
            className="min-h-[44px] border border-brand px-4 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-muted transition active:bg-brand active:text-on-brand"
          >
            {t('common.exit')}
          </button>
        )}
      </div>
    </header>
  );
}
