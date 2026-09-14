import React from 'react';
import { useT } from '../../../../languages/LanguageProvider';
import { CARD, DIM, INK, LABEL, LINE, RED, TILE } from './theme';

// Pooled letters for the sample: one round came back wrong, so it shows a '?'
// exactly as a real game would.
const SAMPLE_LETTERS = ['M', 'A', '?', 'P'];

// What the whole game builds toward. Static, and the riddle is the real MAP
// entry from imports/lib/finalRiddle.js rather than invented copy.
export default function FinalCodeCard() {
  const t = useT();

  return (
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
                : { border: `1px solid ${RED}`, background: TILE, color: INK }
            }
          >
            {letter}
          </span>
        ))}
      </div>

      <p
        className="text-sm mt-5 leading-relaxed"
        style={{ color: INK, borderLeft: `2px solid ${LINE}`, paddingLeft: 14 }}
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
  );
}
