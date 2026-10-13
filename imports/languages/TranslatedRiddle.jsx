import React, { useEffect, useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { useLanguage } from './LanguageProvider';

// Key every result by source AND locale so changing either never flashes an
// earlier riddle/language. Requests cannot overwrite a newer mounted view.
export function TranslatedRiddle({ kind, id, field = 'riddle', source }) {
  const { locale, t } = useLanguage();
  const [result, setResult] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const key = JSON.stringify([kind, id, field, source, locale]);
  useEffect(() => {
    if (locale === 'en' || !id || !source) return;
    let active = true;
    Meteor.callAsync('translations.riddle', kind, id, field, locale)
      .then((text) => {
        if (active) setResult({ key, text });
      })
      .catch(() => {
        if (active) setResult({ key, error: true });
      });
    return () => {
      active = false;
    };
  }, [key, kind, id, field, source, locale, attempt]);
  if (locale === 'en') return source || t('mobile.dashboard.loadingRiddle');
  if (result?.key !== key)
    return <span role="status">{t('extra.translating')}</span>;
  if (result.error)
    return (
      <span role="alert">
        {t('extra.translationFailed')}{' '}
        <button
          type="button"
          className="underline"
          onClick={() => {
            setResult(null);
            setAttempt((n) => n + 1);
          }}
        >
          {t('mobile.dashboard.retry')}
        </button>
      </span>
    );
  return (
    <span lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      {result.text}
    </span>
  );
}
