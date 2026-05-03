import React from 'react';
import { useNavigate } from 'react-router';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      <header className="border-b border-gray-800 px-8 py-4 flex items-center justify-between">
        <span className="text-red-500 font-bold text-xl tracking-widest uppercase">
          ESCAPESNAP
        </span>
      </header>

      <main className="flex-1 flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-2xl text-center">
          <p className="text-xs text-red-500 tracking-widest mb-3">
            INITIATE PROTOCOL
          </p>
          <h1 className="text-6xl font-bold tracking-widest uppercase text-gray-100 mb-6">
            ESCAPESNAP
          </h1>
          <p className="text-sm text-gray-400 tracking-wide mb-12 max-w-md mx-auto leading-relaxed">
            Turn your surroundings into an interactive escape room. Solve visual riddles, collect clues, and crack the final code — wherever you are.
          </p>

          <button
            onClick={() => navigate('/game/create')}
            className="bg-red-700 hover:bg-red-600 text-white text-sm tracking-widest uppercase px-12 py-4 transition-colors cursor-pointer"
          >
            CREATE NEW GAME
          </button>

          <p className="text-xs text-gray-600 tracking-widest mt-8">
            HOST A SESSION · BEGIN MISSION
          </p>
        </div>
      </main>

      <footer className="border-t border-gray-800 px-8 py-4 text-center">
        <p className="text-xs text-gray-600 tracking-widest">
          ESCAPESNAP
        </p>
      </footer>
    </div>
  );
};

export default Landing;