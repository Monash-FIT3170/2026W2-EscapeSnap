import React from 'react';
import { useT } from '../../../../languages/LanguageProvider';
import { BRAND, DIM, INK, LINE, MUTED } from './theme';

export default function LandingHero() {
  const t = useT();

  const specs = [
    t('landing.specPlayers'),
    t('landing.specDuration'),
    t('landing.specInstall'),
    t('landing.specDevices'),
  ];

  return (
    <div className="max-w-3xl mx-auto text-center">
      <h1 className="font-display text-5xl md:text-7xl font-black tracking-wider leading-none">
        <span style={{ color: INK }}>ESCAPE</span>
        <span style={{ color: BRAND }}>SNAP</span>
      </h1>

      <p className="text-sm mt-8 leading-relaxed" style={{ color: MUTED }}>
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
  );
}
