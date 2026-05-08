import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { Games } from '../../../../api/games/GamesCollection';

const Lobby = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);

  const { game, loading } = useTracker(() => {
    const sub = Meteor.subscribe('games.current', gameId);
    return {
      loading: !sub.ready(),
      game: Games.findOne(gameId),
    };
  }, [gameId]);

  useEffect(() => {
    if (game?.status === 'in_progress') {
      navigate(`/game/${gameId}/progress`);
    }
  }, [game?.status]);

  const handleStartGame = async () => {
    setStarting(true);
    setError(null);
    try {
      await Meteor.callAsync('games.start', gameId);
      await Meteor.callAsync('rounds.createForGame', gameId);
    } catch (err) {
      setError(err.reason || err.message || 'FAILED TO START GAME');
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
        <p className="text-xs tracking-widest text-gray-500">LOADING...</p>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
        <p className="text-xs tracking-widest text-red-500">GAME NOT FOUND</p>
      </div>
    );
  }

  const gameStarted = game.status === 'in_progress';

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      <header className="border-b border-gray-800 px-8 py-4 flex items-center justify-between">
        <span className="text-red-500 font-bold text-xl tracking-widest uppercase">
          ESCAPESNAP
        </span>
        <span className="text-xs text-gray-500 tracking-widest uppercase">
          GAME LOBBY
        </span>
      </header>

      <main className="flex-1 flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-lg space-y-6">
          <div className="mb-8">
            <p className="text-xs text-red-500 tracking-widest mb-1">
              MISSION BRIEFING
            </p>
            <h1 className="text-3xl font-bold tracking-widest uppercase text-gray-100">
              AWAITING AGENTS
            </h1>
            <p className="text-xs text-gray-500 mt-2 tracking-wide">
              SHARE THE GAME CODE WITH YOUR TEAM
            </p>
          </div>

          <div className="border border-gray-800 p-6 text-center">
            <p className="text-xs text-gray-500 tracking-widest mb-2">
              GAME CODE
            </p>
            <p className="text-2xl font-mono font-bold text-red-400 tracking-widest break-all">
              {gameId}
            </p>
          </div>

          {error && (
            <p className="text-xs text-red-500 tracking-widest">!! {error}</p>
          )}

          {gameStarted ? (
            <div className="border border-red-800 bg-red-950 p-4 text-center">
              <p className="text-sm text-red-400 tracking-widest uppercase">
                MISSION ACTIVE — AGENTS DEPLOYED
              </p>
            </div>
          ) : (
            <button
              onClick={handleStartGame}
              disabled={starting}
              className="w-full bg-red-700 hover:bg-red-600 disabled:bg-gray-800 disabled:text-gray-600 text-white text-sm tracking-widest uppercase py-4 transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              {starting ? 'DEPLOYING AGENTS...' : 'START MISSION'}
            </button>
          )}
        </div>
      </main>
    </div>
  );
};

export default Lobby;
