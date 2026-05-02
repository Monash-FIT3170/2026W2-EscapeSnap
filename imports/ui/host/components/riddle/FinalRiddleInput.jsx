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
    <div className='min-w-screen px-20'>
      <input
        type="text"
        placeholder="Input riddle guess..."
        className="w-full bg-gray-900 border-gray-200 min-h-22 input input-lg text-gray-500 text-2xl font-extraitalic"
        onChange={e => setGuess(e.target.value)}
      />
      <button
        className="w-full min-h-22 btn bg-red-600 mt-15 font-italic text-2xl"
        onClick={handleSubmit}
      >
        Make Guess
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