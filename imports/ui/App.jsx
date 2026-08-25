import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useParams } from 'react-router';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { Games } from '../api/games/GamesCollection';
import { Players } from '../api/players/PlayersCollection';
import { PlayerHome } from './mobile/pages/PlayerHome';
import { PlayerLobby } from './mobile/pages/lobby/PlayerLobby';
import { PlayerDashboard } from './mobile/pages/PlayerDashboard';
import { HelpTutorial } from './mobile/components/gameplay/HelpTutorial';
import CreateGame from './host/pages/create-game/CreateGame';
import Lobby from './host/pages/lobby/Lobby';
import ProgressPage from './host/pages/progress/ProgressPage';
import FinalRiddlePage from './host/pages/riddle/FinalRiddlePage';
import LandingPage from './host/pages/landing/Landing';
import Leaderboard from './host/pages/leaderboard/Leaderboard';

function PlayerFlow({ initialCode = '' }) {
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

  // Fire the auto-advance once per join. Without the guard, returning to the
  // lobby mid-game bounces you straight back out again.
  const autoAdvancedRef = useRef(false);
  useEffect(() => {
    if (game?.status === 'in_progress' && screen === 'lobby' && !autoAdvancedRef.current) {
      autoAdvancedRef.current = true;
      setScreen('tutorial');
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
      autoAdvancedRef.current = false;
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
    return (
      <PlayerHome
        onStart={handleJoin}
        loading={joinLoading}
        serverError={joinError}
        initialCode={initialCode}
      />
    );
  }
  if (screen === 'lobby') {
    return (
      <PlayerLobby
        playerName={playerName}
        gameCode={gameCode}
        playerCount={playerCount}
        inSession={game?.status === 'in_progress'}
        gameStartedAt={game?.startedAt ? new Date(game.startedAt).getTime() : null}
        roundDuration={(game?.timerMinutes ?? 30) * 60}
        onExit={game?.status === 'in_progress' ? () => setScreen('dashboard') : handleExitToHome}
      />
    );
  }
  if (screen === 'tutorial') {
    return <HelpTutorial onComplete={() => setScreen('dashboard')} />;
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

function JoinViaQr() {
  const { joinCode } = useParams();
  return <PlayerFlow initialCode={(joinCode || '').toUpperCase()} />;
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/player/*" element={<PlayerFlow />} />
      <Route path="/join/:joinCode" element={<JoinViaQr />} />
      <Route path="/host" element={<CreateGame />} />
      <Route path="/game/create" element={<CreateGame />} />
      <Route path="/game/:gameId/lobby" element={<Lobby />} />
      <Route path="/game/:gameId/progress" element={<ProgressPage />} />
      <Route path="/game/:gameId/final-riddle" element={<FinalRiddlePage />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
    </Routes>
  );
}
