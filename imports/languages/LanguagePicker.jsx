import React, { useState, useRef, useEffect } from 'react';
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
  const rootRef = useRef(null);

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

  function choose(code) {
    setLocale(code);
    setOpen(false);
  }

  const labelSide = align === 'right' ? 'right-full mr-3' : 'left-full ml-3';

  return (
    <div
      ref={rootRef}
      data-expanded={open}
      className={`relative ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Current language — always visible, doubles as the toggle */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${t('common.language')}: ${LOCALES[locale].label}`}
        className="absolute inset-0 z-50 flex items-center justify-center rounded-full border border-slate-700 bg-slate-950 shadow-lg shadow-black/50 transition-colors duration-200 will-change-transform hover:border-red-500/70 focus:border-red-500/70 focus:outline-none"
      >
        <Flag code={locale} size={flagSize} />
      </button>

      {/* The rest, fanning out underneath */}
      <div role="menu" aria-label={t('common.language')}>
        {others.map((code, index) => (
          <div
            key={code}
            className="absolute left-0 top-0"
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
              className="flex h-full w-full items-center justify-center rounded-full border border-slate-700 bg-slate-950 shadow-lg shadow-black/50 transition-colors duration-200 will-change-transform hover:border-red-500/70 hover:bg-red-950/40 focus:border-red-500/70 focus:outline-none"
            >
              <Flag code={code} size={flagSize} />
            </button>

            {/* The name, riding alongside its circle. Shown whenever the menu is
                open — not on hover, which touch devices never deliver. */}
            <span
              aria-hidden="true"
              className={`pointer-events-none absolute top-1/2 ${labelSide} -translate-y-1/2 whitespace-nowrap border border-slate-800 bg-slate-950/95 px-2.5 py-1 font-mono text-xs tracking-wide text-white transition-opacity duration-200`}
              style={{
                opacity: open ? 1 : 0,
                transitionDelay: `${open ? 120 + index * 30 : 0}ms`,
              }}
            >
              {LOCALES[code].label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
