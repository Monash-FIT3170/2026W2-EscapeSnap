import React from 'react';

const BG = '#131313';

const LoseScreen = ({ onPlayAgain }) => {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: BG }}>

      <header
        className="border-b border-gray-800 px-8 py-4 flex items-center justify-between"
        style={{ backgroundColor: BG }}
      >
        <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: '1.8px', color: '#e5e2e1' }}>
          ESCAPESNAP
        </span>
        <span style={{ fontSize: 10, letterSpacing: '1px', color: '#aa8984' }}>
          MISSION FAILED
        </span>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <div style={{ width: 4, height: 48, background: '#8b0000', marginBottom: 8 }} />

        <h1 style={{
          fontWeight: 700,
          fontSize: '5rem',
          letterSpacing: '0.1em',
          lineHeight: 1,
          color: '#6b6b6b',
        }}>
          NO ESCAPE.
        </h1>

        <p style={{ fontSize: 12, letterSpacing: '2px', color: '#aa8984' }}>
          THE RIDDLE REMAINS UNSOLVED.
        </p>

        <button
          onClick={onPlayAgain}
          style={{
            marginTop: 32,
            padding: '14px 64px',
            background: '#1c1b1b',
            color: '#e5e2e1',
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: '1.5px',
            cursor: 'pointer',
            transition: 'background 0.15s',
            border: '1px solid #374151',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#374151')}
          onMouseLeave={e => (e.currentTarget.style.background = '#1c1b1b')}
        >
          TRY AGAIN
        </button>
      </div>

    </div>
  );
};

export default LoseScreen;