import React from 'react';

const WinScreen = ({ onPlayAgain, onViewSummary }) => {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0e0e0e', color: '#e5e2e1' }}>

      <header className="px-8 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #1c1b1b' }}>
        <span className="font-bold text-xl tracking-widest uppercase" style={{ color: '#e5e2e1' }}>
          ESCAPESNAP
        </span>
        <span className="text-xs tracking-widest uppercase" style={{ color: '#aa8984' }}>
          MISSION COMPLETE
        </span>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center">
        <p className="text-xs tracking-widest mb-3" style={{ color: '#8b0000' }}>
          MISSION SUCCESS
        </p>
        <h1
          className="font-extrabold uppercase mb-4"
          style={{
            color: '#e5e2e1',
            fontSize: '6rem',
            letterSpacing: '0.1em',
            lineHeight: 1,
          }}
        >
          YOU ESCAPED
        </h1>

        <p
          className="uppercase mb-16"
          style={{ letterSpacing: '0.3em', fontSize: '1rem', color: '#aa8984' }}
        >
          THE RIDDLE HAS BEEN SOLVED.
        </p>

        <div className="flex items-center gap-4">
          <button
            onClick={onPlayAgain}
            className="font-bold uppercase transition-colors duration-200"
            style={{
              background: '#8b0000',
              color: '#e5e2e1',
              letterSpacing: '0.2em',
              fontSize: '1rem',
              padding: '1rem 4rem',
              border: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#a50000'}
            onMouseLeave={e => e.currentTarget.style.background = '#8b0000'}
          >
            PLAY AGAIN
          </button>

          {onViewSummary && (
            <button
              onClick={onViewSummary}
              className="font-bold uppercase transition-colors duration-200"
              style={{
                background: 'transparent',
                color: '#aa8984',
                letterSpacing: '0.2em',
                fontSize: '1rem',
                padding: '1rem 4rem',
                border: '1px solid #353534',
                cursor: 'pointer',
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#e5e2e1'}
              onMouseLeave={e => e.currentTarget.style.color = '#aa8984'}
            >
              VIEW DEBRIEF
            </button>
          )}
        </div>
      </div>

    </div>
  );
};

export default WinScreen;