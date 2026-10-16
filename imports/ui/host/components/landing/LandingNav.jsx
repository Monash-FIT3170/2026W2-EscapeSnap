import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useT } from '../../../../languages/LanguageProvider';
import { LanguagePicker } from '../../../../languages/LanguagePicker';
import { sound } from './landingSound';

export function Brand() {
  const t = useT();
  return (
    <a className="lp-brand" href="#top" aria-label={t('landing.homeLink')}>
      <span className="lp-rec-dot" aria-hidden="true" />
      <span>
        ESCAPE<span className="lp-snap">SNAP</span>
      </span>
    </a>
  );
}

export default function LandingNav() {
  const t = useT();
  const navRef = useRef(null);
  const soundBtnRef = useRef(null);
  const disarmRef = useRef(null);
  const [soundOn, setSoundOn] = useState(false);

  useEffect(() => {
    const nav = navRef.current;
    const onScroll = () =>
      nav.classList.toggle('is-scrolled', window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!sound.remembered()) return undefined;
    const disarm = () => {
      window.removeEventListener('click', start);
      window.removeEventListener('keydown', start);
      disarmRef.current = null;
    };
    function start(e) {
      if (soundBtnRef.current?.contains(e.target)) return;
      disarm();
      if (!sound.isOn()) setSoundOn(sound.toggle());
    }
    window.addEventListener('click', start);
    window.addEventListener('keydown', start);
    disarmRef.current = disarm;
    return disarm;
  }, []);

  function toggleSound() {
    disarmRef.current?.();
    setSoundOn(sound.toggle());
  }

  return (
    <header className="lp-nav" ref={navRef}>
      <Brand />
      <nav className="lp-nav-links" aria-label={t('landing.nav.sections')}>
        <a href="#how">{t('landing.nav.how')}</a>
        <a href="#final">{t('landing.nav.final')}</a>
        <a href="#pressure">{t('landing.nav.pressure')}</a>
        <Link to="/leaderboard">{t('landing.leaderboard')}</Link>
      </nav>
      <div className="lp-nav-tools">
        <button
          ref={soundBtnRef}
          className="lp-chip"
          type="button"
          aria-pressed={soundOn}
          onClick={toggleSound}
        >
          <span className="lp-bars" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span className="lp-sound-lbl">
            {t(soundOn ? 'landing.nav.soundOn' : 'landing.nav.soundOff')}
          </span>
        </button>
        <LanguagePicker chipClassName="lp-chip" />
      </div>
    </header>
  );
}
