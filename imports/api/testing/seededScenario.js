// Fixed fixtures shared by unit and Meteor tests; no live AI or random riddles.
export const SEED_TIME = new Date('2026-09-15T00:00:00.000Z');
export const SEEDED_RIDDLE = Object.freeze({
  text: 'I hold your drink and have a handle. What am I?',
  answer: 'cup',
  hint: 'Look beside the kettle.',
});
export const SEEDED_FINAL_RIDDLE = Object.freeze({
  riddle: 'I open a lock. What am I?',
  answer: 'KEY',
  hint: 'Look on your keyring.',
});
export function geminiResponse(value) {
  return {
    ok: true,
    json: async () => ({
      candidates: [{ content: { parts: [{ text: JSON.stringify(value) }] } }],
    }),
  };
}
