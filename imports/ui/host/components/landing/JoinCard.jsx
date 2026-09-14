import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useT } from '../../../../languages/LanguageProvider';
import { ALERT, BG, CARD, INK, LABEL, LINE, RED, RED_HOVER } from './theme';

// The player path leads: most people arriving at the landing page were handed a
// code by whoever is hosting.
export default function JoinCard() {
  const t = useT();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  function handleJoin(e) {
    e.preventDefault();
    if (!/^\d{4}$/.test(code)) {
      setError(
        t(code ? 'mobile.home.errCodeInvalid' : 'mobile.home.errCodeRequired')
      );
      return;
    }
    setError('');
    // /join/:joinCode hands the code straight to PlayerHome, so the player only
    // has to add a name.
    navigate(`/join/${code}`);
  }

  return (
    <form onSubmit={handleJoin} className="p-6 flex flex-col" style={CARD}>
      <label
        htmlFor="join-code"
        className="font-mono text-xs uppercase block"
        style={LABEL}
      >
        {t('mobile.home.gameCode')}
      </label>

      <input
        id="join-code"
        value={code}
        // Non-digits are stripped as they are typed, so the error below is close
        // to unreachable and mostly guards an empty or short submit.
        onChange={(e) => {
          setCode(e.target.value.replace(/\D/g, '').slice(0, 4));
          setError('');
        }}
        inputMode="numeric"
        autoComplete="off"
        maxLength={4}
        placeholder="0000"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? 'join-code-error' : undefined}
        className="w-full font-mono px-5 py-4 mt-4 text-2xl text-center placeholder:text-[#8a8886] focus:outline-none transition-colors"
        style={{
          background: BG,
          border: `1px solid ${error ? ALERT : LINE}`,
          color: INK,
          letterSpacing: '10px',
          // Offsets the trailing letter-space so the digits sit optically centred.
          textIndent: '10px',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = RED_HOVER;
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error ? ALERT : LINE;
        }}
      />

      {error && (
        <p
          id="join-code-error"
          role="alert"
          className="font-mono text-xs mt-3"
          style={{ letterSpacing: '1px', color: ALERT }}
        >
          !! {error}
        </p>
      )}

      {/* mt-auto keeps this level with the host card's button. */}
      <button
        type="submit"
        className="w-full font-mono text-sm uppercase px-6 py-4 mt-auto transition-colors"
        style={{ background: RED, color: INK, letterSpacing: '2px' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = RED_HOVER;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = RED;
        }}
      >
        {t('mobile.home.enterGame')}
      </button>
    </form>
  );
}
