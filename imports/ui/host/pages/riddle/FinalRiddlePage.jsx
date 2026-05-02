import React, { useState } from 'react';
import { useParams } from 'react-router';
import { useFinalRiddle } from '/imports/ui/shared/hooks/useFinalRiddle.js';
import { useRevealedLetters } from '/imports/ui/shared/hooks/useRevealedLetters.js';
import GameNotFound from '/imports/ui/shared/components/GameNotFound.jsx';
import RevealedLetters from '/imports/ui/host/components/riddle/RevealedLetters.jsx';
import FinalRiddle from '/imports/ui/host/components/riddle/FinalRiddle.jsx';
import FinalRiddleInput from '/imports/ui/host/components/riddle/FinalRiddleInput.jsx';
import WinScreen from '/imports/ui/host/pages/game-completion/WinScreen.jsx';

const FinalRiddlePage = () => {
  const { gameId } = useParams();
  const { loading, finalRiddle, gameStatus } = useFinalRiddle(gameId);
  const { lettersLoading, letters } = useRevealedLetters(gameId);
  const [hasWon, setHasWon] = useState(false);

  if (loading || lettersLoading) return <div className='min-h-screen flex items-center justify-center'>
                            <span className="loading loading-spinner text-red-500"></span>
                        </div>;
  if (!finalRiddle) return <GameNotFound />;
  if (gameStatus !== 'final_riddle')
    return <p className="text-red-500">Not in final riddle phase.</p>;

  if (hasWon) return <WinScreen onPlayAgain={() => setHasWon(false)} />;

  return (
      <div className='min-h-screen bg-gray-900'>
        <FinalRiddle finalRiddle={finalRiddle} />
          <RevealedLetters letters={letters} />
          <FinalRiddleInput gameId={gameId} onCorrect={() => setHasWon(true)} />
        </div>
    );
};

export default FinalRiddlePage;