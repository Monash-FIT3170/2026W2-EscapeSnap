import React, { useEffect, useRef } from 'react';
import { useT } from '../../../../languages/LanguageProvider';
import { inView, onFrame, reducedMotion } from './motion';

const mod = (a, b) => ((a % b) + b) % b;

export default function CautionTape() {
  const t = useT();
  const ref = useRef(null);

  useEffect(() => {
    if (reducedMotion()) return undefined;
    const tracks = [...ref.current.querySelectorAll('.lp-track')].map(
      (el, i) => ({
        el,
        dir: i ? -1 : 1,
        speed: i ? 30 : 42,
        pos: Math.random() * 400,
        half: 0,
      })
    );
    // Re-measured whenever a track changes width: resize, fonts, language.
    const ro = new ResizeObserver(() =>
      tracks.forEach((tp) => {
        tp.half = tp.el.scrollWidth / 2;
      })
    );
    tracks.forEach((tp) => ro.observe(tp.el));
    const view = inView(ref.current);
    const stopFrame = onFrame((now, dt, dy) => {
      if (!view.visible) return;
      tracks.forEach((tp) => {
        if (!tp.half) return;
        tp.pos += tp.speed * dt + dy * 0.7;
        const x =
          tp.dir > 0 ? -mod(tp.pos, tp.half) : -tp.half + mod(tp.pos, tp.half);
        tp.el.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`;
      });
    });
    return () => {
      stopFrame();
      ro.disconnect();
      view.stop();
    };
  }, []);

  const track = (key) => {
    const items = t(key).split('|');
    const half = [...items, ...items, ...items];
    return [...half, ...half].map((item, i) => <span key={i}>{item}</span>);
  };

  return (
    <div className="lp-tapes" ref={ref}>
      <p className="lp-sr">{t('landing.tape.sr')}</p>
      <div className="lp-tape lp-tape-a" aria-hidden="true">
        <div className="lp-track">{track('landing.tape.a')}</div>
      </div>
      <div className="lp-tape lp-tape-b" aria-hidden="true">
        <div className="lp-track">{track('landing.tape.b')}</div>
      </div>
    </div>
  );
}
