import React from 'react';
import { Link } from 'react-router-dom';
import { useT } from '../../../../languages/LanguageProvider';
import { LanguagePicker } from '../../../../languages/LanguagePicker';

// #8b0000 is a fill here, never a text colour — it reads 1.9:1 on the near-black
// background. Accent labels carry the 4px red bar instead, which only has to
// clear the 3:1 non-text threshold. Likewise DIM replaces the #555/#444 used
// elsewhere in the host pages, which fail AA on #0e0e0e.
const INK = '#e5e2e1';
const MUTED = '#aa8984';
const DIM = '#8a8886';
const LINE = '#353534';
const PANEL = '#1c1b1b';
const RED = '#8b0000';
const BG = '#0e0e0e';

// The five briefing steps are already written and translated for the mobile
// tutorial, so the landing page reads from the same keys.
const STEPS = [1, 2, 3, 4, 5];

// A still of a session mid-round, so the page shows the product rather than
// describing it. Static on purpose — the landing page subscribes to nothing.
const SAMPLE_ROWS = [
  { name: 'MAYA', cells: ['correct', 'correct', 'pending'] },
  { name: 'ARJUN', cells: ['correct', 'wrong', 'pending'] },
  { name: 'LEO', cells: ['correct', 'correct', 'pending'] },
];

const CELL = {
  correct: { glyph: '✓', color: '#4ade80' },
  wrong: { glyph: '✕', color: '#ef4444' },
  pending: { glyph: '?', color: MUTED },
};

function SectionLabel({ children }) {
  return (
    <div className="flex items-center gap-3">
      <div style={{ width: 4, height: 16, background: RED }} />
      <span
        style={{
          fontWeight: 700,
          fontSize: 12,
          letterSpacing: '1.4px',
          color: INK,
        }}
      >
        {children}
      </span>
    </div>
  );
}

