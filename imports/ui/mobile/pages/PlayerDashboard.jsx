import React, { useState, useEffect, useCallback } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { Rounds } from '/imports/api/rounds/RoundsCollection';
import { Players } from '/imports/api/players/PlayersCollection';
import { Games } from '/imports/api/games/GamesCollection';
import MobileRiddlePage from './gameplay/MobileRiddlePage';
import { MobileBottomNav } from '../components/navigation/MobileBottomNav';
import { RoundTimer } from '../components/gameplay/RoundTimer';
import { PlayerWinScreen } from './result/PlayerWinScreen';
import { PlayerLoseScreen } from './result/PlayerLoseScreen';

const MAX_ROUNDS = 3;

function StatusScreen({ revealedLetters }) {
  return (
    <section className="flex flex-col gap-5 pt-5">
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-red-500">Letters Collected</p>
        <h2 className="mt-1 font-mono text-xl font-bold tracking-wide text-white">
          {revealedLetters.filter(l => l && l !== '?').length} / {MAX_ROUNDS} Rounds Complete
        </h2>
      </div>
      <div className="flex gap-3 mt-2">
        {Array.from({ length: MAX_ROUNDS }, (_, i) => {
          const letter = revealedLetters[i];
          const hasLetter = letter && letter !== '?';
          return (
            <div
              key={i}
              className={`flex-1 border py-6 text-center ${
                hasLetter ? 'border-red-900/60 bg-red-950/20' : 'border-slate-800 bg-slate-950/40'
              }`}
            >
              <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500 mb-3">
                Round {i + 1}
              </p>
              <p className="font-display text-4xl font-black text-white">
                {letter ?? '?'}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function PlayerDashboard({ playerName, gameCode, playerId, gameId, onExit }) {
  const [activeTab, setActiveTab] = useState('scanner');
  const [currentRound, setCurrentRound] = useState(1);
  const [revealedLetter, setRevealedLetter] = useState(null);
  const [answerCorrect, setAnswerCorrect] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);

  const { round, revealedLetters, game } = useTracker(() => {
    Meteor.subscribe('rounds.forPlayer', playerId, currentRound);
    Meteor.subscribe('player.self', playerId);
    Meteor.subscribe('games.current', gameId);
    return {
      round: Rounds.findOne({ playerId, roundNumber: currentRound }),
      revealedLetters: Players.findOne(playerId)?.revealedLetters ?? [],
      game: Games.findOne(gameId),
    };
  }, [playerId, currentRound, gameId]);

  // Track remaining game time
  useEffect(() => {
    if (!game?.startedAt || !game?.timerMinutes) return;
    const tick = () => {
      const elapsed = Date.now() - new Date(game.startedAt).getTime();
      const remaining = Math.max(0, game.timerMinutes * 60 * 1000 - elapsed);
      setTimeLeft(Math.floor(remaining / 1000));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [game?.startedAt, game?.timerMinutes]);

  const isExpired = timeLeft !== null && timeLeft <= 0;
  const totalGameSeconds = (game?.timerMinutes ?? 30) * 60;

  // All hooks must be declared before any early returns
  const handleCorrectAnswer = useCallback((letter, isCorrect) => {
    setRevealedLetter(letter);
    setAnswerCorrect(isCorrect);
    setActiveTab('clues');
  }, []);

  const handleNextRound = async () => {
    if (!answerCorrect) {
      // Player didn't submit correctly - mark their pending round as wrong and advance
      try {
        await Meteor.callAsync('games.advanceRound', gameId);
      } catch {}
    }
    setCurrentRound(r => r + 1);
    setRevealedLetter(null);
    setAnswerCorrect(null);
    setActiveTab('scanner');
  };

  const handleRetry = () => {
    setRevealedLetter(null);
    setAnswerCorrect(null);
    setActiveTab('scanner');
  };

  if (game?.status === 'won') return <PlayerWinScreen />;
  if (game?.status === 'lost') return <PlayerLoseScreen />;

  return (
    <div className="h-screen flex flex-col bg-black text-slate-100 overflow-hidden">
      <header className="flex-shrink-0 flex items-center justify-between border-b border-slate-800 px-4 py-2">
        <div className="flex flex-1 items-center justify-center gap-3">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-white">
            Round {currentRound}
          </span>
          <RoundTimer timeLeft={timeLeft ?? totalGameSeconds} totalTime={totalGameSeconds} compact />
        </div>
        <button
          type="button"
          onClick={onExit}
          className="flex-shrink-0 border border-red-600 bg-red-600/10 px-4 py-2 font-mono text-xs font-semibold uppercase tracking-widest text-red-400 transition hover:bg-red-600 hover:text-white"
        >
          Lobby
        </button>
      </header>

      {activeTab === 'scanner' && (
        <div className="flex-shrink-0 flex items-start gap-3 border-b border-slate-800 px-5 py-3">
          <span className="flex-shrink-0 bg-red-700 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-white">
            ROUND_{currentRound}
          </span>
          <p className="font-mono text-xs leading-5 text-slate-300">
            {round?.riddleText ?? 'Loading riddle...'}
          </p>
        </div>
      )}

      {activeTab === 'scanner' && isExpired && (
        <div className="flex-shrink-0 border-b border-red-900/60 bg-red-950/40 px-5 py-2 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-red-400">
            Game time expired — no more submissions
          </p>
        </div>
      )}

      <div className="flex-1 min-h-0 flex flex-col pb-16">
        {activeTab === 'status' && (
          <div className="flex-1 overflow-y-auto px-5">
            <StatusScreen revealedLetters={revealedLetters} />
          </div>
        )}

        {activeTab === 'clues' && (
          <div className="flex-1 overflow-y-auto px-5">
            <section className="flex flex-col gap-6 pt-5">
              {revealedLetter ? (
                <>
                  <h1 className="font-display text-6xl font-black text-red-700">
                    {answerCorrect ? 'CORRECT!' : 'INCORRECT!'}
                  </h1>

                  <div className="border border-slate-700 bg-slate-950/70 px-6 py-10 text-center">
                    <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-slate-500">
                      DATA_RECOVERY_ACTIVE
                    </p>
                    <p className="mt-8 font-display text-8xl font-black text-white">
                      {revealedLetter}
                    </p>
                    <p className="mt-6 font-mono text-sm uppercase tracking-[0.35em] text-slate-400">
                      LETTER REVEALED
                    </p>
                  </div>

                  <div className="border-l-4 border-red-600 bg-slate-900/80 px-6 py-6">
                    <h2 className="font-display text-xl font-bold tracking-widest text-white">
                      {answerCorrect ? 'PUZZLE SOLVED' : 'WRONG OBJECT DETECTED'}
                    </h2>
                    <p className="mt-4 text-sm leading-6 text-slate-400">
                      {answerCorrect
                        ? 'You have obtained a revealed letter. Use it to help assemble the final code.'
                        : 'You have failed to obtain a revealed letter for this round.'}
                    </p>
                  </div>

                  {!answerCorrect && !isExpired && (
                    <button
                      type="button"
                      onClick={handleRetry}
                      className="w-full border border-slate-600 bg-transparent px-5 py-4 font-mono text-sm font-semibold uppercase tracking-[0.3em] text-slate-400 hover:border-slate-400 hover:text-slate-200 transition"
                    >
                      Retry
                    </button>
                  )}
                </>
              ) : (
                <p className="font-mono text-sm text-slate-500">
                  No letters revealed yet. Use the scanner to solve your riddle.
                </p>
              )}

              {currentRound < MAX_ROUNDS ? (
                <button
                  type="button"
                  onClick={handleNextRound}
                  className="mt-6 w-full border border-red-600 bg-red-600 px-5 py-4 font-mono text-sm font-semibold uppercase tracking-[0.3em] text-white"
                >
                  Next Round
                </button>
              ) : (
                <p className="mt-6 text-center font-mono text-sm uppercase tracking-[0.3em] text-red-500">
                  All rounds completed
                </p>
              )}
            </section>
          </div>
        )}

        {activeTab === 'scanner' && (
          <MobileRiddlePage
            roundId={round?._id}
            riddleText={round?.riddleText}
            targetObject={round?.answer}
            isExpired={isExpired}
            onCorrect={handleCorrectAnswer}
          />
        )}
      </div>

      <MobileBottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  );
}
