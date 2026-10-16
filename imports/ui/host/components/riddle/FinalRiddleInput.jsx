import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { useT } from '../../../../languages/LanguageProvider';

const MAX_ATTEMPTS = 3;

// `attemptsUsed` is the server's count, so attempts made on another device
// (a teammate's phone in a versus match) still count down here.
const FinalRiddleInput = ({ gameId, attemptsUsed = 0, onCorrect = () => {}, onFailed = () => {} }) => {
  const t = useT();
  const [guess, setGuess] = useState('');
  const [result, setResult] = useState(null);
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_ATTEMPTS - attemptsUsed);

  useEffect(() => {
    setAttemptsLeft((local) => Math.min(local, MAX_ATTEMPTS - attemptsUsed));
  }, [attemptsUsed]);
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

      // In a match a correct answer can still lose, if a rival team escaped first.
      const outcome = response?.outcome ?? (isCorrect ? 'won' : remaining === 0 ? 'lost' : null);
      if (outcome === 'won') {
        onCorrect();
      } else if (outcome === 'lost') {
        onFailed();
      }
    });
  }

  // Messages inherit their colour, so they read on the host's dark plate and
  // on the phone's paper case file alike.
  const message = (text, aside = null) => (
    <p role="status" className="mt-3 flex items-center gap-2 font-display text-base tracking-[0.03em]">
      <span className="es-led" data-state="ready" aria-hidden="true" />
      <span className="flex-1">{text}</span>
      {aside && <span className="text-sm opacity-75">{aside}</span>}
    </p>
  );

  return (
    <div>
      <input
        type="text"
        placeholder={t('host.finalRiddle.enterOverridePlaceholder')}
        className="es-field mb-3 uppercase"
        onChange={e => setGuess(e.target.value)}
        value={guess}
        disabled={exhausted}
      />
      <button
        type="button"
        onClick={handleSubmit}
        disabled={exhausted}
        className="es-btn es-btn-primary w-full"
      >
        {t('host.finalRiddle.submitAnswer')}
      </button>

      {networkError && message(t('host.finalRiddle.connectionError'))}

      {result === 'incorrect' && !exhausted &&
        message(
          t('host.finalRiddle.incorrectTryAgain'),
          t('host.finalRiddle.attemptsLeftLabel', { n: attemptsLeft, unit: attemptsLeft === 1 ? t('host.finalRiddle.attempt') : t('host.finalRiddle.attempts') })
        )}

      {exhausted && message(t('host.finalRiddle.missionFailed'))}
    </div>
  );
};

export default FinalRiddleInput;