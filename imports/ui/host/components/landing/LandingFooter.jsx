import React from 'react';
import { Link } from 'react-router-dom';
import { useT } from '../../../../languages/LanguageProvider';
import { goToKeypad } from './JoinKeypad';
import { Brand } from './LandingNav';

export default function LandingFooter() {
  const t = useT();

  return (
    <footer className="lp-foot">
      <div className="lp-wrap lp-foot-row">
        <Brand />
        <nav aria-label={t('landing.footer.label')}>
          <Link to="/host">{t('landing.host')}</Link>
          <a href="#lp-join" onClick={goToKeypad}>
            {t('landing.join')}
          </a>
          <Link to="/leaderboard">{t('landing.leaderboard')}</Link>
        </nav>
        <small>© 2026 EscapeSnap</small>
      </div>
      <p className="lp-whisper" aria-hidden="true">
        {t('landing.footer.whisper')}
      </p>
    </footer>
  );
}
