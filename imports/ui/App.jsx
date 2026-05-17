import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { PlayerHome } from './mobile/pages/PlayerHome';
import { PlayerLobby } from './mobile/pages/lobby/PlayerLobby';
import { PlayerDashboard } from './mobile/pages/PlayerDashboard';

export function App() {
  const [screen, setScreen] = useState('home');
  const [playerName, setPlayerName] = useState('');
  const [gameCode, setGameCode] = useState('');
  const [playerId, setPlayerId] = useState(null);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');

  const handleJoin = async (name, code) => {
    setJoining(true);
    setJoinError('');
    try {
      const id = await Meteor.callAsync('players.join', code, name);
      setPlayerName(name);
      setGameCode(code);
      setPlayerId(id);
      setScreen('lobby');
    } catch (err) {
      setJoinError(err.reason || err.message || 'Failed to join game');
    } finally {
      setJoining(false);
    }
  };

  const handleExit = () => {
    setPlayerName('');
    setGameCode('');
    setPlayerId(null);
    setJoinError('');
    setScreen('home');
  };

  if (screen === 'home') return (
    <PlayerHome
      onStart={handleJoin}
      loading={joining}
      serverError={joinError}
    />
  );
  if (screen === 'lobby') return (
    <PlayerLobby
      playerName={playerName}
      gameCode={gameCode}
      playerId={playerId}
      onGameStart={() => setScreen('dashboard')}
      onExit={handleExit}
    />
  );
  return (
    <PlayerDashboard
      playerName={playerName}
      gameCode={gameCode}
      playerId={playerId}
      onExit={handleExit}
    />
  );
}
