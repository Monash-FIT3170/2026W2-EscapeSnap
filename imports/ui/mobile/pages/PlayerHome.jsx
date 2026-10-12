// Meteor's JSX transform still requires React in module scope.
import React, { useState } from 'react';
import { useT } from '../../../languages/LanguageProvider';
import { LanguagePicker } from '../../../languages/LanguagePicker';

const FIELD_CLASS =
  'w-full border border-[#353534] bg-[#0e0e0e] px-4 py-3.5 font-mono text-base text-[#e5e2e1] placeholder:text-[#555] focus:border-[#8b0000] focus:outline-none transition-colors';

// The game this phone was last playing, still running — one tap to go back to
// it, or leave it for good before joining something else.
function RejoinCard({ rejoin }) {
  const t = useT();
  return (
    <div className="mt-8 border-l-4 border-[#8b0000] bg-[#1c1b1b] px-5 py-5">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#aa8984]">
        {rejoin.status === 'in_progress'
          ? t('mobile.home.rejoinInProgress')
          : t('mobile.home.rejoinInLobby')}
      </p>
      <p className="mt-2 font-display text-lg font-bold tracking-[0.1em] text-[#e5e2e1]">
        {rejoin.groupName}
      </p>
      <p className="mt-1 font-mono text-xs text-[#aa8984]">
        {t('mobile.home.rejoinAs', { name: rejoin.playerName })}
      </p>
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={rejoin.onRejoin}
          className="min-h-[48px] flex-1 border border-[#8b0000] bg-[#8b0000] px-4 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[#e5e2e1] transition active:bg-[#a50000]"
        >
          {t('mobile.home.rejoin')}
        </button>
        <button
          type="button"
          onClick={rejoin.onLeave}
          className="min-h-[48px] border border-[#353534] px-4 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[#aa8984] transition active:border-[#aa8984]"
        >
          {t('mobile.home.leaveGame')}
        </button>
      </div>
    </div>
  );
}

export function PlayerHome({
  onStart,
  rejoin = null,
  loading = false,
  serverError = '',
  initialCode = '',
}) {
  const [name, setName] = useState('');
  const [code, setCode] = useState(initialCode);
  const [error, setError] = useState('');
  const t = useT();
  const scannedViaQr = Boolean(initialCode);

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) { setError(t('mobile.home.errNameRequired')); return; }
    if (!code.trim()) { setError(t('mobile.home.errCodeRequired')); return; }
    if (!/^\d{4}$/.test(code)) {
      setError(t('mobile.home.errCodeInvalid'));
      return;
    }
    setError('');
    onStart(name.trim(), code);
  }

  return (
    // Scrolls rather than clipping: on a short phone the on-screen keyboard
    // covers most of the viewport, and a fixed-height screen would bury the
    // submit button under it.
    <div className="min-h-[100dvh] bg-[#0e0e0e] text-[#e5e2e1] flex items-center justify-center px-5 py-8">
      <div className="relative w-full max-w-sm">

        <div className="mb-8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#8b0000] animate-pulse" />
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#aa8984]">
              {t('mobile.home.systemOnline')}
            </span>
          </div>
          <LanguagePicker compact />
        </div>

        <h1 className="text-center font-display text-5xl font-black leading-tight tracking-wide text-[#8b0000]">
          ESCAPE<br />SNAP
        </h1>

        <div className="mt-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-[#353534]" />
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#aa8984]">
            {t('mobile.home.playerTerminal')}
          </span>
          <span className="h-px flex-1 bg-[#353534]" />
        </div>

        {rejoin && <RejoinCard rejoin={rejoin} />}

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">

          <div className="flex flex-col gap-2">
            <label htmlFor="player-name" className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#aa8984]">
              {t('mobile.home.playerName')}
            </label>
            <input
              id="player-name"
              type="text"
              placeholder={t('mobile.home.playerNamePlaceholder')}
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={24}
              autoComplete="off"
              className={FIELD_CLASS}
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="game-code" className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#aa8984]">
                {t('mobile.home.gameCode')}
              </label>
              {scannedViaQr && (
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#4ade80]">
                  {t('mobile.home.scannedViaQr')}
                </span>
              )}
            </div>
            <input
              id="game-code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{4}"
              placeholder={t('mobile.home.gameCodePlaceholder')}
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
              maxLength={4}
              autoComplete="one-time-code"
              className={`${FIELD_CLASS} tracking-[0.4em]`}
            />
          </div>

          {(error || serverError) && (
            <p role="alert" className="font-mono text-xs leading-5 text-[#ef4444]">
              ⚠ {error || serverError}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 w-full border border-[#8b0000] bg-[#8b0000] px-5 py-4 font-mono text-sm font-semibold uppercase tracking-[0.2em] text-[#e5e2e1] transition active:bg-[#a50000] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t('mobile.home.joining') : t('mobile.home.enterGame')}
          </button>

        </form>
      </div>
    </div>
  );
}
