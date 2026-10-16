import { useCallback, useEffect, useRef } from 'react';

// Motion helpers shared by the landing page sections. Nothing here touches
// `window` until it is called.

export function reducedMotion() {
  return (
    typeof window !== 'undefined' &&
    Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
  );
}

// The hero's parallax and dying letters only run with a mouse on a wide screen.
export const DESKTOP_FX =
  '(min-width: 901px) and (hover: hover) and (pointer: fine)';

export const clamp01 = (v) => Math.max(0, Math.min(1, v));

// One requestAnimationFrame loop for the whole page. Each effect subscribes a
// callback, gets (time, dt, scrollDelta) every frame, and keeps the returned
// unsubscribe for its cleanup. The loop stops when nobody is subscribed.
const frameSubs = new Set();
let frameId = 0;
let lastTime = 0;
let lastScroll = 0;

function tick(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000 || 0);
  const scroll = window.scrollY;
  const dy = scroll - lastScroll;
  lastTime = now;
  lastScroll = scroll;
  frameSubs.forEach((fn) => fn(now, dt, dy));
  frameId = frameSubs.size ? requestAnimationFrame(tick) : 0;
}

export function onFrame(fn) {
  frameSubs.add(fn);
  if (!frameId) {
    lastTime = performance.now();
    lastScroll = window.scrollY;
    frameId = requestAnimationFrame(tick);
  }
  return () => {
    frameSubs.delete(fn);
    if (!frameSubs.size && frameId) {
      cancelAnimationFrame(frameId);
      frameId = 0;
    }
  };
}

// An `isIntersecting` flag kept current by an IntersectionObserver, so loops
// can idle while their section is off screen.
export function inView(el, options) {
  const io = new IntersectionObserver(([entry]) => {
    view.visible = entry.isIntersecting;
  }, options);
  const view = { visible: false, stop: () => io.disconnect() };
  io.observe(el);
  return view;
}

// setTimeout with a kill switch: clear() cancels everything pending and makes
// any later call a no-op, so nothing fires after the page has gone.
export function timeouts() {
  const ids = new Set();
  let live = true;
  const later = (fn, ms) => {
    if (!live) return 0;
    const id = setTimeout(() => {
      ids.delete(id);
      fn();
    }, ms);
    ids.add(id);
    return id;
  };
  later.clear = () => {
    live = false;
    ids.forEach(clearTimeout);
    ids.clear();
  };
  return later;
}

// timeouts() for a component, cleared on unmount.
export function useLater() {
  const ref = useRef(null);
  useEffect(() => {
    ref.current = timeouts();
    return () => ref.current.clear();
  }, []);
  return useCallback((fn, ms) => ref.current?.(fn, ms), []);
}

const SHAKE = [
  { transform: 'translateX(0)' },
  { transform: 'translateX(-7px)', offset: 0.2 },
  { transform: 'translateX(6px)', offset: 0.4 },
  { transform: 'translateX(-4px)', offset: 0.6 },
  { transform: 'translateX(2px)', offset: 0.8 },
  { transform: 'translateX(0)' },
];

// Web Animations rather than a CSS class, so a second error replays the shake
// without toggling classes React also manages.
export function shake(el) {
  if (el?.animate && !reducedMotion()) el.animate(SHAKE, { duration: 400 });
}

// The camera flash over the whole page (#lp-flashbang).
export function flash() {
  const el = document.getElementById('lp-flashbang');
  if (el?.animate && !reducedMotion()) {
    el.animate(
      [{ opacity: 0 }, { opacity: 0.95, offset: 0.08 }, { opacity: 0 }],
      { duration: 800, easing: 'ease-out' }
    );
  }
}
