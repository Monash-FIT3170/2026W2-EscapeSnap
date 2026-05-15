import React, { useState } from 'react';
import MobileRiddlePage from './gameplay/MobileRiddlePage';
import { MobileBottomNav } from '../components/navigation/MobileBottomNav';

export function PlayerDashboard({ playerName = 'PLAYER', gameCode = '', onExit }) {
  const [activeTab, setActiveTab] = useState('scanner');
  const [currentRound, setCurrentRound] = useState(1);
  const [revealedLetter, setRevealedLetter] = useState(null);
  const [answerCorrect, setAnswerCorrect] = useState(null);
  const maxRounds = 3;

  const handleCorrectAnswer = (letter, isCorrect) => {
    setRevealedLetter(letter);
    setAnswerCorrect(isCorrect);
    setActiveTab('clues');
  };

  return (
    <div className="min-h-screen bg-black text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 pb-24 pt-4">

        <header className="flex justify-between border-b border-slate-800 py-3">
          <h1 className="text-white">{playerName}</h1>
          <button onClick={onExit}>Exit</button>
        </header>

        {activeTab === 'status' && (
          <div className="pt-5 text-white">STATUS SCREEN</div>
        )}

        {activeTab === 'clues' && (
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
                    {answerCorrect
                      ? 'YOU HAVE GOTTEN THE PUZZLE CORRECT!'
                      : 'WRONG OBJECT DETECTED'}
                  </h2>

                  <p className="mt-4 text-sm leading-6 text-slate-400">
                    {answerCorrect
                      ? 'You have obtained a revealed letter.'
                      : 'You have failed to obtain a revealed letter'}
                  </p>

                  <p className="mt-4 text-sm leading-6 text-slate-400">
                    Revealed letters can be used to assist with solving the final puzzle.
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

            {currentRound < maxRounds ? (
              <button
                onClick={() => {
                  setCurrentRound(currentRound + 1);
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
        )}

        {activeTab === 'scanner' && (
          <MobileRiddlePage
            gameId={gameCode}
            playerId="player1"
            round={currentRound}
            onCorrect={handleCorrectAnswer}
          />
        )}

      </div>

      <MobileBottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  );
}