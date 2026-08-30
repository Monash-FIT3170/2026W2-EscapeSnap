// Meteor's JSX transform still requires React in module scope.
// eslint-disable-next-line no-unused-vars
import React, { useEffect, useState } from 'react';
import { useT } from '../../../../languages/LanguageProvider';
import { LobbyHeader } from '../../components/lobby/LobbyHeader';
import { SurvivorIdCard } from '../../components/lobby/SurvivorIdCard';
import { AwaitingGameCard } from '../../components/lobby/AwaitingGameCard';

function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

export function PlayerLobby({
  playerName = '',
  gameCode = '',
  playerCount = 0,
  inSession = false,
  gameStartedAt = null,
  roundDuration = 60,
  onExit,
}) {
  const [timeLeft, setTimeLeft] = useState(roundDuration);
  const t = useT();

  useEffect(() => {
    if (!gameStartedAt) {
      setTimeLeft(roundDuration);
      return;
    }
    const tick = () =>
      setTimeLeft(
        Math.max(0, roundDuration - Math.floor((Date.now() - gameStartedAt) / 1000))
      );
    tick();
    if (!inSession) return;
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [inSession, gameStartedAt, roundDuration]);

  const isExpired = timeLeft <= 0;

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-[#0e0e0e] text-[#e5e2e1]">
      <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col px-5 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-[calc(0.75rem+env(safe-area-inset-bottom))]">

        <div className="flex-shrink-0">
          <LobbyHeader unitLabel={gameCode || 'OPERATIVE'} onExit={onExit} />
        </div>

        {/* Takes whatever height is left between the header and the fixed
            bottom stack, so the card shrinks on short phones instead of
            pushing the standby panel off-screen. */}
        <div className="flex min-h-0 flex-1 items-center justify-center py-4">
          <SurvivorIdCard
            callSign={playerName.toUpperCase()}
            refCode={gameCode ? `CODE_${gameCode}` : null}
            status={t('mobile.lobby.awaitingGuidance')}
          />
        </div>

        <div className="flex flex-shrink-0 flex-col gap-2">
          <div className="flex items-center gap-3 border border-[#353534] bg-[#1c1b1b] px-4 py-3">
            <span className="h-2 w-2 flex-shrink-0 rounded-full bg-[#8b0000] animate-pulse" />
            <span className="flex-1 font-mono text-[10px] uppercase tracking-[0.25em] text-[#aa8984]">
              {t('mobile.lobby.playersInLobby')}
            </span>
            <span className="font-mono text-lg font-bold tabular-nums text-[#e5e2e1]">{playerCount}</span>
          </div>

          {inSession && (
            <div className="flex items-center gap-3 border border-[#353534] bg-[#1c1b1b] px-4 py-3">
              <span className={`h-2 w-2 flex-shrink-0 ${isExpired ? 'bg-[#555]' : 'bg-[#8b0000]'}`} />
              <span className="flex-1 font-mono text-[10px] uppercase tracking-[0.25em] text-[#aa8984]">
                {t('mobile.lobby.roundTimer')}
              </span>
              <span className={`font-mono text-lg font-bold tabular-nums ${
                isExpired ? 'text-[#555]' : timeLeft <= 30 ? 'text-[#ef4444]' : 'text-[#e5e2e1]'
              }`}>
                {isExpired ? t('mobile.lobby.expired') : formatTime(timeLeft)}
              </span>
            </div>
          )}

          <AwaitingGameCard inSession={inSession} />
        </div>
      </div>
    </div>
  );
}
