import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { Games } from '../api/games/GamesCollection';
import { Players } from '../api/players/PlayersCollection';
import { PlayerHome } from './mobile/pages/PlayerHome';
import { PlayerLobby } from './mobile/pages/lobby/PlayerLobby';
import { PlayerDashboard } from './mobile/pages/PlayerDashboard';
import CreateGame from './host/pages/create-game/CreateGame';
import Lobby from './host/pages/lobby/Lobby';
import ProgressPage from './host/pages/progress/ProgressPage';
import FinalRiddlePage from './host/pages/riddle/FinalRiddlePage';
import LandingPage from './host/pages/landing/Landing';

function PlayerFlow() {
  const [screen, setScreen] = useState('home');
  const [playerName, setPlayerName] = useState('');
  const [gameCode, setGameCode] = useState('');
  const [playerId, setPlayerId] = useState(null);
  const [gameId, setGameId] = useState(null);
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState('');

  const { game, playerCount } = useTracker(() => {
    if (!gameId) return { game: null, playerCount: 0 };
    Meteor.subscribe('games.current', gameId);
    Meteor.subscribe('players.inGame', gameId);
    return {
      game: Games.findOne(gameId),
      playerCount: Players.find({ gameId }).count(),
    };
  }, [gameId]);

  useEffect(() => {
    if (game?.status === 'in_progress' && screen === 'lobby') {
      setScreen('dashboard');
    }
  }, [game?.status, screen]);

  const handleJoin = async (name, code) => {
    setJoinLoading(true);
    setJoinError('');
    try {
      const { playerId: pid, gameId: gid } = await Meteor.callAsync('players.join', code, name);
      setPlayerName(name);
      setGameCode(code);
      setPlayerId(pid);
      setGameId(gid);
      setScreen('lobby');
    } catch (err) {
      setJoinError(err.reason || err.message || 'Failed to join game');
    } finally {
      setJoinLoading(false);
    }
  };

  const handleExitToHome = () => {
    setPlayerName('');
    setGameCode('');
    setPlayerId(null);
    setGameId(null);
    setJoinError('');
    setScreen('home');
  };

  if (screen === 'home') {
    return <PlayerHome onStart={handleJoin} loading={joinLoading} serverError={joinError} />;
  }
  if (screen === 'lobby') {
    return (
      <PlayerLobby
        playerName={playerName}
        gameCode={gameCode}
        playerCount={playerCount}
        onExit={handleExitToHome}
      />
    );
  }
  return (
    <PlayerDashboard
      playerName={playerName}
      gameCode={gameCode}
      playerId={playerId}
      gameId={gameId}
      onExit={() => setScreen('lobby')}
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
