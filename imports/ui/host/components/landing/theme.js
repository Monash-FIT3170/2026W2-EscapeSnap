// Landing-page palette, in the spirit of imports/ui/mobile/theme.js but with two
// deliberate differences.
//
// DIM is #8a8886 (5.5:1 on BG) rather than the #555 used elsewhere in the host
// pages, which sits at 2.6:1 and fails WCAG AA.
//
// RED is a fill and a border only, never a text colour, because it reads 1.9:1
// on BG. Accent labels carry the 4px red bar from SectionHeader instead, which
// only has to clear the 3:1 non-text threshold.
export const BG = '#0e0e0e';
export const PANEL = '#141313';
export const LINE = '#353534';
export const INK = '#e5e2e1';
export const MUTED = '#aa8984';
export const DIM = '#8a8886';
export const RED = '#8b0000';
export const RED_HOVER = '#a50000';
export const BRAND = '#c81e1e'; // 3.67:1, so display-size wordmark and the status dot only
export const ALERT = '#ef4444'; // the project's "incorrect" red, 4.9:1 on PANEL, safe for small text
export const TILE = '#1c0000'; // fill behind a recovered letter

// Shared shapes, so every card on the page keeps one silhouette.
export const CARD = { background: PANEL, border: `1px solid ${LINE}` };
export const LABEL = { letterSpacing: '2px', color: MUTED };