function Landing() {
  const t = useT();

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
        className="px-6 md:px-12 py-4 flex items-center justify-between"
        style={{ borderBottom: `1px solid ${LINE}` }}
      >
        <span
          className="font-bold text-xl tracking-widest uppercase"
          style={{ color: INK }}
        >
          ESCAPESNAP
        </span>
        <LanguagePicker />
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-6 md:px-12">
        {/* Hero — 7/5 split so the copy column and the session still sit off-centre. */}
        <section className="grid md:grid-cols-12 gap-10 md:gap-12 pt-12 md:pt-20 pb-16 items-start">
          <div className="md:col-span-7">
            <SectionLabel>{t('landing.initiateProtocol')}</SectionLabel>

            <h1
              className="text-5xl md:text-6xl font-bold tracking-widest uppercase mt-6"
              style={{ color: INK }}
            >
              ESCAPESNAP
            </h1>

            <p
              className="text-sm mt-6 max-w-xl leading-relaxed tracking-wide"
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

            {/* Host leads: this page opens on the desktop that runs the session. */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mt-10">
              <Link
                to="/host"
                className="sm:col-span-3 block px-6 py-5 transition-colors"
                style={{ background: RED, color: INK }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#a50000';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = RED;
                }}
              >
                <span className="block text-sm font-bold tracking-widest uppercase">
                  {t('landing.hostAGame')}
                </span>
                <span
                  className="block text-xs mt-2 tracking-wide"
                  style={{ color: '#f0d8d6' }}
                >
                  {t('landing.hostHint')}
                </span>
              </Link>

              <Link
                to="/player"
                className="sm:col-span-2 block px-6 py-5 transition-colors"
                style={{ border: `1px solid ${LINE}`, color: INK }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = RED;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = LINE;
                }}
              >
                <span className="block text-sm font-bold tracking-widest uppercase">
                  {t('landing.joinAsPlayer')}
                </span>
                <span
                  className="block text-xs mt-2 tracking-wide"
                  style={{ color: DIM }}
                >
                  {t('landing.playerHint')}
                </span>
              </Link>
            </div>

            <ul className="flex flex-wrap gap-x-6 gap-y-2 mt-8">
              {specs.map((spec) => (
                <li
                  key={spec}
                  className="text-xs tracking-widest uppercase pl-3"
                  style={{ color: DIM, borderLeft: `1px solid ${LINE}` }}
                >
                  {spec}
                </li>
              ))}
            </ul>
          </div>

          <div
            className="md:col-span-5"
            style={{ background: PANEL, border: `1px solid ${LINE}` }}
          >
            <div
              className="px-5 py-4"
              style={{ borderBottom: `1px solid ${LINE}` }}
            >
              <SectionLabel>{t('landing.sampleSession')}</SectionLabel>
            </div>

            <div
              className="flex items-center px-5 py-3"
              style={{ background: BG, borderBottom: `1px solid ${LINE}` }}
            >
              <span
                className="flex-1 text-xs font-bold tracking-widest"
                style={{ color: MUTED }}
              >
                {t('host.progress.player')}
              </span>
              {['01', '02', '03'].map((n) => (
                <span
                  key={n}
                  className="w-10 text-center text-xs font-bold tracking-widest"
                  style={{ color: MUTED }}
                >
                  {n}
                </span>
              ))}
            </div>

            {SAMPLE_ROWS.map((row, i) => (
              <div
                key={row.name}
                className="flex items-center px-5 py-4"
                style={{ borderTop: i > 0 ? `1px solid ${LINE}` : 'none' }}
              >
                <span
                  className="flex-1 text-xs font-bold tracking-wide"
                  style={{ color: INK }}
                >
                  {row.name}
                </span>
                {row.cells.map((state, ci) => (
                  <span
                    key={ci}
                    className="w-10 text-center text-sm font-bold"
                    style={{ color: CELL[state].color }}
                  >
                    {CELL[state].glyph}
                  </span>
                ))}
              </div>
            ))}

            <div
              className="px-5 py-4"
              style={{ borderTop: `1px solid ${LINE}` }}
            >
              <div className="flex gap-2">
                {['M', 'A', '?', 'P', 'M', '?'].map((letter, i) => (
                  <span
                    key={i}
                    className="w-8 h-8 flex items-center justify-center text-sm font-bold"
                    style={{
                      border: `1px solid ${letter === '?' ? LINE : RED}`,
                      color: letter === '?' ? DIM : INK,
                    }}
                  >
                    {letter}
                  </span>
                ))}
              </div>
              <p
                className="text-xs mt-4 leading-relaxed"
                style={{ color: DIM }}
              >
                {t('landing.sampleNote')}
              </p>
            </div>
          </div>
        </section>

        {/* How it works — 3/9 split, label rail on the left. */}
        <section
          className="grid md:grid-cols-12 gap-8 md:gap-12 py-16"
          style={{ borderTop: `1px solid ${LINE}` }}
        >
          <div className="md:col-span-3">
            <SectionLabel>{t('landing.howItWorks')}</SectionLabel>
          </div>

          <ol className="md:col-span-9 grid sm:grid-cols-2 gap-x-12 gap-y-8">
            {STEPS.map((n) => (
              <li key={n} className="flex gap-4">
                <span
                  className="text-xs font-bold tracking-widest pt-1"
                  style={{ color: MUTED }}
                >
                  {String(n).padStart(2, '0')}
                </span>
                <div>
                  <h2
                    className="text-sm font-bold tracking-widest uppercase"
                    style={{ color: INK }}
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
      </main>

      <footer
        className="px-6 md:px-12 py-4 flex flex-wrap items-center justify-between gap-4"
        style={{ borderTop: `1px solid ${LINE}` }}
      >
        <p className="text-xs tracking-widest uppercase" style={{ color: DIM }}>
          ESCAPESNAP · {t('landing.footerTag')}
        </p>
        <Link
          to="/leaderboard"
          className="text-xs tracking-widest uppercase px-3 py-3 transition-colors"
          style={{ color: MUTED }}
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
