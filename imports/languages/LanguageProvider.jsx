import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { LOCALES, LOCALE_CODES, DEFAULT_LOCALE } from './index';

const STORAGE_KEY = 'escapesnap.locale';

const LanguageContext = createContext(null);

function readStoredLocale() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && LOCALE_CODES.includes(stored)) return stored;
    const browser = (window.navigator.language || '').slice(0, 2);
    if (LOCALE_CODES.includes(browser)) return browser;
  } catch {
    // localStorage unavailable (private mode) — fall through to default
  }
  return DEFAULT_LOCALE;
}

// Walks a dot path like 'mobile.home.playerName' through a messages object.
function lookup(messages, path) {
  return path.split('.').reduce((node, key) => (node == null ? undefined : node[key]), messages);
}

export function LanguageProvider({ children }) {
  const [locale, setLocaleState] = useState(readStoredLocale);

  // `lang` drives font selection and screen-reader pronunciation.
  //
  // We deliberately do NOT set dir="rtl" for Arabic. Doing so mirrors every
  // flex row, which moves the header controls to the opposite side and mirrors
  // the ~12 screens that are still English. Arabic glyphs still shape and order
  // correctly inside each label via the Unicode bidi algorithm, so short UI
  // strings read fine without it.
  useEffect(() => {
    document.documentElement.setAttribute('lang', locale);
  }, [locale]);

  const setLocale = useCallback((next) => {
    if (!LOCALE_CODES.includes(next)) return;
    setLocaleState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Not persisting is fine; the choice still applies for this session.
    }
  }, []);

  // t('mobile.home.enterGame') or t('lobby.count', { n: 4 }) for {n} placeholders.
  const t = useCallback(
    (path, vars) => {
      let value = lookup(LOCALES[locale].messages, path);
      if (typeof value !== 'string') value = lookup(LOCALES[DEFAULT_LOCALE].messages, path);
      if (typeof value !== 'string') return path; // missing key shows itself
      if (!vars) return value;
      return value.replace(/\{(\w+)\}/g, (match, key) =>
        Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : match
      );
    },
    [locale]
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside <LanguageProvider>');
  return ctx;
}

export function useT() {
  return useLanguage().t;
}
