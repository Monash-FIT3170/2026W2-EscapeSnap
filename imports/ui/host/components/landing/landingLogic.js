// The rules behind the landing page's two forms, kept free of React and Meteor
// so they can be tested on their own.

export const ROOM_CODE_LENGTH = 4;
export const NAME_MAX_LENGTH = 24; // same cap as PlayerHome

// Digits only, capped at four, so typing, pasting "48 21" and a phone's number
// pad all end up the same.
export function cleanRoomCode(value) {
  return String(value ?? '')
    .replace(/\D/g, '')
    .slice(0, ROOM_CODE_LENGTH);
}

export function isValidRoomCode(value) {
  return /^\d{4}$/.test(value);
}

// What stops the keypad from joining, in the order the fields appear on it:
// 'name', 'code', or null when both are fine.
export function joinProblem(name, code) {
  if (!String(name ?? '').trim()) return 'name';
  if (!isValidRoomCode(code)) return 'code';
  return null;
}

// The demo riddle's answer. Riddles stay in English in every locale, so this
// is compared in English too.
export const DEMO_ANSWER = 'DOOR';

// Accepts "door", "a door" or "the door" in any case, ignoring punctuation and
// extra spaces.
export function normaliseAnswer(value) {
  return String(value ?? '')
    .toUpperCase()
    .replace(/[^A-Z ]/g, '')
    .trim()
    .replace(/^(A|AN|THE)\s+/, '')
    .replace(/\s+/g, '');
}

export function isDemoAnswer(value) {
  return normaliseAnswer(value) === DEMO_ANSWER;
}

// 75000 -> "1:15". Never reports less than a second.
export function formatDuration(ms) {
  const s = Math.max(1, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
