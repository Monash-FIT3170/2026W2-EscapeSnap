import { sound } from './landingSound';
import {
  DESKTOP_FX,
  clamp01,
  inView,
  onFrame,
  reducedMotion,
  timeouts,
} from './motion';

// Where the eyes may appear, as fractions of the hero's width and height.
const EYE_SPOTS = [
  [0.05, 0.6],
  [0.95, 0.32],
  [0.5, 0.93],
  [0.9, 0.84],
  [0.08, 0.2],
  [0.6, 0.17],
  [0.3, 0.9],
  [0.97, 0.62],
  [0.55, 0.6],
];

const shuffle = (list) => [...list].sort(() => Math.random() - 0.5);

// The title is one line, so shrink it until it fits its column.
function fitTitle(title) {
  title.style.fontSize = '';
  const avail = title.clientWidth;
  if (avail && title.scrollWidth > avail) {
    const fs = parseFloat(getComputedStyle(title).fontSize);
    title.style.fontSize = `${((fs * avail) / title.scrollWidth) * 0.985}px`;
  }
}

// Everything the CCTV hero does by itself: the letters lighting up, the torch
// that follows the pointer (and drifts when idle), the eyes in the dark, the
// light cuts and the scroll parallax. Every per-frame value is written to the
// DOM directly. Returns a cleanup that stops all of it.
export function startHero(hero) {
  const reduce = reducedMotion();
  const q = (s) => hero.querySelector(s);
  const dark = q('.lp-dark');
  const eyes = q('.lp-eyes');
  const motionLbl = q('.lp-motion');
  const title = q('.lp-title');
  const copy = q('.lp-hero-copy');
  const keypad = q('.lp-keypad');
  const wall = q('.lp-wall');
  const letters = [...hero.querySelectorAll('.lp-ltr')];
  const later = timeouts();
  const view = inView(hero);
  const desktop = window.matchMedia(DESKTOP_FX);
  let heroP = 0;

  // ---- the torch ----
  let lx = hero.clientWidth * 0.3;
  let ly = hero.clientHeight * 0.42;
  let tx = lx;
  let ty = ly;
  let R = 0;
  let targetR = 0;
  let lastMove = -1e9;
  const baseR = () =>
    Math.max(
      170,
      Math.min(300, Math.min(hero.clientWidth, window.innerHeight) * 0.3)
    );
  const aim = (e) => {
    const r = hero.getBoundingClientRect();
    tx = e.clientX - r.left;
    ty = e.clientY - r.top;
    lastMove = performance.now();
  };
  const onResize = () => {
    if (targetR) targetR = baseR();
    fitTitle(title);
  };

  // ---- the eyes: only in the dark, away from the copy, gone once lit ----
  let eyesOn = false;
  let eyesNext = performance.now() + 4500;
  let eyesHideAt = 0;
  let ex = 0;
  let ey = 0;
  let motionT = 0;
  const avoid = () =>
    [
      ...hero.querySelectorAll(
        '.lp-title,.lp-lead,.lp-body,.lp-meta,.lp-actions,.lp-keypad'
      ),
    ].map((el) => el.getBoundingClientRect());

  function eyesTick(now) {
    if (!eyesOn && now > eyesNext && R > 40) {
      const hr = hero.getBoundingClientRect();
      const rects = avoid();
      const spots = EYE_SPOTS.map(([px, py]) => [
        px * hr.width,
        py * hr.height,
      ]).filter(([x, y]) => {
        if (Math.hypot(x - lx, y - ly) < R + 170) return false;
        const cx = x + hr.left;
        const cy = y + hr.top;
        if (cy < 100 || cy > window.innerHeight - 30) return false;
        return !rects.some(
          (r) =>
            cx > r.left - 34 &&
            cx < r.right + 34 &&
            cy > r.top - 30 &&
            cy < r.bottom + 30
        );
      });
      if (spots.length) {
        [ex, ey] = spots[Math.floor(Math.random() * spots.length)];
        eyes.style.transform = `translate(${ex - 15}px, ${ey - 4}px)`;
        eyes.classList.add('is-on');
        eyesOn = true;
        sound.presence();
        eyesHideAt = now + 5000 + Math.random() * 4000;
        clearTimeout(motionT);
        motionLbl.classList.add('is-alert');
      } else eyesNext = now + 1500;
    }
    if (
      eyesOn &&
      (Math.hypot(ex - lx, ey - ly) < R * 0.95 || now > eyesHideAt)
    ) {
      eyes.classList.remove('is-on');
      eyesOn = false;
      eyesNext = now + 3500 + Math.random() * 5000;
      motionT = later(() => motionLbl.classList.remove('is-alert'), 1400);
    }
  }

  // ---- parallax: the copy drifts off, the torch narrows, letters die ----
  const offOrder = shuffle(letters.map((_, i) => i));
  let lastOut = 0;
  function parallax() {
    const p = clamp01(window.scrollY / hero.offsetHeight);
    heroP = p;
    copy.style.transform = `translate3d(0,${(p * 120).toFixed(1)}px,0)`;
    copy.style.opacity = (1 - p * 1.2).toFixed(3);
    keypad.style.transform = `translate3d(0,${(p * 60).toFixed(1)}px,0)`;
    keypad.style.opacity = (1 - p * 1.25).toFixed(3);
    wall.style.transform = `translate3d(0,${(p * hero.offsetHeight * 0.3).toFixed(1)}px,0)`;
    const out = Math.round(clamp01((p - 0.15) / 0.35) * letters.length);
    if (out !== lastOut) {
      lastOut = out;
      letters.forEach((l, i) =>
        l.classList.toggle('is-off', offOrder.indexOf(i) < out)
      );
    }
  }
  function resetParallax() {
    [copy, keypad, wall].forEach((el) => {
      el.style.transform = '';
      el.style.opacity = '';
    });
    letters.forEach((l) => l.classList.remove('is-off'));
    lastOut = 0;
    heroP = 0;
  }

  const stopFrame = onFrame((now) => {
    if (!view.visible) return;
    if (!reduce && now - lastMove > 2600) {
      const w = hero.clientWidth;
      const h = hero.clientHeight;
      tx = w * (0.5 + 0.4 * Math.sin(now / 3300));
      ty = h * (0.5 + 0.3 * Math.sin(now / 2300 + 1.2));
    }
    lx += (tx - lx) * 0.12;
    ly += (ty - ly) * 0.12;
    R += (targetR * (1 - heroP * 0.6) - R) * 0.06;
    dark.style.setProperty('--lx', `${lx.toFixed(1)}px`);
    dark.style.setProperty('--ly', `${ly.toFixed(1)}px`);
    dark.style.setProperty('--r', `${R.toFixed(1)}px`);
    eyesTick(now);
    if (!reduce && desktop.matches) parallax();
  });

  // ---- the lights cut out every 10-19 s ----
  function scheduleFlicker() {
    later(
      () => {
        if (view.visible && !document.hidden) {
          hero.classList.remove('is-flick');
          void hero.offsetWidth; // restart the animation
          hero.classList.add('is-flick');
          sound.flicker();
          later(() => hero.classList.remove('is-flick'), 500);
        }
        scheduleFlicker();
      },
      10000 + Math.random() * 9000
    );
  }

  // ---- lights on: letters flicker to life one by one, then the torch ----
  let booted = false;
  function boot() {
    if (booted) return;
    booted = true;
    fitTitle(title);
    if (reduce) {
      letters.forEach((l) => l.classList.add('is-on'));
      hero.classList.add('is-lit');
      targetR = baseR();
      return;
    }
    const faulty = letters.find((l) => l.classList.contains('lp-faulty'));
    shuffle(letters.filter((l) => l !== faulty)).forEach((l, k) =>
      later(() => l.classList.add('is-on'), 220 + k * 85 + Math.random() * 90)
    );
    later(() => faulty.classList.add('is-on'), 1350);
    later(() => {
      targetR = baseR();
    }, 550);
    later(() => hero.classList.add('is-lit'), 1000);
    scheduleFlicker();
  }
  // Measure the title in its real face: wait for the fonts, or 1.2 s at most.
  document.fonts?.ready.then(() => later(boot, 0));
  later(boot, 1200);
  const refit = () => fitTitle(title);
  document.fonts?.addEventListener('loadingdone', refit);

  hero.addEventListener('pointermove', aim);
  hero.addEventListener('pointerdown', aim);
  window.addEventListener('resize', onResize);
  desktop.addEventListener('change', resetParallax);

  return () => {
    stopFrame();
    later.clear();
    view.stop();
    hero.removeEventListener('pointermove', aim);
    hero.removeEventListener('pointerdown', aim);
    window.removeEventListener('resize', onResize);
    desktop.removeEventListener('change', resetParallax);
    document.fonts?.removeEventListener('loadingdone', refit);
  };
}
