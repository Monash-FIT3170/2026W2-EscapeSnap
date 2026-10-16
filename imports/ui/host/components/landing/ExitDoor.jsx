import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useT } from '../../../../languages/LanguageProvider';
import { goToKeypad } from './JoinKeypad';
import { clamp01, inView, onFrame, reducedMotion } from './motion';

export default function ExitDoor() {
  const t = useT();
  const exitRef = useRef(null);

  useEffect(() => {
    if (reducedMotion()) return undefined;
    const exit = exitRef.current;
    const view = inView(exit);
    const stopFrame = onFrame(() => {
      if (!view.visible) return;
      const top = exit.getBoundingClientRect().top;
      const vh = window.innerHeight;
      exit.style.setProperty(
        '--glow',
        clamp01((vh - top) / (vh * 0.85)).toFixed(3)
      );
    });
    return () => {
      stopFrame();
      view.stop();
    };
  }, []);

  return (
    <section
      className="lp-exit"
      id="exit"
      ref={exitRef}
      aria-labelledby="lp-exit-title"
    >
      <div className="lp-door">
        <span className="lp-knob" aria-hidden="true" />
        <h2 id="lp-exit-title" data-reveal="ignite">
          {t('landing.exit.title')}
        </h2>
        <p data-reveal="fade">{t('landing.exit.body')}</p>
        <div className="lp-actions" data-reveal="fade">
          <Link className="lp-btn lp-btn-primary" to="/host">
            {t('landing.host')}
          </Link>
          <a
            className="lp-btn lp-btn-ghost"
            href="#lp-join"
            onClick={goToKeypad}
          >
            {t('landing.exit.joinWithCode')}
          </a>
        </div>
        <div className="lp-gap" aria-hidden="true">
          <span className="lp-feet" />
        </div>
      </div>
      <div className="lp-spill" aria-hidden="true" />
    </section>
  );
}
