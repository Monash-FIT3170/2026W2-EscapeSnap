import React, { useRef, useState } from 'react';
import { useT } from '../../../../languages/LanguageProvider';
import { errorKey } from '../../../../languages/errors';
import { sound } from './landingSound';
import { flash, reducedMotion, shake, useLater } from './motion';
import {
  NAME_MAX_LENGTH,
  ROOM_CODE_LENGTH,
  cleanRoomCode,
  joinProblem,
} from './landingLogic';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clr', '0', 'del'];

export function goToKeypad(e) {
  const form = document.getElementById('lp-join');
  if (!form) return;
  e?.preventDefault();
  form.scrollIntoView({
    behavior: reducedMotion() ? 'auto' : 'smooth',
    block: 'center',
  });
  const name = document.getElementById('lp-name');
  const target = name.value.trim() ? document.getElementById('lp-code') : name;
  target.focus({ preventScroll: true });
}

export default function JoinKeypad({ join, onJoined }) {
  const t = useT();
  const later = useLater();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [codeFocused, setCodeFocused] = useState(false);
  const [status, setStatus] = useState({ kind: 'idle' });
  const nameRef = useRef(null);
  const nameBoxRef = useRef(null);
  const codeRef = useRef(null);
  const displayRef = useRef(null);
  const keysRef = useRef(null);
  const locked = status.kind === 'busy' || status.kind === 'ok';

  function editCode(next) {
    if (locked) return;
    setCode(next);
    setStatus({ kind: 'idle' });
    sound.key();
  }

  function lightKey(k) {
    const key = keysRef.current?.querySelector(`[data-k="${k}"]`);
    if (!key) return;
    key.classList.add('is-lit');
    later(() => key.classList.remove('is-lit'), 130);
  }

  function press(k) {
    if (k === 'clr') editCode('');
    else if (k === 'del') editCode(code.slice(0, -1));
    else if (code.length < ROOM_CODE_LENGTH) editCode(code + k);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (locked) return;
    const problem = joinProblem(name, code);
    if (problem) {
      setStatus(
        problem === 'name'
          ? { kind: 'err', key: 'mobile.home.errNameRequired' }
          : {
              kind: 'err',
              key: 'landing.keypad.codeShort',
              vars: { n: ROOM_CODE_LENGTH - code.length },
            }
      );
      shake(problem === 'name' ? nameBoxRef.current : displayRef.current);
      sound.error();
      (problem === 'name' ? nameRef : codeRef).current.focus({
        preventScroll: true,
      });
      return;
    }

    const playerName = name.trim();
    setStatus({ kind: 'busy' });
    try {
      const session = await join(playerName, code);
      setStatus({ kind: 'ok' });
      sound.ok();
      sound.shutter();
      flash();
      later(
        () => onJoined({ ...session, playerName, gameCode: code }),
        reducedMotion() ? 0 : 900
      );
    } catch (err) {
      setStatus({
        kind: 'err',
        key: errorKey(err, { 'not-found': 'errors.gameNotFoundOrStarted' }),
      });
      shake(displayRef.current);
      sound.error();
    }
  }

  const ready = code.length === ROOM_CODE_LENGTH && Boolean(name.trim());
  let statusText;
  if (status.kind === 'busy')
    statusText = t('landing.keypad.checking', { code });
  else if (status.kind === 'ok')
    statusText = t('landing.keypad.found', { code });
  else if (status.kind === 'err') statusText = t(status.key, status.vars);
  else if (ready) statusText = t('landing.keypad.ready');
  else if (code.length === ROOM_CODE_LENGTH)
    statusText = t('landing.keypad.needName');
  else statusText = t('landing.keypad.idle');

  let led = '';
  if (status.kind === 'busy') led = 'busy';
  else if (status.kind === 'ok') led = 'ok';
  else if (status.kind === 'idle' && ready) led = 'ready';

  return (
    <form
      className={`lp-keypad${status.kind === 'err' ? ' is-err' : ''}`}
      id="lp-join"
      onSubmit={handleSubmit}
      aria-labelledby="lp-kp-title"
      noValidate
    >
      <span className="lp-screw lp-s1" aria-hidden="true" />
      <span className="lp-screw lp-s2" aria-hidden="true" />
      <span className="lp-screw lp-s3" aria-hidden="true" />
      <span className="lp-screw lp-s4" aria-hidden="true" />
      <div className="lp-kp-head">
        <h2 id="lp-kp-title">{t('landing.join')}</h2>
        <span className="lp-led" data-state={led} aria-hidden="true" />
      </div>

      <div className="lp-kp-name" ref={nameBoxRef}>
        <label htmlFor="lp-name">{t('mobile.home.playerName')}</label>
        <input
          ref={nameRef}
          id="lp-name"
          name="name"
          type="text"
          value={name}
          onChange={(e) => {
            if (locked) return;
            setName(e.target.value);
            setStatus({ kind: 'idle' });
            sound.key();
          }}
          maxLength={NAME_MAX_LENGTH}
          autoComplete="nickname"
          autoCapitalize="words"
          spellCheck={false}
          placeholder={t('mobile.home.playerNamePlaceholder')}
          aria-describedby="lp-kp-status"
        />
      </div>

      <div className="lp-kp-display" ref={displayRef}>
        <label htmlFor="lp-code" className="lp-sr">
          {t('landing.keypad.code')}
        </label>
        <input
          ref={codeRef}
          id="lp-code"
          name="code"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={ROOM_CODE_LENGTH}
          autoComplete="off"
          value={code}
          onChange={(e) => editCode(cleanRoomCode(e.target.value))}
          onKeyDown={(e) => {
            if (/^\d$/.test(e.key)) lightKey(e.key);
            if (e.key === 'Backspace') lightKey('del');
          }}
          onFocus={() => setCodeFocused(true)}
          onBlur={() => setCodeFocused(false)}
          aria-describedby="lp-kp-status"
        />
        <span className="lp-slots" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={`lp-slot${codeFocused && i === code.length ? ' is-cursor' : ''}`}
            >
              {code[i] ?? ''}
            </span>
          ))}
        </span>
        <span className="lp-kp-status" id="lp-kp-status" role="status">
          {statusText}
        </span>
      </div>

      <div
        className="lp-keys"
        role="group"
        aria-label={t('landing.keypad.keys')}
        ref={keysRef}
      >
        {KEYS.map((k) => (
          <button
            key={k}
            type="button"
            className={`lp-key${k.length > 1 ? ' lp-fn' : ''}`}
            data-k={k}
            aria-label={
              k === 'clr'
                ? t('landing.keypad.clear')
                : k === 'del'
                  ? t('landing.keypad.del')
                  : undefined
            }
            onClick={() => press(k)}
          >
            {k.length > 1 ? k.toUpperCase() : k}
          </button>
        ))}
      </div>
      <button type="submit" className="lp-btn lp-btn-primary">
        {t('landing.keypad.enter')}
      </button>
    </form>
  );
}
