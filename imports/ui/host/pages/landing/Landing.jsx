import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useT } from '../../../../languages/LanguageProvider';
import { LanguagePicker } from '../../../../languages/LanguagePicker';

const BG = '#0e0e0e';
const PANEL = '#141313';
const LINE = '#353534';
const INK = '#e5e2e1';
const MUTED = '#aa8984';
const DIM = '#8a8886';
const RED = '#8b0000';
const RED_HOVER = '#a50000';
const BRAND = '#c81e1e'; // 3.67:1, so display-size wordmark and the status dot only
const ALERT = '#ef4444'; // the project's "incorrect" red, 4.9:1 on the panel, safe for small text

// The five briefing steps are already written and translated for the mobile
// tutorial, so the landing page reads from the same keys.
const STEPS = [1, 2, 3, 4, 5];

const DIFFICULTIES = [
  { key: 'easy', bars: 1 },
  { key: 'medium', bars: 2 },
  { key: 'hard', bars: 3 },
];

// Pooled letters for the sample: one round came back wrong, so it shows a '?'
// exactly as a real game would.
const SAMPLE_LETTERS = ['M', 'A', '?', 'P'];

const CARD = { background: PANEL, border: `1px solid ${LINE}` };
const LABEL = { letterSpacing: '2px', color: MUTED };

function SectionHeader({ children }) {
  return (
    <div className="flex items-center gap-3 mb-8">
      <div style={{ width: 4, height: 16, background: RED }} />
      <h2
        className="font-mono text-xs uppercase"
        style={{ fontWeight: 700, letterSpacing: '1.4px', color: INK }}
      >
        {children}
      </h2>
    </div>
  );
}

