import React, { useState } from 'react';
import { LobbyHeader } from '../../components/lobby/LobbyHeader';
import { SurvivorIdCard } from '../../components/lobby/SurvivorIdCard';
import { AwaitingGameCard } from '../../components/lobby/AwaitingGameCard';
import { MobileBottomNav } from '../../components/navigation/MobileBottomNav';

export function PlayerLobby({ 
  playerName = 'PLAYER', 
  gameCode = '', 
  photoUrl, 
  playerCount = 0, 
  onGameStart,
  onExit 
}) 

{
  const [activeTab, setActiveTab] = useState('status');

  return (
    <div
      className="min-h-screen bg-black text-slate-100"
      style={{
        backgroundImage: 'linear-gradient(rgba(239,68,68,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(239,68,68,0.03) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }}
    >
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center px-5 pb-24 pt-4">

        <div className="w-full">
          <LobbyHeader unitLabel={gameCode || 'OPERATIONAL_UNIT_01'} playerCount={playerCount} onExit={onExit} />
        </div>

        <SurvivorIdCard
          photoUrl={photoUrl}
          callSign={playerName.toUpperCase()}
          refCode={gameCode ? `CODE_${gameCode}` : 'REF_SEC_U012_X'}
          zoneCode="C_SECTOR_X"
          duration="0:00MS"
          status="AWAITING GUIDANCE"
        />

        <section className="w-full px-1 pt-4">
          <div className="flex items-center gap-3 border border-slate-800/60 bg-slate-950/60 px-4 py-3">
            <span className="h-2 w-2 flex-shrink-0 rounded-full bg-red-500 animate-pulse" />
            <span className="flex-1 font-mono text-[11px] uppercase tracking-[0.25em] text-slate-400">Players in lobby</span>
            <span className="font-mono text-xl font-bold text-white">{playerCount}</span>
          </div>
        </section>

        <div className="w-full">
          <AwaitingGameCard />
        </div>

      </div>

      <button
        type="button"
        onClick={onGameStart}
        className="fixed bottom-24 left-1/2 z-10 w-[90%] max-w-sm -translate-x-1/2 border border-red-600 bg-red-600 px-5 py-4 font-mono text-sm font-semibold uppercase tracking-[0.3em] text-white"
      >
        Start Game
      </button>

      <MobileBottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  );
}
