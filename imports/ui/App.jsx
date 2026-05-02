import React from 'react';
import { Routes, Route } from 'react-router';

import Dashboard from './host/pages/dashboard/Dashboard';
import FinalRiddlePage from './host/pages/riddle/FinalRiddlePage';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/game/:gameId/final-riddle" element={<FinalRiddlePage />} />
    </Routes>
  );
}
