// Offline fallback final riddles, keyed by answer length. gamesMethods.js clamps
// the requested length to this bank's 3-12 letter range rather than asking for
// totalRounds * playerCount letters directly — rounds.createForGame's assignLetters
// wraps letter positions via modulo when there are more player-rounds than letters,
// so a shorter word works fine and this bank always has an exact-length match.
const FINAL_RIDDLE_BANK = [
  {
    riddle:
      'I have cities, but no houses live there. I have mountains, but no trees grow there. I have water, but no fish swim there. I have roads, but no cars drive there. What am I?',
    hint: 'Something that shows you where places are.',
    answer: 'MAP',
  },
  {
    riddle:
      'I have pages but I am not a diary, and a spine but no bones. What am I?',
    hint: 'Something with pages that you read.',
    answer: 'BOOK',
  },
  {
    riddle:
      'I have four legs but I never walk, and you rest your things on my back. What am I?',
    hint: 'Furniture you put things on top of.',
    answer: 'TABLE',
  },
  {
    riddle:
      'I fold shut but I never sleep, and I open up to a glowing screen. What am I?',
    hint: 'A computer you can carry around and open like a book.',
    answer: 'LAPTOP',
  },
  {
    riddle:
      'I stand at the front of the room and ask the questions, but I already know the answers. What am I?',
    hint: 'The person who leads the class.',
    answer: 'TEACHER',
  },
  {
    riddle:
      'I ride on your shoulders and hold everything you need for class. What am I?',
    hint: 'What students carry their things in.',
    answer: 'BACKPACK',
  },
  {
    riddle:
      'I am full of desks and chairs, and I am where lessons happen every day. What am I?',
    hint: 'The room where lessons happen.',
    answer: 'CLASSROOM',
  },
  {
    riddle:
      'I hang at the front of the room, covered in marker until someone wipes me clean. What am I?',
    hint: 'What a teacher writes on at the front of the room.',
    answer: 'WHITEBOARD',
  },
  {
    riddle:
      'I am the process of working out a problem, though I am not a calculator myself. What am I?',
    hint: 'What you do when solving a math problem.',
    answer: 'CALCULATION',
  },
  {
    riddle:
      'I am what you deliver at the front of the class, complete with slides and nerves. What am I?',
    hint: 'What you give in front of the class with slides.',
    answer: 'PRESENTATION',
  },
];

// Returns a riddle with an exact-length answer, or the closest available length if
// there's no exact match (only possible if Gemini and every retry already failed).
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

// Placeholder used at game creation, before player count is known.
export const FINAL_RIDDLE = FINAL_RIDDLE_BANK[0];
