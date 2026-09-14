import React from 'react';
import { Link } from 'react-router-dom';
import { useT } from '../../../../languages/LanguageProvider';
import { CARD, DIM, INK, LABEL, RED } from './theme';

export default function HostCard() {
  const t = useT();

  return (
    <div className="p-6 flex flex-col" style={CARD}>
      <p className="font-mono text-xs uppercase" style={LABEL}>
        {t('landing.noCodeYet')}
      </p>
      <p className="text-sm mt-4 leading-relaxed" style={{ color: DIM }}>
        {t('landing.hostBlurb')}
      </p>

      {/* Outlined rather than filled, so the join button stays the louder of the
          two, but at the same size and on the same baseline. */}
      <Link
        to="/host"
        className="w-full text-center font-mono text-sm uppercase px-6 py-4 mt-auto transition-colors"
        style={{ border: `1px solid ${RED}`, color: INK, letterSpacing: '2px' }}
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
  );
}
