import React, { useEffect, useRef } from 'react';
import { useT } from '../../../../languages/LanguageProvider';
import { sound } from './landingSound';
import { inView, onFrame, reducedMotion, timeouts } from './motion';
import {
  ArtEscape,
  ArtFind,
  ArtLetters,
  ArtPhoto,
  ArtRiddle,
  PaintDefs,
} from './polaroidArt';

// The five polaroids: tilt, drop below the row (wide screens only) and photo.
const STEPS = [
  { rot: -5, dy: 0, Art: ArtRiddle },
  { rot: 3, dy: 38, Art: ArtFind },
  { rot: -2.5, dy: 8, Art: ArtPhoto },
  { rot: 4.5, dy: 48, Art: ArtLetters },
  { rot: -3.5, dy: 14, Art: ArtEscape },
];

function startBoard(board) {
  const reduce = reducedMotion();
  const later = timeouts();
  const svgs = [...board.querySelectorAll('.lp-string')];
  const threads = [...board.querySelectorAll('.lp-string path')];
  const thread = board.querySelector('.lp-string-front .lp-thread');
  const items = [...board.querySelectorAll('.lp-polaroids > li')];
  const pins = [...board.querySelectorAll('.lp-pin')];
  let revealed = false;
  let swayOn = false;

  function drawString() {
    const w = board.clientWidth;
    const h = board.clientHeight;
    svgs.forEach((svg) => {
      svg.setAttribute('width', w);
      svg.setAttribute('height', h);
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    });
    const pts = items.map((li) => [
      li.offsetLeft + li.offsetWidth / 2,
      li.offsetTop + 16,
    ]);
    let d = `M${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1];
      const [x1, y1] = pts[i];
      const sag = Math.min(70, Math.hypot(x1 - x0, y1 - y0) * 0.2);
      d += ` Q${(x0 + x1) / 2} ${(y0 + y1) / 2 + sag} ${x1} ${y1}`;
    }
    threads.forEach((p) => p.setAttribute('d', d));
    pins.forEach((g, i) =>
      g.setAttribute('transform', `translate(${pts[i][0]} ${pts[i][1]})`)
    );
    const len = thread.getTotalLength();
    threads.forEach((p) => {
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = revealed ? 0 : len;
    });
  }

  function reveal() {
    revealed = true;
    board.classList.add('is-pinned');
    const len = thread.getTotalLength();
    threads.forEach((p) => {
      p.style.transition = 'none';
      p.style.strokeDashoffset = len;
      p.getBoundingClientRect(); 
      p.style.transition = reduce
        ? 'none'
        : 'stroke-dashoffset 1.8s cubic-bezier(.6,0,.3,1) .7s';
      p.style.strokeDashoffset = 0;
    });
    later(() => {
      items.forEach((li) => {
        li.style.transition = 'none';
      });
      swayOn = !reduce;
    }, 2400);
  }

  const ro = new ResizeObserver(drawString);
  ro.observe(board);
  drawString();

  let revealIO = null;
  if (reduce) reveal();
  else {
    revealIO = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        revealIO.disconnect();
        reveal();
      },
      { threshold: 0.2 }
    );
    revealIO.observe(board);
  }

  let stopFrame = () => {};
  let view = null;
  if (!reduce) {
    view = inView(board);
    const sways = items.map((li) => ({
      li,
      a: 0,
      w: 0,
      k: (0.6 + Math.random() * 0.7) * (Math.random() < 0.5 ? -1 : 1),
    }));
    stopFrame = onFrame((now, dt, dy) => {
      if (!swayOn || !view.visible) return;
      sways.forEach((sw) => {
        sw.w += Math.max(-40, Math.min(40, dy)) * 0.009 * sw.k;
        sw.w -= sw.a * 0.05;
        sw.w *= 0.9;
        sw.a = Math.max(-7, Math.min(7, sw.a + sw.w));
        sw.li.style.transform =
          Math.abs(sw.a) < 0.02 && Math.abs(sw.w) < 0.02
            ? ''
            : `rotate(${sw.a.toFixed(2)}deg)`;
      });
    });
  }

  return () => {
    stopFrame();
    later.clear();
    ro.disconnect();
    revealIO?.disconnect();
    view?.stop();
  };
}

export default function EvidenceBoard() {
  const t = useT();
  const boardRef = useRef(null);

  useEffect(() => startBoard(boardRef.current), []);

  return (
    <section className="lp-board-sec" id="how" aria-labelledby="lp-how-title">
      <PaintDefs />
      <div className="lp-wrap">
        <header className="lp-sec-head">
          <h2 id="lp-how-title" data-reveal="ignite">
            {t('landing.how.title')}
          </h2>
          <p data-reveal="fade">{t('landing.how.intro')}</p>
        </header>
        <div className="lp-board" ref={boardRef}>
          <svg className="lp-string lp-string-back" aria-hidden="true">
            <path className="lp-thread-shadow" />
            <path className="lp-thread" />
          </svg>
          <ol className="lp-polaroids">
            {STEPS.map(({ rot, dy, Art }, i) => (
              <li key={i} style={{ '--i': i, '--dy': `${dy}px` }}>
                <article
                  className="lp-pola"
                  style={{ '--rot': `${rot}deg` }}
                  onPointerEnter={() => sound.shutter()}
                >
                  <div className="lp-photo">
                    <Art />
                    <span className="lp-flash" />
                  </div>
                  <div className="lp-cap">
                    <span className="lp-num">#{i + 1}</span>
                    <h3>{t(`landing.how.s${i + 1}Title`)}</h3>
                    <p>{t(`landing.how.s${i + 1}Body`)}</p>
                  </div>
                </article>
              </li>
            ))}
          </ol>
          <svg className="lp-string lp-string-front" aria-hidden="true">
            <path className="lp-thread-shadow" />
            <path className="lp-thread" />
            <g>
              {STEPS.map((_, i) => (
                <g
                  key={i}
                  className="lp-pin"
                  style={{ transitionDelay: `${900 + i * 160}ms` }}
                >
                  <circle r="9" fill="rgba(0,0,0,.45)" cx="2" cy="4" />
                  <circle r="8" fill="url(#lp-g-pin)" />
                  <circle
                    r="2.2"
                    cx="-2.5"
                    cy="-2.5"
                    fill="rgba(255,255,255,.55)"
                  />
                </g>
              ))}
            </g>
          </svg>
        </div>
      </div>
    </section>
  );
}
