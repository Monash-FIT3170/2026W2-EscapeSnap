import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useFinalRiddle } from '/imports/ui/shared/hooks/useFinalRiddle.js';
import { useRevealedLetters } from '/imports/ui/shared/hooks/useRevealedLetters.js';

import GameNotFound from '/imports/ui/shared/components/GameNotFound.jsx';
import RevealedLetters from '/imports/ui/host/components/riddle/RevealedLetters.jsx';
import FinalRiddle from '/imports/ui/host/components/riddle/FinalRiddle.jsx';
import FinalRiddleInput from '/imports/ui/host/components/riddle/FinalRiddleInput.jsx';
import WinScreen from '/imports/ui/host/pages/game-completion/WinScreen.jsx';

const BG = '#1c1b1b';

const FinalRiddlePage = () => {
  const { gameId } = useParams();
  const { loading, finalRiddle, gameStatus } = useFinalRiddle(gameId);
  const { lettersLoading, letters } = useRevealedLetters(gameId);
  const [hasWon, setHasWon] = useState(false);
  const navigate = useNavigate();

  if (loading || lettersLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: BG }}>
        <span className="loading loading-spinner text-red-600"></span>
      </div>
    );
  }

  if (!finalRiddle) return <GameNotFound />;

  if (gameStatus !== 'final_riddle') {
    return <p className="text-red-500">Not in final riddle phase.</p>;
  }

  if (hasWon) return <WinScreen onPlayAgain={() => navigate('/game/create')} />;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: BG }}>

      {/* Navbar — matches Lobby and other pages */}
      <header
        className="border-b border-gray-800 px-8 py-4 flex items-center justify-between"
        style={{ backgroundColor: BG }}
      >
        <span className="text-red-500 font-bold text-xl tracking-widest uppercase">
          ESCAPESNAP
        </span>
        <span className="text-xs text-gray-500 tracking-widest uppercase">
          FINAL RIDDLE
        </span>
      </header>

      {/* Main content row */}
      <div className="flex flex-1">

        {/* Left panel */}
        <div className="flex-1 flex flex-col px-12 py-12" style={{ backgroundColor: BG }}>
          <FinalRiddle finalRiddle={finalRiddle} />
          <RevealedLetters letters={letters} />
          <div className="mt-auto">
            <FinalRiddleInput gameId={gameId} onCorrect={() => setHasWon(true)} />
          </div>
        </div>

        {/* Right chat panel — fixed 350px */}
        <div
          className="flex flex-col border-l border-gray-800"
          style={{ width: '350px', minWidth: '350px', backgroundColor: BG }}
        >
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800">
            <p className="text-xs font-bold tracking-[0.3em] text-white uppercase">Team Chat</p>
            <span className="text-gray-500 text-sm">{'>>'}</span>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-5">
            {/* Chat messages rendered here via hook */}
          </div>
          <div className="px-4 py-4 border-t border-gray-800 flex gap-2">
            <input
              type="text"
              placeholder="Message..."
              className="flex-1 bg-transparent border border-gray-700 text-white placeholder-gray-600 text-sm px-3 py-2 focus:outline-none focus:border-red-600 font-mono"
            />
            <button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 text-sm transition-colors">
              {'>'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default FinalRiddlePage;