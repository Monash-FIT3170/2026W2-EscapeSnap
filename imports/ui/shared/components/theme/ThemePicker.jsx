import React, { useState, useRef, useEffect } from 'react';
import { useT } from '../../../../languages/LanguageProvider';
import { useUiTheme } from './UiThemeProvider';
import { UI_THEMES } from '../../theme';

// Header button that drops a list of skins beneath it. Each row carries its own
// data-ui-theme, so its swatch renders in that skin's colours whichever one is
// currently applied to the page.
export function ThemePicker({ className = '' }) {
  const t = useT();
  const { uiTheme, setUiTheme } = useUiTheme();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    function onPointerDown(e) {
      if (rootRef.current && !rootRef.current.contains(e.target))
        setOpen(false);
    }
    function onKeyDown(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`relative flex-shrink-0 ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${t('common.theme')}: ${t(`common.themes.${uiTheme}`)}`}
        className={`flex h-11 w-11 items-center justify-center border transition ${
          open ? 'border-brand' : 'border-line active:border-muted'
        }`}
      >
        {/* Half-filled disc: the usual "appearance" glyph. */}
        <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true">
          <path d="M10 2a8 8 0 0 1 0 16Z" className="fill-brand" />
          <circle
            cx="10"
            cy="10"
            r="8"
            fill="none"
            strokeWidth="1.5"
            className="stroke-ink"
          />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          aria-label={t('common.theme')}
          className="absolute right-0 top-full z-50 mt-2 w-52 border border-line bg-panel p-1 shadow-lg shadow-black/50"
        >
          {UI_THEMES.map((key) => {
            const active = key === uiTheme;
            return (
              <button
                key={key}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => {
                  setUiTheme(key);
                  setOpen(false);
                }}
                className={`flex min-h-[44px] w-full items-center gap-3 border px-2 text-left transition ${
                  active
                    ? 'border-brand'
                    : 'border-transparent active:border-line'
                }`}
              >
                <span
                  data-ui-theme={key}
                  aria-hidden="true"
                  className="flex h-7 w-10 flex-shrink-0 items-end gap-1 border border-line bg-ground p-1"
                >
                  <span className="h-full w-2 bg-brand" />
                  <span className="h-1 flex-1 bg-ink" />
                </span>
                <span className="min-w-0 flex-1 truncate font-mono text-[11px] font-semibold uppercase tracking-[0.15em] text-ink">
                  {t(`common.themes.${key}`)}
                </span>
                {active && (
                  <span className="font-mono text-xs text-ink">✓</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
