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
import LandingPage from './host/pages/landing/Landing';

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
