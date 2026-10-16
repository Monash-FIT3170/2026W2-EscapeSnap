import React, { useEffect, useRef } from 'react';
import { useT } from '../../../../languages/LanguageProvider';
import { inView, reducedMotion } from './motion';

const pad = (n) => String(n).padStart(2, '0');

export default function SetupRig() {
  const t = useT();
  const rigRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    let left = 14 * 60 + 59;
    const show = () => {
      timerRef.current.textContent = `${pad(Math.floor(left / 60))}:${pad(left % 60)}`;
    };
    show();
    if (reducedMotion()) return undefined;
    const view = inView(rigRef.current);
    const id = setInterval(() => {
      if (!view.visible) return;
      left = left <= 0 ? 15 * 60 : left - 1;
      show();
    }, 1000);
    return () => {
      clearInterval(id);
      view.stop();
    };
  }, []);

  return (
    <section
      className="lp-setup-sec"
      id="setup"
      aria-labelledby="lp-setup-title"
    >
      <div className="lp-wrap lp-setup-grid">
        <header className="lp-sec-head">
          <h2 id="lp-setup-title" data-reveal="ignite">
            {t('landing.setup.title')}
          </h2>
          <p data-reveal="fade">{t('landing.setup.p1')}</p>
          <p data-reveal="fade">{t('landing.setup.p2')}</p>
        </header>
        <div
          className="lp-rig"
          ref={rigRef}
          aria-hidden="true"
          data-reveal="rig"
          style={{ '--d': '.15s' }}
        >
          <div className="lp-tv">
            <div className="lp-tv-screen">
              <div>
                <small>{t('landing.setup.roomCode')}</small>
                <b>4821</b>
              </div>
              <div className="lp-tv-round">
                <small>{t('landing.setup.round')}</small>
                <b>3/5</b>
                <div className="lp-tv-players">
                  <i />
                  <i />
                  <i />
                  <i className="lp-off" />
                </div>
              </div>
              <div className="lp-tv-timer" ref={timerRef} />
              <div className="lp-tv-letters">
                <i>O</i>
                <i>R</i>
                <i className="lp-empty" />
                <i className="lp-empty" />
              </div>
            </div>
          </div>
          <div className="lp-tv-stand" />
          <div className="lp-phone lp-ph1">
            <div className="lp-ph-screen lp-cam">
              <span className="lp-vf" />
              <span className="lp-shut" />
            </div>
          </div>
          <div className="lp-phone lp-ph2">
            <div className="lp-ph-screen">
              <b>4821</b>
              <span className="lp-ok">{t('landing.setup.joined')}</span>
            </div>
          </div>
          <div className="lp-phone lp-ph3">
            <div className="lp-ph-screen">
              <span className="lp-tile">D</span>
              <span>{t('landing.setup.newLetter')}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
