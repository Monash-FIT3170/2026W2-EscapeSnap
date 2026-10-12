import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
import { UI_THEMES, DEFAULT_UI_THEME } from '../../theme';

const STORAGE_KEY = 'escapesnap.uiTheme';

const UiThemeContext = createContext(null);

function readStoredUiTheme() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && UI_THEMES.includes(stored)) return stored;
  } catch {
    // localStorage unavailable (private mode) — fall through to default
  }
  return DEFAULT_UI_THEME;
}

// Wraps the whole app, host and player screens alike. The attribute goes on
// <html> rather than a wrapper div so the page background behind the app
// (overscroll, safe areas) follows the skin too.
export function UiThemeProvider({ children }) {
  const [uiTheme, setUiThemeState] = useState(readStoredUiTheme);

  // Layout effect, so a stored skin is in place before the first paint.
  useLayoutEffect(() => {
    document.documentElement.setAttribute('data-ui-theme', uiTheme);
  }, [uiTheme]);

  const setUiTheme = useCallback((next) => {
    if (!UI_THEMES.includes(next)) return;
    setUiThemeState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Not persisting is fine; the choice still applies for this session.
    }
  }, []);

  const value = useMemo(() => ({ uiTheme, setUiTheme }), [uiTheme, setUiTheme]);

  return (
    <UiThemeContext.Provider value={value}>{children}</UiThemeContext.Provider>
  );
}

export function useUiTheme() {
  const ctx = useContext(UiThemeContext);
  if (!ctx) throw new Error('useUiTheme must be used inside <UiThemeProvider>');
  return ctx;
}
