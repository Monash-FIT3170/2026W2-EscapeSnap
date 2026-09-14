import React from 'react';
import { useT } from '../../../../languages/LanguageProvider';
import SectionHeader from './SectionHeader';
import { CARD, DIM, INK, LABEL, LINE, RED } from './theme';

const DIFFICULTIES = [
  { key: 'easy', bars: 1 },
  { key: 'medium', bars: 2 },
  { key: 'hard', bars: 3 },
];

// Reuses the labels the host already sees on the create-game screen.
export default function DifficultyTiers() {
  const t = useT();

  return (
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
              style={{ fontWeight: 700, letterSpacing: '1.5px', color: INK }}
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
  );
}
