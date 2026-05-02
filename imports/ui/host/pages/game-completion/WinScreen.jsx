import React from 'react';

const WinScreen = ({ onPlayAgain }) => {
  return (
    <div className='min-h-screen bg-gray-900 flex flex-col items-center justify-center'>
      <h1 className='text-red-600 font-extrabold text-7xl uppercase tracking-widest mb-4'>
        You Escaped!
      </h1>
      <p className='text-white text-2xl font-extraitalic mb-12'>
        The riddle has been solved.
      </p>
       {/* TODO: onPlayAgain should navigate to lobby screen once implemented */}
      <button
        className='btn bg-red-600 text-white text-2xl px-12 min-h-16'
        onClick={onPlayAgain}
      >
        Play Again
      </button>
    </div>
  );
};

export default WinScreen;