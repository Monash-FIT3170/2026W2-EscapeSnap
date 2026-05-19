import React from 'react';

const LoseScreen = ({ onPlayAgain }) => {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0e0e0e', color: '#e5e2e1' }}>

      <header className="px-8 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #1c1b1b' }}>
        <span className="font-bold text-xl tracking-widest uppercase" style={{ color: '#e5e2e1' }}>
          ESCAPESNAP
        </span>
        <span className="text-xs tracking-widest uppercase" style={{ color: '#aa8984' }}>
          MISSION FAILED
        </span>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <p className="text-xs tracking-widest" style={{ color: '#8b0000' }}>
          MISSION FAILED
        </p>

        <h1
          className="font-bold uppercase"
          style={{
            fontSize: '5rem',
            letterSpacing: '0.1em',
            lineHeight: 1,
            color: '#e5e2e1',
          }}
        >
          NO ESCAPE.
        </h1>

        <p className="uppercase" style={{ fontSize: 12, letterSpacing: '2px', color: '#aa8984' }}>
          THE RIDDLE REMAINS UNSOLVED.
        </p>

        <button
          onClick={onPlayAgain}
          className="font-bold uppercase"
          style={{
            marginTop: 32,
            padding: '14px 64px',
            background: '#8b0000',
            color: '#e5e2e1',
            fontSize: 13,
            letterSpacing: '1.5px',
            cursor: 'pointer',
            border: 'none',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#a50000'}
          onMouseLeave={e => e.currentTarget.style.background = '#8b0000'}
        >
          TRY AGAIN
        </button>
      </div>

    </div>
  );
};

export default LoseScreen;