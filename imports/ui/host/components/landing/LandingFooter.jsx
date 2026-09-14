import React from 'react';
import { Link } from 'react-router-dom';
import { useT } from '../../../../languages/LanguageProvider';
import { DIM, INK, LINE, MUTED } from './theme';

export default function LandingFooter() {
  const t = useT();

  return (
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
  );
}
