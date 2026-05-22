import React, { useState, useEffect, useCallback } from 'react';
import MobileRiddlePage from './gameplay/MobileRiddlePage';
import { MobileBottomNav } from '../components/navigation/MobileBottomNav';
import { RoundTimer } from '../components/gameplay/RoundTimer';
import { HARDCODED_RIDDLES } from '/imports/lib/riddles';

const ROUND_DURATION = 60;
const MAX_ROUNDS = 3;

const TEAM = [
  { id: 'player1', callSign: 'AGENT_01' },
  { id: 'player2', callSign: 'AGENT_02' },
  { id: 'player3', callSign: 'AGENT_03' },
  { id: 'player4', callSign: 'AGENT_04' },
];

const HARDCODED_PROGRESS = {
  player1: null,
  player2: 'B',
  player3: null,
  player4: null,
};

function StatusScreen({ revealedLetter, playerId }) {
  const progress = { ...HARDCODED_PROGRESS, [playerId]: revealedLetter };
  const solvedCount = Object.values(progress).filter(Boolean).length;
  const totalCount = TEAM.length;
  const progressPercent = Math.round((solvedCount / totalCount) * 100);

  return (
    <section className="flex flex-col gap-5 pt-5">
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-red-500">
          Team Progress
        </p>
        <h2 className="mt-1 font-mono text-xl font-bold tracking-wide text-white">
          {solvedCount} / {totalCount} Agents Complete
        </h2>
      </div>

      <div>
        <div className="mb-1 flex justify-between font-mono text-[10px] uppercase tracking-widest text-slate-500">
          <span>Mission Completion</span>
          <span className="text-white">{progressPercent}%</span>
        </div>
        <div className="h-2 w-full bg-slate-800">
          <div
            className="h-2 bg-red-600 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {TEAM.map(agent => {
          const letter = progress[agent.id];
          const isSelf = agent.id === playerId;
          const solved = !!letter && letter !== '?';

          return (
            <div
              key={agent.id}
              className={`flex items-center gap-4 border px-4 py-3 ${
                solved
                  ? 'border-red-900/60 bg-red-950/20'
                  : 'border-slate-800 bg-slate-950/40'
              }`}
            >
              <span
                className={`h-2 w-2 flex-shrink-0 rounded-full ${
                  solved ? 'bg-red-500' : 'bg-slate-700'
                }`}
              />
              <span className="flex-1 font-mono text-xs uppercase tracking-widest text-slate-300">
                {agent.callSign}
                {isSelf ? ' (you)' : ''}
              </span>

              {solved ? (
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
                    Letter
                  </span>
                  <span className="font-display text-2xl font-black text-white">
                    {letter}
                  </span>
                </div>
              ) : (
                <span className="font-mono text-[10px] uppercase tracking-widest text-slate-600 animate-pulse">
                  Waiting...
                </span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function PlayerDashboard({
  playerName = 'PLAYER',
  gameCode = '',
  playerId = 'player1',
  sessionId,
  onExit,
}) {
  const [activeTab, setActiveTab] = useState('scanner');
  const [currentRound, setCurrentRound] = useState(1);
  const [revealedLetter, setRevealedLetter] = useState(null);
  const [answerCorrect, setAnswerCorrect] = useState(null);
  const [timeLeft, setTimeLeft] = useState(ROUND_DURATION);
  const [timerRunning, setTimerRunning] = useState(true);

  const riddle = HARDCODED_RIDDLES.find(
    r => r.playerId === playerId && r.round === currentRound
  );

  const handleCorrectAnswer = useCallback((letter, isCorrect) => {
    setTimerRunning(false);
    setRevealedLetter(letter);
    setAnswerCorrect(isCorrect);
    setActiveTab('clues');
  }, []);

  useEffect(() => {
    if (!timerRunning) return;

    if (timeLeft <= 0) {
      setRevealedLetter('?');
      setAnswerCorrect(false);
      setActiveTab('clues');
      setTimerRunning(false);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, timerRunning]);

  const isExpired = timeLeft <= 0;

  return (
    <div className="h-screen flex flex-col bg-black text-slate-100 overflow-hidden">
      <header className="flex-shrink-0 flex items-center justify-between border-b border-slate-800 px-4 py-2">
        <div className="flex flex-1 items-center justify-center gap-3">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-white">
            Round {currentRound}
          </span>
          <RoundTimer timeLeft={timeLeft} totalTime={ROUND_DURATION} compact />
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
            {riddle?.id ?? 'OBJ_???'}
          </span>
          <p className="font-mono text-xs leading-5 text-slate-300">
            {riddle?.riddle ?? 'No riddle assigned'}
          </p>
        </div>
      )}

      {activeTab === 'scanner' && isExpired && (
        <div className="flex-shrink-0 border-b border-red-900/60 bg-red-950/40 px-5 py-2 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-red-400">
            Round ended — submission window closed
          </p>
        </div>
      )}

      <div className="flex-1 min-h-0 flex flex-col pb-16">
        {activeTab === 'status' && (
          <div className="flex-1 overflow-y-auto px-5">
            <StatusScreen revealedLetter={revealedLetter} playerId={playerId} />
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

                  <div className="mt-4">
                    <div className="flex justify-between font-mono text-xs uppercase tracking-[0.3em]">
                      <span className="text-white">WAITING FOR TEAM...</span>
                      <span className="text-red-500">1 / 4 READY</span>
                    </div>
                    <div className="mt-4 h-3 bg-slate-800">
                      <div className="h-3 w-1/4 bg-red-700" />
                    </div>
                  </div>
                </>
              ) : (
                <p className="font-mono text-sm text-slate-500">
                  No letters revealed yet. Use the scanner to solve your riddle.
                </p>
              )}

              {currentRound < MAX_ROUNDS ? (
                <button
                  type="button"
                  onClick={() => {
                    setCurrentRound(prev => prev + 1);
                    setTimeLeft(ROUND_DURATION);
                    setTimerRunning(true);
                    setRevealedLetter(null);
                    setAnswerCorrect(null);
                    setActiveTab('scanner');
                  }}
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
            gameId={gameCode}
            playerId={playerId}
            round={currentRound}
            sessionId={sessionId}
            isExpired={isExpired}
            onCorrect={handleCorrectAnswer}
          />
        )}
      </div>

      <MobileBottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  );
}