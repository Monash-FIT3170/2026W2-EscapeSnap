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
    <div className="es-room flex h-[100dvh] flex-col overflow-hidden">
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

        <div className="flex flex-shrink-0 flex-col gap-3">
          <div className="es-plate grid grid-cols-2 gap-px overflow-hidden p-0">
            <div className={`flex flex-col gap-1 px-4 py-3 ${inSession ? '' : 'col-span-2'}`}>
              <span className="es-label">{t('mobile.lobby.playersInLobby')}</span>
              <span className="es-lcd-text text-3xl tabular-nums">{playerCount}</span>
            </div>
            {inSession && (
              <div className="flex flex-col gap-1 border-l border-line px-4 py-3">
                <span className="es-label">{t('mobile.lobby.roundTimer')}</span>
                <span className={`text-3xl tabular-nums ${
                  isExpired ? 'font-display font-semibold text-dim' : timeLeft <= 30 ? 'es-lcd-text animate-pulse' : 'es-lcd-text'
                }`}>
                  {isExpired ? t('mobile.lobby.expired') : formatTime(timeLeft)}
                </span>
              </div>
            )}
          </div>

          <AwaitingGameCard inSession={inSession} />
        </div>
      </div>
    </div>
  );
}
