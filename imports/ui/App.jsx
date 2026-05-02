import React from 'react';
import { Routes, Route } from 'react-router';

import Dashboard from './host/pages/dashboard/Dashboard';
import FinalRiddlePage from './host/pages/riddle/FinalRiddlePage';
import CreateGame from './host/pages/create-game/CreateGame';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/game/create" element={<CreateGame />} />
      <Route path="/game/:gameId/final-riddle" element={<FinalRiddlePage />} />
    </Routes>
  );
}
