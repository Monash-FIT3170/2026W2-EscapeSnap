// Meteor's JSX transform still requires React in module scope.
import React from 'react';
import { PlayerResultSummary } from '../../components/result/PlayerResultSummary';
import { EndgameShareStudio } from '../../components/result/EndgameShareStudio';
import { useT } from '../../../../languages/LanguageProvider';

export function PlayerWinScreen({ playerId, snapshot, loading, versusLine = null }) {
  const t = useT();
  return (
    <div className="es-room flex min-h-[100dvh] flex-col overflow-x-hidden pb-[env(safe-area-inset-bottom)]">
      <div className="flex flex-col items-center justify-center gap-6 px-6 pb-8 pt-[calc(3rem+env(safe-area-inset-top))] text-center">
        {/* Stamped across the screen like the case file's ESCAPED stamp on the
            landing page. */}
        <h1 className="es-stamp !text-[2.4rem] !leading-[1.1] text-correct">
          {t('mobile.winScreen.missionLine1')}<br />{t('mobile.winScreen.missionLine2')}
        </h1>
        <p className="text-sm leading-6 text-muted">
          {t('mobile.winScreen.bodyLine1')}<br />{t('mobile.winScreen.bodyLine2')}
        </p>
        {versusLine && (
          <p className="font-display text-lg font-semibold tracking-[0.04em] text-correct">
            {versusLine}
          </p>
        )}
        <PlayerResultSummary playerId={playerId} />
      </div>
      <EndgameShareStudio snapshot={snapshot} loading={loading} />
    </div>
  );
}
