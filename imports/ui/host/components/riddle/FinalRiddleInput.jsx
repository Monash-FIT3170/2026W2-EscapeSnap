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
    <div className="flex flex-col gap-3">
      <input
        type="text"
        placeholder="TYPE YOUR ANSWER..."
        value={guess}
        onChange={e => setGuess(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        style={{
          width: '100%',
          background: '#131313',
          border: '1px solid #353534',
          padding: '14px 16px',
          color: '#e5e2e1',
          fontSize: 14,
          letterSpacing: '1px',
          outline: 'none',
          fontFamily: "'Space Grotesk', Helvetica, sans-serif",
        }}
      />
      <button
        onClick={handleSubmit}
        style={{
          width: '100%',
          padding: '14px',
          background: '#8b0000',
          color: '#e5e2e1',
          fontWeight: 700,
          fontSize: 13,
          letterSpacing: '1.5px',
          cursor: 'pointer',
          transition: 'background 0.15s',
          fontFamily: "'Space Grotesk', Helvetica, sans-serif",
        }}
        onMouseEnter={e => (e.currentTarget.style.background = '#a50000')}
        onMouseLeave={e => (e.currentTarget.style.background = '#8b0000')}
      >
        SUBMIT ANSWER
      </button>

      {result === 'incorrect' && (
        <div style={{ padding: '12px 16px', background: '#1c0000', borderLeft: '3px solid #8b0000' }}>
          <p style={{ fontSize: 12, color: '#ffdad6', letterSpacing: '1px' }}>INCORRECT - TRY AGAIN</p>
        </div>
      )}
    </div>
  );
};

export default FinalRiddleInput;
