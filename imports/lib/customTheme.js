// A host-typed riddle theme ("OTHER" on the create-game screen). The text is
// dropped into a quoted Gemini prompt, so quote marks, backticks and line
// breaks are stripped to keep it a single short phrase inside those quotes.
export const CUSTOM_THEME = 'custom';
export const CUSTOM_THEME_MAX_LENGTH = 40;

export function normalizeCustomTheme(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/["`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, CUSTOM_THEME_MAX_LENGTH)
    .trim();
}
