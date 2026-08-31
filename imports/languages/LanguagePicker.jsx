import { useState, useRef, useEffect } from 'react';
import { useLanguage } from './LanguageProvider';
import { LOCALES, LOCALE_CODES } from './index';
import { Flag } from './Flags';

// A fluid circular menu: the trigger is a circle showing the language currently
// in use; tapping it fans the other languages out beneath, each circle paired
// with its name. Selecting one collapses the menu back onto the new flag.
//
// `compact` shrinks it for tight mobile headers. `align` decides which side the
// names extend toward — 'right' (default) suits a top-right header placement.
export function LanguagePicker({ className = '', compact = false, align = 'right' }) {
  const { locale, setLocale, t } = useLanguage();
  const [open, setOpen] = useState(false);
  // Code of the circle currently flashing after being picked.
  const [flashing, setFlashing] = useState(null);
  const rootRef = useRef(null);
  const flashTimer = useRef(null);

  const size = compact ? 40 : 52;
  // Each circle clears the one above it by `gap`, so borders never intersect.
  const gap = compact ? 6 : 8;
  const step = size + gap;
  const flagSize = compact ? 20 : 26;

  const others = LOCALE_CODES.filter((code) => code !== locale);


  useEffect(() => {
    if (!open) return undefined;
    function onPointerDown(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    function onKeyDown(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  useEffect(() => () => clearTimeout(flashTimer.current), []);

  // Hold the red for a beat before collapsing, so the choice is visibly
  // acknowledged rather than the menu just vanishing.
  function choose(code) {
    setFlashing(code);
    flashTimer.current = setTimeout(() => {
      setLocale(code);
      setOpen(false);
      setFlashing(null);
    }, 220);
  }

  const labelSide = align === 'right' ? 'right-full mr-3' : 'left-full ml-3';

  return (
    <div
      ref={rootRef}
      data-expanded={open}
      className={`relative ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Dims the page while choosing, so the flags and their names read
          clearly over whatever screen the picker happens to sit on. Sits below
          the circles (z-30) but above page content, and clicking it closes —
          the outside-click handler ignores it because it lives inside rootRef. */}
      <div
        aria-hidden="true"
        onClick={() => setOpen(false)}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        style={{
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          zIndex: 30,
        }}
      />

      {/* Current language — always visible, doubles as the toggle */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${t('common.language')}: ${LOCALES[locale].label}`}
        className="group absolute inset-0 z-50 flex items-center justify-center overflow-hidden rounded-full border border-slate-700 bg-slate-950 shadow-lg shadow-black/50 transition-colors duration-200 will-change-transform hover:border-red-500 focus:border-red-500 focus:outline-none"
      >
        <span
          aria-hidden="true"
          className="absolute inset-0 -translate-x-full bg-red-600 transition-transform duration-300 ease-out group-hover:translate-x-0 group-focus:translate-x-0"
        />
        <span className="relative flex items-center justify-center">
          <Flag code={locale} size={flagSize} />
        </span>
      </button>

      {/* The rest, fanning out underneath */}
      <div role="menu" aria-label={t('common.language')}>
        {others.map((code, index) => (
          <div
            key={code}
            className="group absolute left-0 top-0"
            style={{
              width: size,
              height: size,
              transform: `translateY(${open ? (index + 1) * step : 0}px)`,
              opacity: open ? 1 : 0,
              pointerEvents: open ? 'auto' : 'none',
              zIndex: 40 - index,
              transition: `transform 300ms cubic-bezier(0.4, 0, 0.2, 1),
                           opacity ${open ? '300ms' : '350ms'}`,
              transitionDelay: `${open ? index * 30 : 0}ms`,
              backfaceVisibility: 'hidden',
              WebkitFontSmoothing: 'antialiased',
            }}
          >
            <button
              type="button"
              role="menuitem"
              tabIndex={open ? 0 : -1}
              onClick={() => choose(code)}
              aria-label={LOCALES[code].label}
              className={`relative flex h-full w-full items-center justify-center overflow-hidden rounded-full border bg-slate-950 shadow-lg shadow-black/50 transition-colors duration-200 will-change-transform focus:outline-none ${
                flashing === code
                  ? 'border-red-300'
                  : 'border-slate-700 hover:border-red-500 focus:border-red-500'
              }`}
            >
              {/* The wave: a red panel that slides across the circle, clipped
                  to it by overflow-hidden. Picking one drives it fully in. */}
              <span
                aria-hidden="true"
                className={`absolute inset-0 transition-transform duration-300 ease-out ${
                  flashing === code
                    ? 'translate-x-0 bg-red-500'
                    : '-translate-x-full bg-red-600 group-hover:translate-x-0 group-focus-within:translate-x-0'
                }`}
              />
              <span className="relative flex items-center justify-center">
                <Flag code={code} size={flagSize} />
              </span>
            </button>

            {/* The name, riding alongside its circle. Shown whenever the menu is
                open — not on hover, which touch devices never deliver. */}
            <span
              aria-hidden="true"
              className={`pointer-events-none absolute top-1/2 ${labelSide} -translate-y-1/2 overflow-hidden whitespace-nowrap rounded-full border bg-slate-950/95 px-3.5 py-1.5 font-mono text-xs tracking-wide text-white transition-[opacity,border-color] duration-200 ${
                flashing === code
                  ? 'border-red-300'
                  : 'border-slate-800 group-hover:border-red-500 group-focus-within:border-red-500'
              }`}
              style={{
                opacity: open ? 1 : 0,
                transitionDelay: `${open ? 120 + index * 30 : 0}ms`,
              }}
            >
              {/* Same wave as the circle, so the pair reads as one control */}
              <span
                aria-hidden="true"
                className={`absolute inset-0 transition-transform duration-300 ease-out ${
                  flashing === code
                    ? 'translate-x-0 bg-red-500'
                    : '-translate-x-full bg-red-600 group-hover:translate-x-0 group-focus-within:translate-x-0'
                }`}
              />
              <span className="relative">{LOCALES[code].label}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
