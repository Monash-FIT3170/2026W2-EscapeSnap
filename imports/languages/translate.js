import { LOCALES, DEFAULT_LOCALE } from './index.js';

export function lookup(messages, path) {
  return path.split('.').reduce((node, key) => node?.[key], messages);
}

export function createTranslation(locale = DEFAULT_LOCALE) {
  const messages = (LOCALES[locale] || LOCALES[DEFAULT_LOCALE]).messages;
  return (path, vars) => {
    let value = lookup(messages, path);
    // Missing object detections and keys must not leak English/internal keys.
    if (typeof value !== 'string')
      value = path.startsWith('objects.')
        ? messages.extra.unknownObject
        : messages.errors.unknown;
    return value.replace(/\{(\w+)\}/g, (match, key) =>
      vars && Object.hasOwn(vars, key) ? String(vars[key]) : match
    );
  };
}

export function formatLocalizedDuration(milliseconds, locale) {
  if (!Number.isFinite(milliseconds)) return '—';
  const seconds = Math.max(0, Math.round(milliseconds / 1000));
  const unit = (value, name) =>
    new Intl.NumberFormat(locale, {
      style: 'unit',
      unit: name,
      unitDisplay: 'short',
    }).format(value);
  return seconds < 60
    ? unit(seconds, 'second')
    : `${unit(Math.floor(seconds / 60), 'minute')} ${unit(seconds % 60, 'second')}`;
}
