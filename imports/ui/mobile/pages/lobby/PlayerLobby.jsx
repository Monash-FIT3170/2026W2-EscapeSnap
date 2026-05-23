import React, { useEffect, useState } from 'react';
import { LobbyHeader } from '../../components/lobby/LobbyHeader';
import { SurvivorIdCard } from '../../components/lobby/SurvivorIdCard';
import { AwaitingGameCard } from '../../components/lobby/AwaitingGameCard';

function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

export function PlayerLobby({
  playerName = 'PLAYER',
  gameCode = '',
  photoUrl,
  playerCount = 0,
  inSession = false,
  gameStartedAt = null,
  roundDuration = 60,
  onGameStart,
  onExit
}) {
  const calcTimeLeft = () =>
    gameStartedAt
      ? Math.max(0, roundDuration - Math.floor((Date.now() - gameStartedAt) / 1000))
      : roundDuration;

  const [timeLeft, setTimeLeft] = useState(calcTimeLeft);

  useEffect(() => {
    if (!inSession || !gameStartedAt) return;
    const id = setInterval(() => {
      const t = calcTimeLeft();
      setTimeLeft(t);
      if (t <= 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [inSession, gameStartedAt]);

  const isExpired = timeLeft <= 0;

  return (
    <div
      className="h-screen overflow-hidden flex flex-col bg-black text-slate-100"
      style={{
        backgroundImage: 'linear-gradient(rgba(239,68,68,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(239,68,68,0.03) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }}
    >
      <div className="flex flex-col flex-1 min-h-0 w-full max-w-md mx-auto px-5 pt-4 pb-2">

        {/* Header */}
        <div className="flex-shrink-0">
          <LobbyHeader unitLabel={gameCode || 'OPERATIONAL_UNIT_01'} playerCount={playerCount} onExit={onExit} />
        </div>

        {/* ID card — shrinks to fill whatever space is between header and bottom rows */}
        <div className="flex-1 min-h-0 flex items-center justify-center py-2">
          <SurvivorIdCard
            photoUrl={photoUrl}
            callSign={playerName.toUpperCase()}
            refCode={gameCode ? `CODE_${gameCode}` : 'REF_SEC_U012_X'}
            zoneCode="C_SECTOR_X"
            duration="0:00MS"
            status="AWAITING GUIDANCE"
          />
        </div>

        {/* Fixed bottom section */}
        <div className="flex-shrink-0 flex flex-col gap-2">

          {/* Players in lobby */}
          <div className="flex items-center gap-3 border border-slate-800/60 bg-slate-950/60 px-4 py-2.5">
            <span className="h-2 w-2 flex-shrink-0 rounded-full bg-red-500 animate-pulse" />
            <span className="flex-1 font-mono text-[11px] uppercase tracking-[0.25em] text-slate-400">Players in lobby</span>
            <span className="font-mono text-lg font-bold text-white">{playerCount}</span>
          </div>

          {/* Round timer — only when in session */}
          {inSession && (
            <div className={`flex items-center gap-4 border px-4 py-3 ${
              isExpired ? 'border-slate-800 bg-slate-950/40' : 'border-red-900/60 bg-red-950/20'
            }`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                strokeLinecap="round" strokeLinejoin="round"
                className={`h-5 w-5 flex-shrink-0 ${isExpired ? 'text-slate-600' : 'text-red-500'}`}>
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              <span className="flex-1 font-mono text-xs uppercase tracking-[0.25em] text-slate-400">Round timer</span>
              <span className={`font-mono text-xl font-bold tabular-nums ${
                isExpired ? 'text-slate-600' : timeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-white'
              }`}>
                {isExpired ? 'Expired' : formatTime(timeLeft)}
              </span>
            </div>
          )}

          {/* Awaiting / in-session card */}
          <AwaitingGameCard inSession={inSession} />
        </div>
      </div>
    </div>
  );
}
