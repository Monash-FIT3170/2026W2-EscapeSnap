// Meteor's JSX transform still requires React in module scope.
import React, { useState } from 'react';
import { useT } from '../../../languages/LanguageProvider';
import { LanguagePicker } from '../../../languages/LanguagePicker';
import { ThemePicker } from '../../shared/components/theme/ThemePicker';
import { Brand } from '../../shared/components/room/Brand';

// The game this phone was last playing, still running — one tap to go back to
// it, or leave it for good before joining something else.
function RejoinCard({ rejoin }) {
  const t = useT();
  return (
    <div className="es-well mb-5 px-4 py-4">
      <p className="es-label flex items-center gap-2">
        <span className="es-led" data-state="ready" aria-hidden="true" />
        {rejoin.status === 'in_progress'
          ? t('mobile.home.rejoinInProgress')
          : t('mobile.home.rejoinInLobby')}
      </p>
      <p className="es-title mt-3 text-2xl text-ink">{rejoin.groupName}</p>
      <p className="mt-1 text-sm text-muted">
        {t('mobile.home.rejoinAs', { name: rejoin.playerName })}
      </p>
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={rejoin.onRejoin}
          className="es-btn es-btn-primary es-btn-sm flex-1"
        >
          {t('mobile.home.rejoin')}
        </button>
        <button
          type="button"
          onClick={rejoin.onLeave}
          className="es-btn es-btn-ghost es-btn-sm"
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
    <div className="es-room flex flex-col px-4 pb-8 pt-[max(12px,env(safe-area-inset-top))]">
      <header className="mx-auto flex w-full max-w-sm items-center justify-between gap-3">
        <Brand className="text-[1.35rem]" />
        <div className="flex items-center gap-2">
          <ThemePicker compact />
          <LanguagePicker compact />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-8">
        <h1 className="es-title text-[3.4rem] text-ink">
          {t('mobile.home.playerTerminal')}
        </h1>
        <p className="mb-7 mt-3 flex items-center gap-2 text-sm text-muted">
          <span className="es-led" data-state="ready" aria-hidden="true" />
          {t('mobile.home.systemOnline')}
        </p>

        {rejoin && <RejoinCard rejoin={rejoin} />}

        <form onSubmit={handleSubmit} className="es-plate flex flex-col gap-5 px-5 pb-5 pt-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="player-name" className="es-label">
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
              className="es-field"
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="game-code" className="es-label">
                {t('mobile.home.gameCode')}
              </label>
              {scannedViaQr && (
                <span className="text-sm text-correct">
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
              className="es-field !text-[2rem] tracking-[0.4em]"
            />
          </div>

          {(error || serverError) && (
            <p role="alert" className="text-sm leading-5 text-incorrect">
              ⚠ {error || serverError}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="es-btn es-btn-primary w-full"
          >
            {loading ? t('mobile.home.joining') : t('mobile.home.enterGame')}
          </button>
        </form>
      </main>
    </div>
  );
}
