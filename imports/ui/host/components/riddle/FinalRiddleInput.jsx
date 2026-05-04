import { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';

const FEEDBACK_TIMEOUT_MS = 3000;
const WIN_SCREEN_DELAY_MS = 1200;

const FEEDBACK = {
  checking: {
    className: 'alert alert-info',
    message: 'Checking answer...',
  },
  correct: {
    className: 'alert alert-success',
    message: 'Correct answer.',
  },
  incorrect: {
    className: 'alert alert-error',
    message: 'Incorrect guess. Try again.',
  },
  empty: {
    className: 'alert alert-warning',
    message: 'Enter a guess before submitting.',
  },
  error: {
    className: 'alert alert-error',
    message: 'Could not check the answer. Try again.',
  },
};

const FinalRiddleInput = ({ gameId, onCorrect = () => {} }) => {
  const [guess, setGuess] = useState('');
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!result || result === 'checking' || result === 'correct') return;
    const timer = setTimeout(() => setResult(null), FEEDBACK_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [result]);

  useEffect(() => {
    if (result !== 'correct') return;
    const timer = setTimeout(onCorrect, WIN_SCREEN_DELAY_MS);
    return () => clearTimeout(timer);
  }, [onCorrect, result]);

  function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;

    const submittedGuess = guess.trim();
    if (!submittedGuess) {
      setResult('empty');
      return;
    }

    setSubmitting(true);
    setResult('checking');

    Meteor.call(
      'games.submitFinalAnswer',
      gameId,
      submittedGuess,
      (error, isCorrect) => {
        setSubmitting(false);

        if (error) {
          console.error(error);
          setResult('error');
          return;
        }

        setResult(isCorrect ? 'correct' : 'incorrect');
      }
    );
  }

  const feedback = result ? FEEDBACK[result] : null;

  return (
    <form className="min-w-screen px-12" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Input riddle guess..."
        className="w-full bg-gray-900 border-gray-200 min-h-15 input input-lg text-gray-500 text-2xl font-extraitalic"
        value={guess}
        disabled={submitting}
        onChange={(e) => setGuess(e.target.value)}
      />
      <button
        type="submit"
        className="w-full min-h-15 btn bg-red-600 mt-1 font-italic text-2xl"
        disabled={submitting}
      >
        {submitting ? 'Checking...' : 'Make Guess'}
      </button>

      {feedback && (
        <div className="toast toast-center toast-middle" aria-live="polite">
          <div className={feedback.className}>
            <span>{feedback.message}</span>
          </div>
        </div>
      )}
    </form>
  );
};

export default FinalRiddleInput;
