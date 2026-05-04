import React from 'react';
import { Routes, Route } from 'react-router';
import Landing from './host/pages/landing/Landing';
import Dashboard from './host/pages/dashboard/Dashboard';
import FinalRiddlePage from './host/pages/riddle/FinalRiddlePage';
import CreateGame from './host/pages/create-game/CreateGame';
import Lobby from './host/pages/lobby/Lobby';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/game/create" element={<CreateGame />} />
      <Route path="/game/:gameId/lobby" element={<Lobby />} />
      <Route path="/game/:gameId/final-riddle" element={<FinalRiddlePage />} />
    </Routes>
  );
}
