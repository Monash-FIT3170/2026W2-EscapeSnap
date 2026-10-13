import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from 'react';
import { LOCALE_CODES, DEFAULT_LOCALE } from './index';
import { createTranslation } from './translate';

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

export function LanguageProvider({ children }) {
  const [locale, setLocaleState] = useState(readStoredLocale);

  useEffect(() => {
    document.documentElement.setAttribute('lang', locale);
    document.documentElement.setAttribute(
      'dir',
      locale === 'ar' ? 'rtl' : 'ltr'
    );
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

  const t = useMemo(() => createTranslation(locale), [locale]);

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx)
    throw new Error('useLanguage must be used inside <LanguageProvider>');
  return ctx;
}

export function useT() {
  return useLanguage().t;
}
