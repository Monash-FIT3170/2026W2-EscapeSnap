import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { useT } from '../../../../languages/LanguageProvider';

const FinalRiddleInput = ({ gameId, onCorrect = () => {}, onFailed = () => {} }) => {
  const t = useT();
  const [guess, setGuess] = useState('');
  const [result, setResult] = useState(null);
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const [networkError, setNetworkError] = useState(false);

  useEffect(() => {
    if (!result || result === 'correct') return;
    const timer = setTimeout(() => setResult(null), 3000);
    return () => clearTimeout(timer);
  }, [result]);

  const exhausted = attemptsLeft === 0;

  function handleSubmit() {
    if (!guess.trim() || exhausted) return;
    setNetworkError(false);
    Meteor.call('games.submitFinalAnswer', gameId, guess, (error, response) => {
      if (error) {
        console.error('[games.submitFinalAnswer] failed:', error.error || error.reason || error.message);
        setNetworkError(true);
        return;
      }

      // Handle both old (boolean) and new ({ isCorrect, attemptsLeft }) response formats
      const isCorrect = typeof response === 'boolean' ? response : response?.isCorrect;
      const remaining = typeof response === 'boolean'
        ? (response ? 0 : attemptsLeft - 1)
        : (response?.attemptsLeft ?? attemptsLeft - 1);

      setAttemptsLeft(remaining);
      setResult(isCorrect ? 'correct' : 'incorrect');
      setGuess('');

      if (isCorrect) {
        onCorrect();
      } else if (remaining === 0) {
        onFailed();
      }
    });
  }

  return (
    <div>
      <input
        type="text"
        placeholder={t('host.finalRiddle.enterOverridePlaceholder')}
        className="w-full bg-transparent border border-gray-700 text-white placeholder-gray-600 text-sm font-mono tracking-widest px-4 py-4 mb-3 focus:outline-none focus:border-red-600"
        onChange={e => setGuess(e.target.value)}
        value={guess}
        disabled={exhausted}
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
          opacity: exhausted ? 0.5 : 1,
        }}
        onMouseEnter={e => { if (!exhausted) e.currentTarget.style.background = '#a50000'; }}
        onMouseLeave={e => { if (!exhausted) e.currentTarget.style.background = '#8b0000'; }}
      >
        {t('host.finalRiddle.submitAnswer')}
      </button>

      {networkError && (
        <div style={{ marginTop: 12, padding: '12px 16px', background: '#1c0000', borderLeft: '3px solid #8b0000' }}>
          <p style={{ fontSize: 12, color: '#ffdad6', letterSpacing: '1px' }}>{t('host.finalRiddle.connectionError')}</p>
        </div>
      )}

      {result === 'incorrect' && !exhausted && (
        <div style={{ marginTop: 12, padding: '12px 16px', background: '#1c0000', borderLeft: '3px solid #8b0000', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: 12, color: '#ffdad6', letterSpacing: '1px' }}>{t('host.finalRiddle.incorrectTryAgain')}</p>
          <p style={{ fontSize: 11, color: '#aa8984', letterSpacing: '1px' }}>
            {t('host.finalRiddle.attemptsLeftLabel', { n: attemptsLeft, unit: attemptsLeft === 1 ? t('host.finalRiddle.attempt') : t('host.finalRiddle.attempts') })}
          </p>
        </div>
      )}

      {exhausted && (
        <div style={{ marginTop: 12, padding: '12px 16px', background: '#1c0000', borderLeft: '3px solid #ff0000' }}>
          <p style={{ fontSize: 12, color: '#ffdad6', letterSpacing: '1px' }}>{t('host.finalRiddle.missionFailed')}</p>
        </div>
      )}
    </div>
  );
};

export default FinalRiddleInput;