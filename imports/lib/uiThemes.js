// Selectable skins for the app's own interface. Each key has a matching
// [data-ui-theme] block in client/main.css; the display name is the locale key
// common.themes.<key>. Named "UI theme" throughout because a game's `theme` is
// its riddle setting. Lives in lib so the Games schema can validate against it.
export const UI_THEMES = [
  'dossier',
  'terminal',
  'blueprint',
  'daylight',
  'contrast',
];
export const DEFAULT_UI_THEME = 'dossier';
