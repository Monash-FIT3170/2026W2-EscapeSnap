import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { Games } from '../../../../api/games/GamesCollection';
import { Players } from '../../../../api/players/PlayersCollection';

const Lobby = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);

  const { game, players, loading } = useTracker(() => {
    const gameSub = Meteor.subscribe('games.current', gameId);
    const playersSub = Meteor.subscribe('players.inGame', gameId);
    return {
      loading: !gameSub.ready() || !playersSub.ready(),
      game: Games.findOne(gameId),
      players: Players.find({ gameId }, { sort: { joinedAt: 1 } }).fetch(),
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
        <div className="w-full max-w-2xl space-y-6">

          <div className="mb-4">
            <p className="text-xs text-red-500 tracking-widest mb-1">MISSION BRIEFING</p>
            <h1 className="text-3xl font-bold tracking-widest uppercase text-gray-100">
              AWAITING AGENTS
            </h1>
            <p className="text-xs text-gray-500 mt-2 tracking-wide">
              SHARE THE GAME CODE WITH YOUR TEAM
            </p>
          </div>

          <div className="border border-gray-800 p-6 text-center">
            <p className="text-xs text-gray-500 tracking-widest mb-2">GAME CODE</p>
            <p className="text-4xl font-mono font-bold text-red-400 tracking-[0.3em]">
              {game.joinCode ?? gameId}
            </p>
          </div>

          {/* Player name grid — updates in real time as players join */}
          <div className="border border-gray-800 p-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-gray-500 tracking-widest uppercase">
                Agents Joined
              </p>
              <p className="text-xs font-mono text-red-400">
                {players.length} / {game.capacity ?? '—'}
              </p>
            </div>

            {players.length === 0 ? (
              <div className="flex items-center gap-2 py-4 justify-center">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                <p className="text-xs text-gray-600 tracking-widest uppercase">
                  Waiting for players...
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {players.map((player) => (
                  <div
                    key={player._id}
                    className="border border-gray-700 bg-gray-900 px-4 py-3 flex items-center gap-2"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 flex-shrink-0" />
                    <span className="font-mono text-sm text-gray-100 truncate uppercase tracking-wide">
                      {player.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
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
              disabled={starting || players.length === 0}
              className="w-full bg-red-700 hover:bg-red-600 disabled:bg-gray-800 disabled:text-gray-600 text-white text-sm tracking-widest uppercase py-4 transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              {starting
                ? 'DEPLOYING AGENTS...'
                : players.length === 0
                  ? 'WAITING FOR PLAYERS'
                  : `START MISSION (${players.length} AGENT${players.length !== 1 ? 'S' : ''})`}
            </button>
          )}

        </div>
      </main>
    </div>
  );
};

export default Lobby;
