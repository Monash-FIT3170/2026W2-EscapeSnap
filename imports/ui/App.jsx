import React, { useState } from 'react';
import { PlayerHome } from './mobile/pages/PlayerHome';
import { PlayerLobby } from './mobile/pages/lobby/PlayerLobby';
import { PlayerDashboard } from './mobile/pages/PlayerDashboard';

export function App() {
  const [screen, setScreen] = useState('home');
  const [playerName, setPlayerName] = useState('');
  const [gameCode, setGameCode] = useState('');

  if (screen === 'home') return (
    <PlayerHome
      onStart={(name, code) => { setPlayerName(name); setGameCode(code); setScreen('lobby'); }}
    />
  );
  if (screen === 'lobby') return (
    <PlayerLobby
      playerName={playerName}
      gameCode={gameCode}
      onGameStart={() => setScreen('dashboard')}
      onExit={() => { setPlayerName(''); setGameCode(''); setScreen('home'); }}
    />
  );
  return (
    <PlayerDashboard
      playerName={playerName}
      gameCode={gameCode}
      onExit={() => {
        setPlayerName('');
        setGameCode('');
        setScreen('home');
      }}
    />
  );
}
