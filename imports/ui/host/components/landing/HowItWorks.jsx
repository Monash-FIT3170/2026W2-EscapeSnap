import React from 'react';
import { useT } from '../../../../languages/LanguageProvider';
import SectionHeader from './SectionHeader';
import { BRAND, DIM, INK, LINE } from './theme';

// The five briefing steps are already written and translated for the mobile
// tutorial, so this reads from the same keys.
const STEPS = [1, 2, 3, 4, 5];

// Label above the content, not beside it: a left-hand rail left a third of the
// row empty and squeezed the five steps into an orphaned 2x3 grid.
export default function HowItWorks() {
  const t = useT();

  return (
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
              style={{ fontWeight: 700, letterSpacing: '1.5px', color: INK }}
            >
              {t(`mobile.tutorial.step${n}Title`)}
            </h3>
            <p className="text-xs mt-2 leading-relaxed" style={{ color: DIM }}>
              {t(`mobile.tutorial.step${n}Description`)}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
