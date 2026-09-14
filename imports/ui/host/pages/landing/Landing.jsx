import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useT } from '../../../../languages/LanguageProvider';
import { LanguagePicker } from '../../../../languages/LanguagePicker';

// #8b0000 is a fill and a border here, never a text colour, because it reads
// 1.9:1 on the near-black background. Accent labels carry the 4px red bar
// instead, which only has to clear the 3:1 non-text threshold. BRAND is the one
// red used as text, and only at display size where 3:1 applies. DIM replaces the
// #555/#444 used elsewhere in the host pages, which fail AA on #0e0e0e.
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

function SectionLabel({ children }) {
  return (
    <div className="flex items-center gap-3">
      <div style={{ width: 4, height: 16, background: RED }} />
      <span
        className="font-mono text-xs uppercase"
        style={{ fontWeight: 700, letterSpacing: '1.4px', color: INK }}
      >
        {children}
      </span>
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
            <span
              className="font-mono text-xs uppercase"
              style={{ letterSpacing: '2px', color: MUTED }}
            >
              {t('mobile.home.systemOnline')}
            </span>
          </span>
        </div>
        <LanguagePicker />
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-6 md:px-12">
        {/* Hero: 7/5 split, so the copy column and the goal panel sit off-centre. */}
        <section className="grid md:grid-cols-12 gap-10 md:gap-14 pt-12 md:pt-20 pb-16 items-start">
          <div className="md:col-span-7">
            <h1 className="font-display text-5xl md:text-7xl font-black tracking-wider leading-none">
              <span style={{ color: INK }}>ESCAPE</span>
              <span style={{ color: BRAND }}>SNAP</span>
            </h1>

            <p
              className="text-sm mt-8 max-w-xl leading-relaxed"
              style={{ color: MUTED }}
            >
              {t('landing.tagline')}
            </p>
            <p
              className="text-sm mt-4 max-w-xl leading-relaxed"
              style={{ color: DIM }}
            >
              {t('landing.welcome')}
            </p>

            {/* The player path leads: most people arriving here were handed a code. */}
            <form
              onSubmit={handleJoin}
              className="mt-10 p-6"
              style={{ background: PANEL, border: `1px solid ${LINE}` }}
            >
              <label
                htmlFor="join-code"
                className="font-mono text-xs uppercase block"
                style={{ letterSpacing: '2px', color: MUTED }}
              >
                {t('mobile.home.gameCode')}
              </label>

              <div className="flex flex-col sm:flex-row gap-4 mt-4">
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
                  className="flex-1 min-w-0 font-mono px-5 py-4 text-2xl placeholder:text-[#8a8886] focus:outline-none transition-colors"
                  style={{
                    background: BG,
                    border: `1px solid ${error ? ALERT : LINE}`,
                    color: INK,
                    letterSpacing: '10px',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = RED_HOVER;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = error ? ALERT : LINE;
                  }}
                />
                <button
                  type="submit"
                  className="font-mono text-sm uppercase px-8 py-4 transition-colors whitespace-nowrap"
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
              </div>

              {error && (
                <p
                  id="join-code-error"
                  role="alert"
                  className="font-mono text-xs mt-4"
                  style={{ letterSpacing: '1px', color: ALERT }}
                >
                  !! {error}
                </p>
              )}
            </form>

            {/* Hosting is the other half of the product, not a footnote, so it gets
                a button at the same weight as the join control. */}
            <div className="mt-6 p-6" style={{ border: `1px solid ${LINE}` }}>
              <p
                className="font-mono text-xs uppercase"
                style={{ letterSpacing: '2px', color: MUTED }}
              >
                {t('landing.noCodeYet')}
              </p>
              <p
                className="text-sm mt-3 leading-relaxed"
                style={{ color: DIM }}
              >
                {t('landing.hostBlurb')}
              </p>
              <Link
                to="/host"
                className="block w-full text-center font-mono text-sm uppercase px-8 py-4 mt-5 transition-colors"
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

            <ul className="flex flex-wrap gap-x-6 gap-y-3 mt-8">
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

          {/* What the whole game builds toward. Text and tiles only, no mock
              device chrome. */}
          <div
            className="md:col-span-5"
            style={{ background: PANEL, border: `1px solid ${LINE}` }}
          >
            <div
              className="px-6 py-4"
              style={{ borderBottom: `1px solid ${LINE}` }}
            >
              <SectionLabel>{t('landing.finalCode')}</SectionLabel>
            </div>

            <div className="p-6">
              <p
                className="font-mono text-xs uppercase"
                style={{ letterSpacing: '2px', color: MUTED }}
              >
                {t('landing.lettersRecovered')}
              </p>
              <div className="flex gap-2 mt-4">
                {SAMPLE_LETTERS.map((letter, i) => (
                  <span
                    key={i}
                    className="font-display w-11 h-11 flex items-center justify-center text-base font-bold"
                    style={{
                      border: `1px solid ${letter === '?' ? LINE : RED}`,
                      background: letter === '?' ? 'transparent' : '#1c0000',
                      color: letter === '?' ? DIM : INK,
                    }}
                  >
                    {letter}
                  </span>
                ))}
              </div>

              <p
                className="font-mono text-xs uppercase mt-8"
                style={{ letterSpacing: '2px', color: MUTED }}
              >
                {t('landing.finalRiddleLabel')}
              </p>
              <p
                className="text-base mt-4 leading-relaxed"
                style={{
                  color: INK,
                  borderLeft: `2px solid ${LINE}`,
                  paddingLeft: 16,
                }}
              >
                {t('landing.sampleFinalRiddle')}
              </p>

              <p
                className="font-mono text-xs uppercase mt-8"
                style={{ letterSpacing: '2px', color: MUTED }}
              >
                {t('landing.answerLabel')}
              </p>
              <div className="flex gap-2 mt-4" aria-hidden>
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-11 h-11"
                    style={{ borderBottom: `2px solid ${LINE}` }}
                  />
                ))}
              </div>

              <p
                className="text-xs mt-8 leading-relaxed"
                style={{ color: DIM }}
              >
                {t('landing.finalNote')}
              </p>
            </div>
          </div>
        </section>

        {/* How it works: 3/9 split, label rail on the left. */}
        <section
          className="grid md:grid-cols-12 gap-8 md:gap-14 py-16"
          style={{ borderTop: `1px solid ${LINE}` }}
        >
          <div className="md:col-span-3">
            <SectionLabel>{t('landing.howItWorks')}</SectionLabel>
          </div>

          <ol className="md:col-span-9 grid sm:grid-cols-2 gap-x-12 gap-y-8">
            {STEPS.map((n) => (
              <li key={n} className="flex gap-4">
                <span
                  className="font-mono text-xs pt-1"
                  style={{ letterSpacing: '1.5px', color: MUTED }}
                >
                  {String(n).padStart(2, '0')}
                </span>
                <div>
                  <h2
                    className="font-mono text-sm uppercase"
                    style={{
                      fontWeight: 700,
                      letterSpacing: '1.5px',
                      color: INK,
                    }}
                  >
                    {t(`mobile.tutorial.step${n}Title`)}
                  </h2>
                  <p
                    className="text-xs mt-2 leading-relaxed"
                    style={{ color: DIM }}
                  >
                    {t(`mobile.tutorial.step${n}Description`)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Difficulty: reuses the labels the host sees on the create screen. */}
        <section
          className="grid md:grid-cols-12 gap-8 md:gap-14 py-16"
          style={{ borderTop: `1px solid ${LINE}` }}
        >
          <div className="md:col-span-3">
            <SectionLabel>{t('landing.choosePressure')}</SectionLabel>
            <p className="text-xs mt-4 leading-relaxed" style={{ color: DIM }}>
              {t('landing.pressureNote')}
            </p>
          </div>

          <div className="md:col-span-9 grid sm:grid-cols-3 gap-4">
            {DIFFICULTIES.map(({ key, bars }) => (
              <div
                key={key}
                className="p-5"
                style={{ background: PANEL, border: `1px solid ${LINE}` }}
              >
                <div className="flex gap-1" aria-hidden>
                  {[1, 2, 3].map((i) => (
                    <span
                      key={i}
                      style={{
                        height: 4,
                        width: 20,
                        background: i <= bars ? RED : LINE,
                      }}
                    />
                  ))}
                </div>
                <h2
                  className="font-mono text-sm uppercase mt-4"
                  style={{
                    fontWeight: 700,
                    letterSpacing: '1.5px',
                    color: INK,
                  }}
                >
                  {t(`difficulty.${key}`)}
                </h2>
                <p
                  className="font-mono text-xs uppercase mt-2"
                  style={{ letterSpacing: '1.5px', color: MUTED }}
                >
                  {t(`difficulty.${key}Sub`)}
                </p>
              </div>
            ))}
          </div>
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
