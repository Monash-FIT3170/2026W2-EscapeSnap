// Server methods throw Meteor.Error(code, reason). The `reason` is written in
// English on the server, which has no idea what language the client picked — so
// showing err.reason directly is what left these messages untranslated.
//
// Map the stable `code` to a translation key instead, and never fall back to
// the raw reason in the UI.
const CODE_TO_KEY = {
  'not-found': 'errors.notFound',
  'invalid-state': 'errors.invalidState',
  invalid: 'errors.unknown',
  'no-session': 'errors.noSession',
  expired: 'errors.expired',
  'no-riddle': 'errors.noRiddle',
  full: 'errors.full',
  'no-players': 'errors.noPlayers',
  timeout: 'errors.timeout',
};

// `overrides` lets a call site give a code a more specific meaning — 'not-found'
// means "game not found" when starting a game, but "not found or already
// started" when joining one.
export function errorKey(err, overrides = {}) {
  const code = err && err.error;
  return overrides[code] || CODE_TO_KEY[code] || 'errors.unknown';
}
