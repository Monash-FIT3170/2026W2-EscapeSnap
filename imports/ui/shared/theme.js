// The palette lives in client/main.css as --es-* custom properties so it can be
// swapped at runtime; these mirror the Tailwind colour names (bg-ground,
// text-ink, ...) registered in client/main.html, for use in inline styles.
const token = (name) => `rgb(var(--es-${name}))`;

export const COLORS = {
  // Surfaces, darkest to lightest.
  ground: token('ground'),
  panel: token('panel'),
  line: token('line'),

  // Type.
  ink: token('ink'),
  muted: token('muted'),
  dim: token('dim'),

  // Accents.
  brand: token('brand'),
  brandBright: token('brand-bright'),
  onBrand: token('on-brand'),
  correct: token('correct'),
  incorrect: token('incorrect'),
  warn: token('warn'),
};
