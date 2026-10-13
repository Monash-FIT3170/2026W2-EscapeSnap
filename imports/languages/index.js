import { en } from './locales/en.js';
import { es } from './locales/es.js';
import { fr } from './locales/fr.js';
import { hi } from './locales/hi.js';
import { id } from './locales/id.js';
import { zh } from './locales/zh.js';
import { ar } from './locales/ar.js';

export const DEFAULT_LOCALE = 'en';

// Add a locale here (plus a flag in Flags.jsx) and the picker updates itself.
// `label` is written in the language itself, as is convention for language pickers.
export const LOCALES = {
  en: { label: 'English', messages: en },
  es: { label: 'Español', messages: es },
  fr: { label: 'Français', messages: fr },
  hi: { label: 'हिन्दी', messages: hi },
  id: { label: 'Bahasa Indonesia', messages: id },
  zh: { label: '简体中文', messages: zh },
  ar: { label: 'العربية', messages: ar },
};

export const LOCALE_CODES = Object.keys(LOCALES);
