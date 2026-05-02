import React from 'react';
import { useParams } from 'react-router';
import { useFinalRiddle } from '/imports/ui/shared/hooks/useFinalRiddle.js';
import GameNotFound from '/imports/ui/shared/components/GameNotFound.jsx';

const FinalRiddlePage = () => {
  const { gameId } = useParams();
  const { loading, finalRiddle, gameStatus } = useFinalRiddle(gameId);

  if (loading) return <p className="text-white">Loading...</p>;
  if (!finalRiddle) return <GameNotFound />;
  if (gameStatus !== 'final_riddle')
    return <p className="text-red-500">Not in final riddle phase.</p>;

  return (
    <div>
      THIS IS THE FINAL RIDDLE PAGE
    </div>
  );
};

export default FinalRiddlePage;
