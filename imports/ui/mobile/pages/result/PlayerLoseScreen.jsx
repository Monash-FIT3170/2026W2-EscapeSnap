// Meteor's JSX transform still requires React in module scope.
import React from 'react';
import { PlayerResultSummary } from '../../components/result/PlayerResultSummary';
import { EndgameShareStudio } from '../../components/result/EndgameShareStudio';
import { useT } from '../../../../languages/LanguageProvider';

export function PlayerLoseScreen({ playerId, snapshot, loading, versusLine = null }) {
  const t = useT();
  return (
    <div className="es-room flex min-h-[100dvh] flex-col overflow-x-hidden pb-[env(safe-area-inset-bottom)]">
      <div className="flex flex-col items-center justify-center gap-6 px-6 pb-8 pt-[calc(3rem+env(safe-area-inset-top))] text-center">
        {/* Taped off, like the landing page's caution tape. */}
        <h1 className="es-tape -mx-8 w-[calc(100%+4rem)] max-w-xl -rotate-2 !whitespace-normal py-3 text-2xl !leading-tight">
          <span>
            {t('mobile.loseScreen.missionLine1')} {t('mobile.loseScreen.missionLine2')}
          </span>
        </h1>
        <p className="text-sm leading-6 text-muted">
          {t('mobile.loseScreen.bodyLine1')}<br />{t('mobile.loseScreen.bodyLine2')}
        </p>
        {versusLine && (
          <p className="font-display text-lg font-semibold tracking-[0.04em] text-brand-bright">
            {versusLine}
          </p>
        )}
        <PlayerResultSummary playerId={playerId} />
      </div>
      <EndgameShareStudio snapshot={snapshot} loading={loading} />
    </div>
  );
}
