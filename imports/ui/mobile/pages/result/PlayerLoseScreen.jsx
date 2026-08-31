// Meteor's JSX transform still requires React in module scope.
import React from 'react';
import { PlayerResultSummary } from '../../components/result/PlayerResultSummary';
import { EndgameShareStudio } from '../../components/result/EndgameShareStudio';
import { useT } from '../../../../languages/LanguageProvider';

export function PlayerLoseScreen({ playerId, snapshot, loading }) {
  const t = useT();
  return (
    <div className="flex flex-col" style={{ background: '#0e0e0e' }}>
      <div className="flex flex-col items-center justify-center gap-6 px-8 py-10 text-center">
        <div style={{ width: 64, height: 3, background: '#8b0000' }} />
        <h1
          className="font-black uppercase tracking-widest"
          style={{ fontSize: 40, color: '#8b0000', lineHeight: 1.2 }}
        >
          {t('mobile.loseScreen.missionLine1')}<br />{t('mobile.loseScreen.missionLine2')}
        </h1>
        <p className="text-sm leading-7" style={{ color: '#6b7280' }}>
          {t('mobile.loseScreen.bodyLine1')}<br />{t('mobile.loseScreen.bodyLine2')}
        </p>
        <PlayerResultSummary playerId={playerId} />
      </div>
      <EndgameShareStudio snapshot={snapshot} loading={loading} />
    </div>
  );
}
