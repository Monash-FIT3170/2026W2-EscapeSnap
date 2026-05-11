import React from 'react';

const RevealedLetters = ({ letters }) => {
  return (
    <div className="mt-8 mb-6">
      <p className="text-xs font-bold tracking-[0.3em] text-gray-400 uppercase mb-4">
        Collected Fragments
      </p>
      <div className="flex flex-wrap gap-3">
        {letters.map((letter, index) =>
          letter ? (
            <div
              key={index}
              className="flex items-center justify-center border-b-2 border-red-600 text-white font-bold text-2xl uppercase"
              style={{ width: '72px', height: '72px', backgroundColor: '#3b3c3dff' }}
            >
              {letter}
            </div>
          ) : (
            <div
              key={index}
              className="flex items-center justify-center border-b-2 border-gray-600 text-gray-500"
              style={{ width: '72px', height: '72px', backgroundColor: '#2a2f3e' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default RevealedLetters;