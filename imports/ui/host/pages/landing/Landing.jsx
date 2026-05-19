import React from 'react';
import { useNavigate } from 'react-router';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen text-gray-100 flex flex-col" style={{ background: '#0e0e0e' }}>
      <header className="px-8 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #1c1b1b' }}>
        <span className="font-bold text-xl tracking-widest uppercase" style={{ color: '#e5e2e1' }}>
          ESCAPESNAP
        </span>
      </header>

      <main className="flex-1 flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-2xl text-center">
          <p className="text-xs tracking-widest mb-3" style={{ color: '#8b0000' }}>
            INITIATE PROTOCOL
          </p>
          <h1 className="text-6xl font-bold tracking-widest uppercase mb-6" style={{ color: '#e5e2e1' }}>
            ESCAPESNAP
          </h1>
          <p className="text-sm tracking-wide mb-12 max-w-md mx-auto leading-relaxed" style={{ color: '#aa8984' }}>
            Turn your surroundings into an interactive escape room. Solve visual riddles, collect clues, and crack the final code — wherever you are.
          </p>

          <button
            onClick={() => navigate('/game/create')}
            className="text-sm tracking-widest uppercase px-12 py-4 transition-colors cursor-pointer"
            style={{ background: '#8b0000', color: '#e5e2e1' }}
            onMouseEnter={e => e.currentTarget.style.background = '#a50000'}
            onMouseLeave={e => e.currentTarget.style.background = '#8b0000'}
          >
            CREATE NEW GAME
          </button>

          <p className="text-xs tracking-widest mt-8" style={{ color: '#444' }}>
            HOST A SESSION · BEGIN MISSION
          </p>
        </div>
      </main>

      <footer className="px-8 py-4 text-center" style={{ borderTop: '1px solid #1c1b1b' }}>
        <p className="text-xs tracking-widest" style={{ color: '#444' }}>
          ESCAPESNAP
        </p>
      </footer>
    </div>
  );
};

export default Landing;