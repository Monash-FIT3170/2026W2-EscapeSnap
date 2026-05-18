import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { Games } from '../../../../api/games/GamesCollection';
import { Players } from '../../../../api/players/PlayersCollection';

const PlayerCard = ({ player }) => {
  const initials = player.name?.slice(0, 2).toUpperCase() || '??';
  return (
    <div
      className="flex items-center gap-4 p-4"
      style={{ background: '#0e0e0e', border: '1px solid #1c1b1b' }}
    >
      <div
        className="flex items-center justify-center flex-shrink-0"
        style={{
          width: 64, height: 64,
          background: '#1c1b1b',
          border: '1px solid #2a2a2a',
          fontSize: 20,
          fontWeight: 700,
          color: '#e5e2e1',
          letterSpacing: '1px',
        }}
      >
        {initials}
      </div>
      <div>
        <p style={{ fontWeight: 700, fontSize: 16, letterSpacing: '1.5px', color: '#e5e2e1' }}>
          {player.name?.toUpperCase()}
        </p>
        <div className="flex gap-1 mt-2">
          <div style={{ width: 24, height: 3, background: '#8b0000' }} />
          <div style={{ width: 12, height: 3, background: '#3a0000' }} />
        </div>
      </div>
    </div>
  );
};

const EmptySlot = () => (
  <div
    className="flex items-center justify-center"
    style={{
      background: '#0a0a0a',
      border: '1px dashed #1c1b1b',
      minHeight: 88,
      color: '#2a2a2a',
      fontSize: 11,
      letterSpacing: '1.5px',
    }}
  >
    AWAITING OPERATIVE...
  </div>
);

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
      await Meteor.callAsync('rounds.createForGame', gameId);
    } catch (err) {
      setError(err.reason || err.message || 'FAILED TO START GAME');
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0e0e0e' }}>
        <p style={{ fontSize: 10, letterSpacing: '1px', color: '#aa8984' }}>LOADING...</p>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0e0e0e' }}>
        <p style={{ fontSize: 10, letterSpacing: '1px', color: '#8b0000' }}>GAME NOT FOUND</p>
      </div>
    );
  }

  const gameStarted = game.status === 'in_progress';
  const capacity = game.capacity || 4;
  const slots = [
    ...players,
    ...Array(Math.max(0, capacity - players.length)).fill(null),
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0e0e0e', color: '#e5e2e1' }}>

      {/* Navbar */}
      <header
        className="flex items-center justify-between px-8 py-4"
        style={{ borderBottom: '1px solid #1c1b1b' }}
      >
        <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: '1.8px', color: '#e5e2e1' }}>
          ESCAPESNAP
        </span>
        <span style={{ fontSize: 10, letterSpacing: '1px', color: '#aa8984' }}>
          GAME LOBBY
        </span>
      </header>

      <main className="flex-1 flex">

        {/* Left sidebar */}
        <div
          className="flex flex-col gap-6 p-8"
          style={{ width: 300, minWidth: 300, borderRight: '1px solid #1c1b1b' }}
        >
          {/* Join code */}
          <div>
            <p style={{ fontSize: 9, letterSpacing: '1.5px', color: '#aa8984', marginBottom: 4 }}>
              ACCESS AUTHORIZATION
            </p>
            <p style={{ fontSize: 9, letterSpacing: '1px', color: '#555', marginBottom: 8 }}>
              SECURE ENTRY PIN
            </p>
            <p style={{ fontSize: 48, fontWeight: 700, letterSpacing: '4px', lineHeight: 1, color: '#e5e2e1' }}>
              {game.joinCode || '----'}
            </p>
          </div>

          {/* Game code box */}
          <div
            className="p-4"
            style={{ background: '#1c1b1b', border: '1px solid #2a2a2a' }}
          >
            <p style={{ fontSize: 9, letterSpacing: '1px', color: '#aa8984', marginBottom: 8 }}>
              GAME CODE
            </p>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#e5e2e1', letterSpacing: '1px', wordBreak: 'break-all' }}>
              {gameId}
            </p>
            <p style={{ fontSize: 9, color: '#555', marginTop: 8, lineHeight: 1.5 }}>
              Distribute the PIN or share the game code to sync operatives to this terminal.
            </p>
          </div>

          {/* Difficulty */}
          <div>
            <p style={{ fontSize: 9, letterSpacing: '1.5px', color: '#aa8984', marginBottom: 8 }}>
              GAME DIFFICULTY
            </p>
            {['easy', 'medium', 'hard'].map(d => (
              <div
                key={d}
                className="flex items-center justify-between px-4 py-3 mb-2"
                style={{ border: game.difficulty === d ? '1px solid #8b0000' : '1px solid #1c1b1b' }}
              >
                <span style={{ fontSize: 11, letterSpacing: '1px', color: game.difficulty === d ? '#e5e2e1' : '#555' }}>
                  {d === 'easy' ? 'EASY: STABLE VITALS' : d === 'medium' ? 'MEDIUM: ELEVATED CORTISOL' : 'HARD: SYSTEMIC FAILURE'}
                </span>
                <div style={{
                  width: 16, height: 16, borderRadius: '50%',
                  border: `2px solid ${game.difficulty === d ? '#8b0000' : '#333'}`,
                  background: game.difficulty === d ? '#8b0000' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {game.difficulty === d && (
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#e5e2e1' }} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 flex flex-col p-8 gap-6">

          {/* Header row */}
          <div className="flex items-center justify-between">
            <div>
              <h1 style={{ fontWeight: 700, fontSize: 28, letterSpacing: '2px', color: '#e5e2e1' }}>
                GAME LOBBY
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#8b0000' }} />
                <p style={{ fontSize: 10, letterSpacing: '1px', color: '#aa8984' }}>
                  AWAITING GAME START...
                </p>
              </div>
            </div>
            <div className="text-right">
              <p style={{ fontSize: 9, letterSpacing: '1px', color: '#aa8984' }}>CAPACITY</p>
              <p style={{ fontSize: 28, fontWeight: 700, letterSpacing: '2px', color: '#e5e2e1' }}>
                {String(players.length).padStart(2, '0')} /{' '}
                <span style={{ color: '#555' }}>{String(capacity).padStart(2, '0')}</span>
              </p>
            </div>
          </div>

          {/* Players grid */}
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            {slots.map((player, i) =>
              player ? (
                <PlayerCard key={player._id} player={player} />
              ) : (
                <EmptySlot key={`empty-${i}`} />
              )
            )}
          </div>

          {error && (
            <p style={{ fontSize: 11, color: '#8b0000', letterSpacing: '1px' }}>!! {error}</p>
          )}

          {/* Start button */}
          {gameStarted ? (
            <div
              className="text-center py-4"
              style={{ border: '1px solid #8b0000', background: '#1c0000' }}
            >
              <p style={{ fontSize: 12, letterSpacing: '1.5px', color: '#aa8984' }}>
                MISSION ACTIVE — AGENTS DEPLOYED
              </p>
            </div>
          ) : (
            <button
              onClick={handleStartGame}
              disabled={starting}
              style={{
                width: '100%',
                padding: '18px',
                background: starting ? '#3a0000' : '#8b0000',
                color: starting ? '#555' : '#e5e2e1',
                fontWeight: 700,
                fontSize: 14,
                letterSpacing: '2px',
                cursor: starting ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s',
                border: 'none',
              }}
              onMouseEnter={e => { if (!starting) e.currentTarget.style.background = '#a50000'; }}
              onMouseLeave={e => { if (!starting) e.currentTarget.style.background = '#8b0000'; }}
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