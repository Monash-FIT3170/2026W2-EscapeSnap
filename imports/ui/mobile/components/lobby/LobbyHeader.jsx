// Meteor's JSX transform still requires React in module scope.
// eslint-disable-next-line no-unused-vars
import React from 'react';
import { useT } from '../../../../languages/LanguageProvider';
import { LanguagePicker } from '../../../../languages/LanguagePicker';
import { ThemePicker } from '../../../shared/components/theme/ThemePicker';
import { Brand } from '../../../shared/components/room/Brand';

export function LobbyHeader({ unitLabel, onExit }) {
  const t = useT();

  return (
    <header className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 flex-col">
        <Brand className="!min-h-0 text-[1.3rem]" />
        <span className="es-label mt-1 truncate">{unitLabel}</span>
      </div>

      <div className="flex flex-shrink-0 items-center gap-2">
        <ThemePicker compact />
        <LanguagePicker compact />
        {onExit && (
          <button type="button" onClick={onExit} className="es-chip">
            {t('common.exit')}
          </button>
        )}
      </div>
    </header>
  );
}
