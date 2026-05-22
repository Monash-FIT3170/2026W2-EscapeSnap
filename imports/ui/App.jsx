import React, { useState, useRef } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { Meteor } from 'meteor/meteor';
import { PlayerHome } from './mobile/pages/PlayerHome';
import { PlayerLobby } from './mobile/pages/lobby/PlayerLobby';
import { PlayerDashboard } from './mobile/pages/PlayerDashboard';
import CreateGame from './host/pages/create-game/CreateGame';
import Lobby from './host/pages/lobby/Lobby';
import Dashboard from './host/pages/dashboard/Dashboard';

const ROUND_DURATION = 60;

// Mobile player flow — manages screen state internally
function PlayerFlow() {
  const [screen, setScreen] = useState('home');
  const [playerName, setPlayerName] = useState('');
  const [gameCode, setGameCode] = useState('');
  const [inSession, setInSession] = useState(false);
  const [gameStartedAt, setGameStartedAt] = useState(null);
  const sessionId = useRef(null);

  const handleJoin = (name, code) => {
    setPlayerName(name);
    setGameCode(code);
    setScreen('lobby');
  };

  const handleGameStart = () => {
    if (!sessionId.current) {
      // First launch only — set timestamp and register with server
      sessionId.current = Math.random().toString(36).slice(2) + Date.now().toString(36);
      setGameStartedAt(Date.now());
      Meteor.callAsync('games.startRound', sessionId.current).catch(err =>
        console.error('[round-timer] startRound failed:', err)
      );
    }
    // On rejoin, gameStartedAt is preserved — timer continues from where it left off
    setInSession(true);
    setScreen('dashboard');
  };

  const handleExitToHome = () => {
    setPlayerName('');
    setGameCode('');
    setInSession(false);
    setGameStartedAt(null);
    sessionId.current = null;
    setScreen('home');
  };

  const handleReturnToLobby = () => {
    setScreen('lobby');
  };

  if (screen === 'home') return (
    <PlayerHome onStart={handleJoin} />
  );
  if (screen === 'lobby') return (
    <PlayerLobby
      playerName={playerName}
      gameCode={gameCode}
      inSession={inSession}
      gameStartedAt={gameStartedAt}
      roundDuration={ROUND_DURATION}
      onGameStart={handleGameStart}
      onExit={handleExitToHome}
    />
  );
  return (
    <PlayerDashboard
      playerName={playerName}
      gameCode={gameCode}
      sessionId={sessionId.current}
      gameStartedAt={gameStartedAt}
      onExit={handleReturnToLobby}
    />
  );
}

// Landing page — choose host or player
function LandingPage() {
  return (
    <div
      className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-8"
      style={{
        backgroundImage: 'linear-gradient(rgba(239,68,68,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(239,68,68,0.04) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }}
    >
      <h1 className="font-mono text-4xl font-bold tracking-widest text-red-500 uppercase">
        EscapeSnap
      </h1>
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <Link
          to="/player"
          className="block w-full border border-slate-700 bg-slate-950 py-4 text-center font-mono text-sm uppercase tracking-widest text-white transition hover:border-red-500 hover:text-red-400"
        >
          Join as Player
        </Link>
        <Link
          to="/host"
          className="block w-full border border-red-700 bg-red-950/40 py-4 text-center font-mono text-sm uppercase tracking-widest text-red-400 transition hover:bg-red-700 hover:text-white"
        >
          Host a Game
        </Link>
      </div>
    </div>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/player/*" element={<PlayerFlow />} />
      <Route path="/host" element={<Dashboard />} />
      <Route path="/game/create" element={<CreateGame />} />
      <Route path="/game/:gameId/lobby" element={<Lobby />} />
    </Routes>
  );
}
