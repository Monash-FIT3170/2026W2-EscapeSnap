import React, { useState, useRef, useEffect } from 'react';
import { useT } from '../../../../languages/LanguageProvider';
import { useUiTheme } from './UiThemeProvider';
import { UI_THEMES } from '/imports/lib/uiThemes';

// A theme's colours as a small disc: its accent on the left, its background on
// the right, ringed in its text colour. data-ui-theme makes the disc draw in
// that theme whatever theme the page is in.
function ThemeSwatch({ themeKey, size }) {
  return (
    <span
      data-ui-theme={themeKey}
      aria-hidden="true"
      className="flex overflow-hidden rounded-full border-2 border-ink"
      style={{ width: size, height: size }}
    >
      <span className="h-full w-1/2 bg-brand" />
      <span className="h-full w-1/2 bg-ground" />
    </span>
  );
}

// Works like LanguagePicker: the trigger is a circle showing the theme in use;
// tapping it dims the page and fans the other themes out beneath, each circle
// paired with its name. Each one previews itself: its wave and hover outline
// are in that theme's own accent. Picking one flashes it, then the whole app
// switches.
//
// `compact` shrinks it for tight mobile headers. `align` decides which side the
// names extend toward. `chipClassName` swaps the circle trigger for a chip
// styled by the caller (the landing page's top bar); the menu is unchanged.
export function ThemePicker({
  className = '',
  compact = false,
  align = 'right',
  chipClassName,
}) {
  const t = useT();
  const { uiTheme, setUiTheme } = useUiTheme();
  const [open, setOpen] = useState(false);
  // Theme whose circle is flashing after being picked.
  const [flashing, setFlashing] = useState(null);
  const rootRef = useRef(null);
  const flashTimer = useRef(null);

  const chip = Boolean(chipClassName);
  const size = chip ? 44 : compact ? 40 : 52;
  // Each circle clears the one above it by `gap`, so borders never intersect.
  const gap = compact || chip ? 6 : 8;
  const step = size + gap;
  const swatchSize = chip ? 18 : compact ? 20 : 26;
  const triggerProps = {
    type: 'button',
    onClick: () => setOpen((v) => !v),
    'aria-haspopup': 'menu',
    'aria-expanded': open,
    'aria-label': `${t('common.theme')}: ${t(`common.themes.${uiTheme}`)}`,
  };

  const others = UI_THEMES.filter((key) => key !== uiTheme);

  useEffect(() => {
    if (!open) return undefined;
    function onPointerDown(e) {
      if (rootRef.current && !rootRef.current.contains(e.target))
        setOpen(false);
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

  // Hold the flash for a beat before collapsing, so the choice is visibly
  // acknowledged rather than the menu just vanishing.
  function choose(key) {
    setFlashing(key);
    flashTimer.current = setTimeout(() => {
      setUiTheme(key);
      setOpen(false);
      setFlashing(null);
    }, 220);
  }

  const labelSide = align === 'right' ? 'right-full mr-3' : 'left-full ml-3';

  return (
    <div
      ref={rootRef}
      data-expanded={open}
      className={`relative flex-shrink-0 ${className}`}
      // A chip sizes itself; the circle trigger needs the box.
      style={chip ? undefined : { width: size, height: size }}
    >
      {/* Dims the page while choosing, so the themes read clearly over
          whatever screen the picker sits on. Clicking it closes the menu. */}
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

      {/* Current theme — always visible, doubles as the toggle */}
      {chip ? (
        <button
          {...triggerProps}
          className={`relative z-50 flex items-center justify-center ${chipClassName}`}
        >
          <ThemeSwatch themeKey={uiTheme} size={swatchSize} />
        </button>
      ) : (
        <button
          {...triggerProps}
          className="group absolute inset-0 z-50 flex items-center justify-center overflow-hidden rounded-full border border-line bg-ground shadow-lg shadow-black/50 transition-colors duration-200 will-change-transform hover:border-brand focus:border-brand focus:outline-none"
        >
          <span
            aria-hidden="true"
            className="absolute inset-0 -translate-x-full bg-brand transition-transform duration-300 ease-out group-hover:translate-x-0 group-focus:translate-x-0"
          />
          <span className="relative flex items-center justify-center">
            <ThemeSwatch themeKey={uiTheme} size={swatchSize} />
          </span>
        </button>
      )}

      {/* The rest, fanning out underneath. Each row carries its own theme. */}
      <div role="menu" aria-label={t('common.theme')}>
        {others.map((key, index) => (
          <div
            key={key}
            data-ui-theme={key}
            className="group absolute left-0 top-0"
            style={{
              width: size,
              height: size,
              // Centred under a chip, whose width varies.
              ...(chip && { left: '50%', marginLeft: -size / 2 }),
              transform: `translateY(${open ? (index + 1) * step : 0}px)`,
              opacity: open ? 1 : 0,
              pointerEvents: open ? 'auto' : 'none',
              zIndex: 40 - index,
              transition: `transform 300ms cubic-bezier(0.4, 0, 0.2, 1) ${open ? index * 30 : 0}ms,
                           opacity ${open ? '300ms' : '350ms'} ${open ? index * 30 : 0}ms`,
              backfaceVisibility: 'hidden',
              WebkitFontSmoothing: 'antialiased',
            }}
          >
            <button
              type="button"
              role="menuitem"
              tabIndex={open ? 0 : -1}
              onClick={() => choose(key)}
              aria-label={t(`common.themes.${key}`)}
              className={`relative flex h-full w-full items-center justify-center overflow-hidden rounded-full border bg-ground shadow-lg shadow-black/50 transition-colors duration-200 will-change-transform focus:outline-none ${
                flashing === key
                  ? 'border-ink'
                  : 'border-line hover:border-brand focus:border-brand'
              }`}
            >
              {/* The wave, in this theme's accent. Picking one drives it in. */}
              <span
                aria-hidden="true"
                className={`absolute inset-0 bg-brand transition-transform duration-300 ease-out ${
                  flashing === key
                    ? 'translate-x-0'
                    : '-translate-x-full group-hover:translate-x-0 group-focus-within:translate-x-0'
                }`}
              />
              <span className="relative flex items-center justify-center">
                <ThemeSwatch themeKey={key} size={swatchSize} />
              </span>
            </button>

            {/* The name, riding alongside its circle. Shown whenever the menu
                is open — not on hover, which touch devices never deliver. */}
            <span
              aria-hidden="true"
              className={`pointer-events-none absolute top-1/2 ${labelSide} -translate-y-1/2 overflow-hidden whitespace-nowrap rounded-full border bg-ground/95 px-3.5 py-1.5 font-display text-sm tracking-wide transition-[opacity,border-color,color] duration-200 ${
                flashing === key
                  ? 'border-ink text-on-brand'
                  : 'border-line text-ink group-hover:border-brand group-hover:text-on-brand group-focus-within:border-brand group-focus-within:text-on-brand'
              }`}
              style={{
                opacity: open ? 1 : 0,
                transitionDelay: `${open ? 120 + index * 30 : 0}ms`,
              }}
            >
              {/* Same wave as the circle, so the pair reads as one control */}
              <span
                aria-hidden="true"
                className={`absolute inset-0 bg-brand transition-transform duration-300 ease-out ${
                  flashing === key
                    ? 'translate-x-0'
                    : '-translate-x-full group-hover:translate-x-0 group-focus-within:translate-x-0'
                }`}
              />
              <span className="relative">{t(`common.themes.${key}`)}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
