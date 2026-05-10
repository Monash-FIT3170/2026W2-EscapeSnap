import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';

const FinalRiddleInput = ({ gameId, onCorrect = () => {} }) => {
  const [guess, setGuess] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!result) return;
    const timer = setTimeout(() => setResult(null), 3000);
    return () => clearTimeout(timer);
  }, [result]);

  function handleSubmit() {
    Meteor.call('games.submitFinalAnswer', gameId, guess, (error, isCorrect) => {
      if (error) {
        console.error(error);
        return;
      }
      setResult(isCorrect ? 'correct' : 'incorrect');
      if (isCorrect) onCorrect();
    });
  }

  return (
    <div className="mt-6">
      <p className="text-xs font-bold tracking-[0.3em] text-gray-400 uppercase mb-3">
        Submit Decryption
      </p>
      <input
        type="text"
        placeholder="ENTER TERMINAL OVERRIDE..."
        className="w-full bg-transparent border border-gray-700 text-white placeholder-gray-600 text-sm font-mono tracking-widest px-4 py-4 mb-3 focus:outline-none focus:border-red-600"
        onChange={e => setGuess(e.target.value)}
        value={guess}
      />
      <button
        className="w-full bg-red-900 hover:bg-red-600 text-white font-bold text-sm tracking-[0.3em] uppercase py-4 transition-colors duration-200 flex items-center justify-center gap-3"
        onClick={handleSubmit}
      >
        {/* lock icon */}
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
        ENGAGE THE LATCH
      </button>

      {result === 'incorrect' && (
        <div className="toast toast-center toast-middle">
          <div className="alert alert-error">
            <span>Incorrect Guess.</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinalRiddleInput;