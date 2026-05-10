import React from 'react';

const BG = '#131313';

const WinScreen = ({ onPlayAgain }) => {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: BG }}>

      {/* Navbar — matches other pages */}
      <header
        className="border-b border-gray-800 px-8 py-4 flex items-center justify-between"
        style={{ backgroundColor: BG }}
      >
        <span className="text-red-500 font-bold text-xl tracking-widest uppercase">
          ESCAPESNAP
        </span>
        <span className="text-xs text-gray-500 tracking-widest uppercase">
          MISSION COMPLETE
        </span>
      </header>

      {/* Centered content */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <h1
          className="font-extrabold uppercase mb-4"
          style={{
            color: '#991b1b',
            fontSize: '6rem',
            letterSpacing: '0.1em',
            lineHeight: 1,
          }}
        >
          You Escaped!
        </h1>

        <p
          className="text-white uppercase mb-16"
          style={{ letterSpacing: '0.3em', fontSize: '1rem' }}
        >
          The riddle has been solved.
        </p>

        {/* TODO: onPlayAgain should navigate to lobby screen once implemented */}
        <button
          onClick={onPlayAgain}
          className="font-bold uppercase transition-colors duration-200"
          style={{
            backgroundColor: '#991b1b',
            color: 'white',
            letterSpacing: '0.2em',
            fontSize: '1rem',
            padding: '1rem 4rem',
          }}
          onMouseEnter={e => (e.target.style.backgroundColor = '#7f1d1d')}
          onMouseLeave={e => (e.target.style.backgroundColor = '#991b1b')}
        >
          Play Again
        </button>
      </div>

    </div>
  );
};

export default WinScreen;