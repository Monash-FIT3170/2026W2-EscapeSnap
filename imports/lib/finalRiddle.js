// Offline fallback final riddles — used only when live Gemini generation
// (imports/api/riddles/geminiClient.js) is unavailable or can't produce an answer of
// the exact letter count needed. That count must match totalRounds * playerCount
// exactly, or not every collected letter maps to a real position in the answer (see
// assignLetters() in imports/api/rounds/roundsMethods.js) — so this bank is keyed by
// answer length, not just a single static riddle.
const FINAL_RIDDLE_BANK = [
  {
    riddle:
      'I have cities, but no houses live there. I have mountains, but no trees grow there. I have water, but no fish swim there. I have roads, but no cars drive there. What am I?',
    answer: 'MAP',
  },
  {
    riddle:
      'I have pages but I am not a diary, and a spine but no bones. What am I?',
    answer: 'BOOK',
  },
  {
    riddle:
      'I have four legs but I never walk, and you rest your things on my back. What am I?',
    answer: 'TABLE',
  },
  {
    riddle:
      'I fold shut but I never sleep, and I open up to a glowing screen. What am I?',
    answer: 'LAPTOP',
  },
  {
    riddle:
      'I stand at the front of the room and ask the questions, but I already know the answers. What am I?',
    answer: 'TEACHER',
  },
  {
    riddle:
      'I ride on your shoulders and hold everything you need for class. What am I?',
    answer: 'BACKPACK',
  },
  {
    riddle:
      'I am full of desks and chairs, and I am where lessons happen every day. What am I?',
    answer: 'CLASSROOM',
  },
  {
    riddle:
      'I hang at the front of the room, covered in marker until someone wipes me clean. What am I?',
    answer: 'WHITEBOARD',
  },
  {
    riddle:
      'I am the process of working out a problem, though I am not a calculator myself. What am I?',
    answer: 'CALCULATION',
  },
  {
    riddle:
      'I am what you deliver at the front of the class, complete with slides and nerves. What am I?',
    answer: 'PRESENTATION',
  },
];

// Picks a fallback riddle whose answer is exactly `letterCount` letters long — this
// covers the realistic in-app range (totalRounds is fixed at 3, capacity is 1-4, so
// letterCount is 3/6/9/12, all present above). Falls back to the closest available
// length if there's genuinely no exact match, which only happens if Gemini AND every
// retry have already failed and someone changed totalRounds/capacity outside the UI.
export function getFallbackFinalRiddle(letterCount) {
  const exact = FINAL_RIDDLE_BANK.filter(
    (r) => r.answer.length === letterCount
  );
  if (exact.length > 0) {
    return exact[Math.floor(Math.random() * exact.length)];
  }

  console.warn(
    `[finalRiddle] No fallback riddle with exactly ${letterCount} letters — using the closest available length instead.`
  );
  return [...FINAL_RIDDLE_BANK].sort(
    (a, b) =>
      Math.abs(a.answer.length - letterCount) -
      Math.abs(b.answer.length - letterCount)
  )[0];
}

// A single static riddle for use as an initial placeholder at game creation time,
// before the real player count (and therefore the real letterCount) is known.
// Always overwritten by rounds.createForGame once the game actually starts.
export const FINAL_RIDDLE = FINAL_RIDDLE_BANK[0];
