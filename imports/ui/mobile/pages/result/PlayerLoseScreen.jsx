// Meteor's JSX transform still requires React in module scope.
// eslint-disable-next-line no-unused-vars
import React from 'react';
import { PlayerResultSummary } from '../../components/result/PlayerResultSummary';
import { EndgameShareStudio } from '../../components/result/EndgameShareStudio';
import { useT } from '../../../../languages/LanguageProvider';

export function PlayerLoseScreen({ playerId, snapshot, loading }) {
  const t = useT();
  return (
    <div className="flex min-h-[100dvh] flex-col pb-[env(safe-area-inset-bottom)]" style={{ background: '#0e0e0e' }}>
      <div className="flex flex-col items-center justify-center gap-5 px-6 pb-8 pt-[calc(2.5rem+env(safe-area-inset-top))] text-center">
        <div style={{ width: 64, height: 3, background: '#8b0000' }} />
        <h1
          className="font-black uppercase tracking-widest"
          style={{ fontSize: 34, color: '#8b0000', lineHeight: 1.2 }}
        >
          {t('mobile.loseScreen.missionLine1')}<br />{t('mobile.loseScreen.missionLine2')}
        </h1>
        <p className="font-mono text-xs leading-6" style={{ color: '#aa8984' }}>
          {t('mobile.loseScreen.bodyLine1')}<br />{t('mobile.loseScreen.bodyLine2')}
        </p>
        <PlayerResultSummary playerId={playerId} />
      </div>
      <EndgameShareStudio snapshot={snapshot} loading={loading} />
    </div>
  );
}
