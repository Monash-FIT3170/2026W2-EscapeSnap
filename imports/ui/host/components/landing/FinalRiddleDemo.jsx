import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useT } from '../../../../languages/LanguageProvider';
import { sound } from './landingSound';
import { flash, shake } from './motion';
import { formatDuration, isDemoAnswer } from './landingLogic';

const RIDDLE = [
  "I have a handle, but I'm not a cup.",
  "I have a frame, but I'm not a painting.",
  'I have a lock, but I keep no secrets.',
  "Open me and you're free.",
  'What am I?',
];

export default function FinalRiddleDemo() {
  const t = useT();
  const [answer, setAnswer] = useState('');
  const [solved, setSolved] = useState(false);
  const [misses, setMisses] = useState(0);
  const [hintOpen, setHintOpen] = useState(false);
  const [msg, setMsg] = useState(null); // { key, vars }
  const startedAt = useRef(0);
  const inputRef = useRef(null);
  const wrong = Boolean(msg?.key.startsWith('landing.final.wrong'));

  function handleSubmit(e) {
    e.preventDefault();
    if (solved) return;
    const raw = answer.trim();
    if (!raw) {
      setMsg({ key: 'landing.final.empty' });
      inputRef.current.focus();
      return;
    }
    if (isDemoAnswer(raw)) {
      const took = performance.now() - (startedAt.current || performance.now());
      inputRef.current.focus();
      setSolved(true);
      setMsg({
        key: 'landing.final.correct',
        vars: { time: formatDuration(took) },
      });
      sound.unlock();
      flash();
      return;
    }
    const n = misses + 1;
    const shout = raw.toUpperCase();
    setMisses(n);
    if (n >= 2 && !hintOpen) {
      setHintOpen(true);
      setMsg({ key: 'landing.final.wrongHint', vars: { answer: shout } });
    } else {
      setMsg({ key: 'landing.final.wrong', vars: { answer: shout } });
    }
    shake(inputRef.current);
    sound.error();
    inputRef.current.select();
  }

  function tryAgain() {
    setSolved(false);
    setMisses(0);
    setAnswer('');
    setMsg(null);
    startedAt.current = 0;
    inputRef.current.focus();
  }

  return (
    <section
      className={`lp-lock-sec${solved ? ' is-solved' : ''}`}
      id="final"
      aria-labelledby="lp-final-title"
    >
      <div className="lp-wrap lp-lock-grid">
        <header className="lp-sec-head">
          <h2 id="lp-final-title" data-reveal="ignite">
            {t('landing.final.title')}
          </h2>
          <p data-reveal="fade">{t('landing.final.intro1')}</p>
          <p data-reveal="fade">{t('landing.final.intro2')}</p>
        </header>

        <article
          className="lp-casefile"
          aria-labelledby="lp-riddle-lbl"
          data-reveal="paper"
        >
          <span className="lp-clip" aria-hidden="true" />
          <span className="lp-stamp" id="lp-riddle-lbl">
            {t('landing.nav.final')}
          </span>
          <p className="lp-riddle" lang="en">
            {RIDDLE.map((line, i) => (
              <React.Fragment key={i}>
                {i > 0 && <br />}
                {line}
              </React.Fragment>
            ))}
          </p>
          <div className="lp-found">
            <span>{t('landing.final.lettersRecovered')}</span>
            <span className="lp-tiles">
              <span className="lp-tile">O</span>
              <span className="lp-tile">R</span>
              <span className="lp-tile">D</span>
              <span className="lp-tile lp-missing">{solved ? 'O' : '?'}</span>
            </span>
          </div>
          <button
            className="lp-hint-btn"
            type="button"
            aria-expanded={hintOpen}
            aria-controls="lp-hint"
            onClick={() => setHintOpen((open) => !open)}
          >
            {t(hintOpen ? 'landing.final.hideHint' : 'landing.final.showHint')}
          </button>
          <p className="lp-hint" id="lp-hint" hidden={!hintOpen}>
            {t('landing.final.hint')}
          </p>

          <form
            className={`lp-answer${wrong ? ' is-wrong' : ''}`}
            onSubmit={handleSubmit}
            noValidate
          >
            <label htmlFor="lp-answer">{t('landing.final.answerLabel')}</label>
            <div className="lp-answer-row">
              <input
                ref={inputRef}
                id="lp-answer"
                name="answer"
                type="text"
                value={answer}
                readOnly={solved}
                onFocus={() => {
                  if (!startedAt.current) startedAt.current = performance.now();
                }}
                onChange={(e) => {
                  setAnswer(e.target.value);
                  if (!solved) setMsg(null);
                  sound.key();
                }}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="characters"
                spellCheck={false}
                maxLength={20}
                placeholder={t('landing.final.placeholder')}
                aria-describedby="lp-answer-msg"
              />
              <button
                className="lp-btn lp-btn-primary"
                type="submit"
                hidden={solved}
              >
                {t('landing.final.check')}
              </button>
            </div>
            <p
              className={`lp-answer-msg${solved ? ' is-ok' : ''}`}
              id="lp-answer-msg"
              role="status"
            >
              {msg && t(msg.key, msg.vars)}
            </p>
            <div className="lp-solved-actions" hidden={!solved}>
              <Link className="lp-btn lp-btn-primary" to="/host">
                {t('landing.host')}
              </Link>
              <button className="lp-again" type="button" onClick={tryAgain}>
                {t('landing.final.again')}
              </button>
            </div>
          </form>
          <span className="lp-escaped" aria-hidden="true">
            {t('landing.final.escaped')}
          </span>
        </article>
      </div>
    </section>
  );
}
