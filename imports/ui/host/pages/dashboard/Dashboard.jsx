import React from 'react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center justify-center gap-6">
      <h1 className="font-mono text-3xl font-bold tracking-widest text-red-500 uppercase">Host Dashboard</h1>
      <Link
        to="/game/create"
        className="border border-red-700 bg-red-950/40 px-8 py-4 font-mono text-sm uppercase tracking-widest text-red-400 transition hover:bg-red-700 hover:text-white"
      >
        Create New Game
      </Link>
    </div>
  );
};

export default Dashboard;
