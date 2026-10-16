import React, { useEffect, useRef } from 'react';
import { useT } from '../../../../languages/LanguageProvider';
import { Ecg } from './ecg';
import { inView, onFrame, reducedMotion } from './motion';

const MONITORS = [
  { mode: 'easy', bpm: 62, delay: '0s', lead: 'landing.pressure.ecg' },
  { mode: 'medium', bpm: 108, delay: '.2s', lead: 'landing.pressure.ecg' },
  { mode: 'hard', bpm: 164, delay: '.4s', lead: 'landing.pressure.arrhythmia' },
];

const HEART =
  'M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.6 4.5c2.1 0 3.6 1.2 5.4 3 1.8-1.8 3.3-3 5.4-3 3.6 0 5.7 3.9 4.2 7.3C19.5 16.4 12 21 12 21z';

export default function VitalsSection() {
  const t = useT();
  const sectionRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    const reduce = reducedMotion();
    const ecgs = [...listRef.current.querySelectorAll('.lp-monitor')].map(
      (fig) => new Ecg(fig, reduce)
    );
    const ro = new ResizeObserver(() => ecgs.forEach((e) => e.resize()));
    ro.observe(listRef.current);
    let stopFrame = () => {};
    let view = null;
    if (!reduce) {
      view = inView(sectionRef.current, { rootMargin: '100px' });
      stopFrame = onFrame((now, dt) => {
        if (!view.visible || document.hidden) return;
        ecgs.forEach((e) => {
          e.step(dt);
          e.draw();
        });
      });
    }
    return () => {
      stopFrame();
      ro.disconnect();
      view?.stop();
      ecgs.forEach((e) => e.destroy());
    };
  }, []);

  return (
    <section
      className="lp-vitals-sec"
      id="pressure"
      ref={sectionRef}
      aria-labelledby="lp-pressure-title"
    >
      <div className="lp-wrap">
        <header className="lp-sec-head">
          <h2 id="lp-pressure-title" data-reveal="ignite">
            {t('landing.pressure.title')}
          </h2>
          <p data-reveal="fade">{t('landing.pressure.intro')}</p>
        </header>
        <div className="lp-monitors" ref={listRef}>
          {MONITORS.map(({ mode, bpm, delay, lead }) => (
            <figure
              key={mode}
              className={`lp-monitor lp-${mode}`}
              data-bpm={bpm}
              data-mode={mode}
            >
              <div
                className="lp-screen"
                data-reveal="crt"
                style={{ '--d': delay }}
              >
                <div className="lp-glass">
                  <svg
                    className="lp-heart"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d={HEART} />
                  </svg>
                  <span className="lp-lead-lbl" aria-hidden="true">
                    {t(lead)}
                  </span>
                  <div className="lp-readout" aria-hidden="true">
                    <span className="lp-bpm" />
                    <small>{t('landing.pressure.bpm')}</small>
                  </div>
                  <canvas aria-hidden="true" />
                </div>
              </div>
              <figcaption>
                <h3>{t(`landing.pressure.${mode}`)}</h3>
                <p className="lp-state">{t(`landing.pressure.${mode}State`)}</p>
                <p className="lp-desc">{t(`landing.pressure.${mode}Desc`)}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