function Landing() {
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

  const specs = [
    t('landing.specPlayers'),
    t('landing.specDuration'),
    t('landing.specInstall'),
    t('landing.specDevices'),
  ];

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: BG, color: INK }}
    >
      <header
        className="px-6 md:px-12 py-4 flex items-center justify-between gap-4"
        style={{ borderBottom: `1px solid ${LINE}` }}
      >
        <div className="flex items-center gap-4">
          <span
            className="font-display text-lg font-bold tracking-widest"
            style={{ color: INK }}
          >
            ESCAPESNAP
          </span>
          <span className="hidden sm:flex items-center gap-2">
            <span
              className="h-1.5 w-1.5 rounded-full animate-pulse"
              style={{ background: BRAND }}
            />
            <span className="font-mono text-xs uppercase" style={LABEL}>
              {t('mobile.home.systemOnline')}
            </span>
          </span>
        </div>
        <LanguagePicker />
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-6 md:px-12">
        <section className="pt-12 md:pt-20 pb-16">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-display text-5xl md:text-7xl font-black tracking-wider leading-none">
              <span style={{ color: INK }}>ESCAPE</span>
              <span style={{ color: BRAND }}>SNAP</span>
            </h1>

            <p
              className="text-sm mt-8 leading-relaxed"
              style={{ color: MUTED }}
            >
              {t('landing.tagline')}
            </p>
            <p className="text-sm mt-4 leading-relaxed" style={{ color: DIM }}>
              {t('landing.welcome')}
            </p>

            <ul className="flex flex-wrap justify-center gap-x-6 gap-y-3 mt-8">
              {specs.map((spec) => (
                <li
                  key={spec}
                  className="font-mono text-xs uppercase pl-3"
                  style={{
                    color: DIM,
                    letterSpacing: '1.5px',
                    borderLeft: `1px solid ${LINE}`,
                  }}
                >
                  {spec}
                </li>
              ))}
            </ul>
          </div>

          {/* Three equal cards in one row. Equal columns is what actually keeps the
              final-code panel level with the other two: the earlier 7/5 split left
              the short column with ~130px of dead space under it. Each card is a
              flex column so the buttons line up along the bottom edge. */}
          <div className="grid md:grid-cols-3 gap-6 mt-14">
            {/* The player path leads: most people arriving here were handed a code. */}
            <form
              onSubmit={handleJoin}
              className="p-6 flex flex-col"
              style={CARD}
            >
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

            <div className="p-6 flex flex-col" style={CARD}>
              <p className="font-mono text-xs uppercase" style={LABEL}>
                {t('landing.noCodeYet')}
              </p>
              <p
                className="text-sm mt-4 leading-relaxed"
                style={{ color: DIM }}
              >
                {t('landing.hostBlurb')}
              </p>
              <Link
                to="/host"
                className="w-full text-center font-mono text-sm uppercase px-6 py-4 mt-auto transition-colors"
                style={{
                  border: `1px solid ${RED}`,
                  color: INK,
                  letterSpacing: '2px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = RED;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                {t('landing.hostAGame')}
              </Link>
            </div>

            {/* What the whole game builds toward. */}
            <div className="p-6 flex flex-col" style={CARD}>
              <p className="font-mono text-xs uppercase" style={LABEL}>
                {t('landing.finalCode')}
              </p>

              <div className="flex gap-2 mt-4">
                {SAMPLE_LETTERS.map((letter, i) => (
                  <span
                    key={i}
                    className="font-display flex-1 h-11 flex items-center justify-center text-base font-bold"
                    style={
                      letter === '?'
                        ? { border: `1px dashed ${LINE}`, color: DIM }
                        : {
                            border: `1px solid ${RED}`,
                            background: '#1c0000',
                            color: INK,
                          }
                    }
                  >
                    {letter}
                  </span>
                ))}
              </div>

              <p
                className="text-sm mt-5 leading-relaxed"
                style={{
                  color: INK,
                  borderLeft: `2px solid ${LINE}`,
                  paddingLeft: 14,
                }}
              >
                {t('landing.sampleFinalRiddle')}
              </p>

              <p
                className="text-xs mt-auto pt-5 leading-relaxed"
                style={{ color: DIM }}
              >
                {t('landing.finalNote')}
              </p>
            </div>
          </div>
        </section>

        {/* Label above the content, not beside it: a left-hand rail left a third of
            the row empty and squeezed the five steps into an orphaned 2x3 grid. */}
        <section className="py-16" style={{ borderTop: `1px solid ${LINE}` }}>
          <SectionHeader>{t('landing.howItWorks')}</SectionHeader>

          <ol className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {STEPS.map((n) => (
              <li
                key={n}
                className="pt-4"
                style={{ borderTop: `2px solid ${LINE}` }}
              >
                <span
                  className="font-mono text-xs"
                  style={{ letterSpacing: '1.5px', color: BRAND }}
                >
                  {String(n).padStart(2, '0')}
                </span>
                <h3
                  className="font-mono text-sm uppercase mt-3"
                  style={{
                    fontWeight: 700,
                    letterSpacing: '1.5px',
                    color: INK,
                  }}
                >
                  {t(`mobile.tutorial.step${n}Title`)}
                </h3>
                <p
                  className="text-xs mt-2 leading-relaxed"
                  style={{ color: DIM }}
                >
                  {t(`mobile.tutorial.step${n}Description`)}
                </p>
              </li>
            ))}
          </ol>
        </section>

        {/* Difficulty: reuses the labels the host sees on the create screen. */}
        <section className="py-16" style={{ borderTop: `1px solid ${LINE}` }}>
          <SectionHeader>{t('landing.choosePressure')}</SectionHeader>

          <div className="grid sm:grid-cols-3 gap-6">
            {DIFFICULTIES.map(({ key, bars }) => (
              <div key={key} className="p-6" style={CARD}>
                <div className="flex gap-1.5" aria-hidden>
                  {[1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className="flex-1"
                      style={{ height: 6, background: i <= bars ? RED : LINE }}
                    />
                  ))}
                </div>
                <h3
                  className="font-mono text-sm uppercase mt-5"
                  style={{
                    fontWeight: 700,
                    letterSpacing: '1.5px',
                    color: INK,
                  }}
                >
                  {t(`difficulty.${key}`)}
                </h3>
                <p className="font-mono text-xs uppercase mt-2" style={LABEL}>
                  {t(`difficulty.${key}Sub`)}
                </p>
              </div>
            ))}
          </div>

          <p className="text-xs mt-6 leading-relaxed" style={{ color: DIM }}>
            {t('landing.pressureNote')}
          </p>
        </section>
      </main>

      <footer
        className="px-6 md:px-12 py-4 flex flex-wrap items-center justify-between gap-4"
        style={{ borderTop: `1px solid ${LINE}` }}
      >
        <p
          className="font-mono text-xs uppercase"
          style={{ letterSpacing: '2px', color: DIM }}
        >
          ESCAPESNAP · {t('landing.footerTag')}
        </p>
        <Link
          to="/leaderboard"
          className="font-mono text-xs uppercase px-3 py-3 transition-colors"
          style={{ color: MUTED, letterSpacing: '2px' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = INK;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = MUTED;
          }}
        >
          {t('landing.leaderboard')}
        </Link>
      </footer>
    </div>
  );
}

export default Landing;
