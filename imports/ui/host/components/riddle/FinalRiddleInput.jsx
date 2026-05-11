import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';

const FinalRiddleInput = ({ gameId, onCorrect = () => {} }) => {
  const [guess, setGuess] = useState('');
  const [result, setResult] = useState(null);
  const [attemptsLeft, setAttemptsLeft] = useState(3);

  useEffect(() => {
    if (!result || result === 'correct') return;
    const timer = setTimeout(() => setResult(null), 3000);
    return () => clearTimeout(timer);
  }, [result]);

  const exhausted = attemptsLeft === 0;

  function handleSubmit() {
    if (!guess.trim() || exhausted) return;
    Meteor.call('games.submitFinalAnswer', gameId, guess, (error, response) => {
      if (error) {
        console.error(error);
        return;
      }
      const { isCorrect, attemptsLeft: remaining } = response;
      setAttemptsLeft(remaining);
      setResult(isCorrect ? 'correct' : 'incorrect');
      if (isCorrect) onCorrect();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        type="text"
        placeholder={exhausted ? 'NO ATTEMPTS REMAINING' : 'TYPE YOUR ANSWER...'}
        value={guess}
        disabled={exhausted}
        onChange={e => setGuess(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        style={{
          width: '100%',
          background: exhausted ? '#0a0a0a' : '#131313',
          border: '1px solid #353534',
          padding: '14px 16px',
          color: exhausted ? '#555' : '#e5e2e1',
          fontSize: 14,
          letterSpacing: '1px',
          outline: 'none',
          fontFamily: "'Space Grotesk', Helvetica, sans-serif",
          cursor: exhausted ? 'not-allowed' : 'text',
        }}
      />
      <button
        onClick={handleSubmit}
        disabled={exhausted}
        style={{
          width: '100%',
          padding: '14px',
          background: exhausted ? '#3a0000' : '#8b0000',
          color: exhausted ? '#555' : '#e5e2e1',
          fontWeight: 700,
          fontSize: 13,
          letterSpacing: '1.5px',
          cursor: exhausted ? 'not-allowed' : 'pointer',
          transition: 'background 0.15s',
          fontFamily: "'Space Grotesk', Helvetica, sans-serif",
          opacity: exhausted ? 0.5 : 1,
        }}
        onMouseEnter={e => { if (!exhausted) e.currentTarget.style.background = '#a50000'; }}
        onMouseLeave={e => { if (!exhausted) e.currentTarget.style.background = '#8b0000'; }}
      >
        SUBMIT ANSWER
      </button>

      {result === 'incorrect' && !exhausted && (
        <div style={{ padding: '12px 16px', background: '#1c0000', borderLeft: '3px solid #8b0000', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: 12, color: '#ffdad6', letterSpacing: '1px' }}>INCORRECT - TRY AGAIN</p>
          <p style={{ fontSize: 11, color: '#aa8984', letterSpacing: '1px' }}>{attemptsLeft} {attemptsLeft === 1 ? 'ATTEMPT' : 'ATTEMPTS'} LEFT</p>
        </div>
      )}

      {exhausted && (
        <div style={{ padding: '12px 16px', background: '#1c0000', borderLeft: '3px solid #ff0000' }}>
          <p style={{ fontSize: 12, color: '#ffdad6', letterSpacing: '1px' }}>MISSION FAILED - NO ATTEMPTS REMAINING</p>
        </div>
      )}
    </div>
  );
};

export default FinalRiddleInput;
