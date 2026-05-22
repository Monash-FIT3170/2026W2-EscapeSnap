import React, { useState, useRef } from 'react';
import { Routes, Route } from 'react-router';
import { Link } from 'react-router-dom';
import { Meteor } from 'meteor/meteor';
import { PlayerHome } from './mobile/pages/PlayerHome';
import { PlayerLobby } from './mobile/pages/lobby/PlayerLobby';
import { PlayerDashboard } from './mobile/pages/PlayerDashboard';
import CreateGame from './host/pages/create-game/CreateGame';
import Lobby from './host/pages/lobby/Lobby';
import ProgressPage from './host/pages/progress/ProgressPage';
import FinalRiddlePage from './host/pages/riddle/FinalRiddlePage';

const ROUND_DURATION = 60;

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
      sessionId.current = Math.random().toString(36).slice(2) + Date.now().toString(36);
      setGameStartedAt(Date.now());
      Meteor.callAsync('games.startRound', sessionId.current).catch(err =>
        console.error('[round-timer] startRound failed:', err)
      );
    }
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

  if (screen === 'home') return <PlayerHome onStart={handleJoin} />;
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

function LandingPage() {
  return (
    <div className="min-h-screen text-gray-100 flex flex-col" style={{ background: '#0e0e0e' }}>
      <header className="px-8 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #1c1b1b' }}>
        <span className="font-bold text-xl tracking-widest uppercase" style={{ color: '#e5e2e1' }}>
          ESCAPESNAP
        </span>
      </header>

      <main className="flex-1 flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-2xl text-center">
          <p className="text-xs tracking-widest mb-3" style={{ color: '#8b0000' }}>
            INITIATE PROTOCOL
          </p>
          <h1 className="text-6xl font-bold tracking-widest uppercase mb-6" style={{ color: '#e5e2e1' }}>
            ESCAPESNAP
          </h1>
          <p className="text-sm tracking-wide mb-12 max-w-md mx-auto leading-relaxed" style={{ color: '#aa8984' }}>
            Turn your surroundings into an interactive escape room. Solve visual riddles, collect clues, and crack the final code — wherever you are.
          </p>

          <div className="flex flex-col gap-4 w-full max-w-xs mx-auto">
            <Link
              to="/player"
              className="block w-full py-4 text-center text-sm tracking-widest uppercase transition-colors cursor-pointer"
              style={{ border: '1px solid #1c1b1b', color: '#e5e2e1', background: 'transparent' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#8b0000'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#1c1b1b'}
            >
              JOIN AS PLAYER
            </Link>
            <Link
              to="/host"
              className="block w-full py-4 text-center text-sm tracking-widest uppercase transition-colors cursor-pointer"
              style={{ background: '#8b0000', color: '#e5e2e1' }}
              onMouseEnter={e => e.currentTarget.style.background = '#a50000'}
              onMouseLeave={e => e.currentTarget.style.background = '#8b0000'}
            >
              HOST A GAME
            </Link>
          </div>

          <p className="text-xs tracking-widest mt-8" style={{ color: '#444' }}>
            HOST A SESSION · BEGIN MISSION
          </p>
        </div>
      </main>

      <footer className="px-8 py-4 text-center" style={{ borderTop: '1px solid #1c1b1b' }}>
        <p className="text-xs tracking-widest" style={{ color: '#444' }}>
          ESCAPESNAP
        </p>
      </footer>
    </div>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/player/*" element={<PlayerFlow />} />
      <Route path="/host" element={<CreateGame />} />
      <Route path="/game/create" element={<CreateGame />} />
      <Route path="/game/:gameId/lobby" element={<Lobby />} />
      <Route path="/game/:gameId/progress" element={<ProgressPage />} />
      <Route path="/game/:gameId/final-riddle" element={<FinalRiddlePage />} />
    </Routes>
  );
}
