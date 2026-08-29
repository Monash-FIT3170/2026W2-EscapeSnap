// Meteor's JSX transform still requires React in module scope.
// eslint-disable-next-line no-unused-vars
import React from 'react';
import { PlayerResultSummary } from '../../components/result/PlayerResultSummary';
import { EndgameShareStudio } from '../../components/result/EndgameShareStudio';

export function PlayerLoseScreen({ playerId, snapshot, loading }) {
  return (
    <div className="flex flex-col" style={{ background: '#0e0e0e' }}>
      <div className="flex flex-col items-center justify-center gap-6 px-8 py-10 text-center">
        <div style={{ width: 64, height: 3, background: '#8b0000' }} />
        <h1
          className="font-black uppercase tracking-widest"
          style={{ fontSize: 40, color: '#8b0000', lineHeight: 1.2 }}
        >
          Mission<br />Failed
        </h1>
        <p className="text-sm leading-7" style={{ color: '#6b7280' }}>
          Your team ran out of attempts.<br />The escape has failed.
        </p>
        <PlayerResultSummary playerId={playerId} />
      </div>
      <EndgameShareStudio snapshot={snapshot} loading={loading} />
    </div>
  );
}
