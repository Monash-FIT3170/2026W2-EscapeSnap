// Builds the Gemini request for round riddles. Pure (no Meteor, no network) so
// the prompt rules can be unit tested; geminiClient.js sends it.
import { THEME_OBJECT_POOLS } from '../../lib/cocoClasses.js';
import { normalizeAnswerMode } from '../../lib/answerModes.js';
import { CUSTOM_THEME } from '../../lib/customTheme.js';

export const DIFFICULTY_HINTS = {
  easy: 'Keep the wording simple and the clue very obvious.',
  medium:
    'Use a moderate level of wordplay — not too obvious, not too obscure.',
  hard: 'Use clever misdirection and less literal phrasing.',
};

const THEME_SETTINGS = {
  classroom: {
    label: 'a university classroom',
    findWhere:
      'something a student would realistically have on them or nearby in that room (in their bag, on the desk, or in the room itself)',
  },
  home: {
    label: "a player's home",
    findWhere:
      'something realistically found around a home (kitchen, living room, or bedroom)',
  },
};

// What drawing-mode answers should relate to for each preset theme. A sketch
// doesn't need the thing to be nearby, so answers aren't limited to the pool.
const DRAWING_THEME_WORLDS = {
  classroom: 'a classroom or school',
  home: 'a home',
};

// A custom theme is played wherever the players are, so camera-mode answers
// come from the classroom pool — things people carry or have nearby anywhere.
const CUSTOM_SETTINGS = {
  label: 'whatever room the players are in',
  findWhere:
    'something a player would realistically have on them or nearby (in their bag, on a desk, or in the room)',
};
const DRAWING_FIND_WHERE =
  'it does not need to be nearby, only recognisable when sketched';

// Free-form drawing answers are object names, not descriptions.
const MAX_FREE_ANSWER_LENGTH = 30;

// What the player does with the riddle's answer. Only the wording differs —
// the answer pool is the same, so a sketch is checked against the same objects.
const ANSWER_ACTIONS = {
  camera: {
    riddleDescription:
      'A short riddle (1-2 sentences) describing a real-world object a player could photograph.',
    playerTask: 'find and photograph the real-world object it describes',
    checked: 'the photo',
  },
  drawing: {
    riddleDescription:
      'A short riddle (1-2 sentences) describing a real-world object a player could draw as a quick sketch.',
    playerTask: 'draw a quick sketch of the real-world object it describes',
    checked: 'the sketch',
  },
};

// Returns { prompt, schema, isValidAnswer }. Camera mode enum-constrains
// `answer` to an object pool players can actually find (a custom theme only
// flavours the wording). Drawing mode lets the answer be anything drawable
// that fits the theme, since a sketch doesn't need the thing to be nearby.
export function buildRoundRiddleRequest({
  count,
  difficulty = 'medium',
  theme = 'classroom',
  customTheme,
  mode,
}) {
  const answerMode = normalizeAnswerMode(mode);
  const isCustom = theme === CUSTOM_THEME && Boolean(customTheme);
  const freeAnswers = answerMode === 'drawing';

  const objectPool = THEME_OBJECT_POOLS[theme] || THEME_OBJECT_POOLS.classroom;
  let settings = THEME_SETTINGS[theme] || THEME_SETTINGS.classroom;
  if (isCustom) settings = CUSTOM_SETTINGS;
  if (freeAnswers) settings = { ...settings, findWhere: DRAWING_FIND_WHERE };
  const drawingWorld = isCustom
    ? `the world of "${customTheme}"`
    : DRAWING_THEME_WORLDS[theme] || DRAWING_THEME_WORLDS.classroom;
  const action = ANSWER_ACTIONS[answerMode];

  const answerSchema = freeAnswers
    ? {
        type: 'STRING',
        description:
          'The object the riddle describes: its short name only, 1-2 words, lowercase.',
      }
    : {
        type: 'STRING',
        enum: objectPool,
        description:
          'The object the riddle describes. Must be exactly one of the allowed values.',
      };

  const schema = {
    type: 'OBJECT',
    properties: {
      riddles: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            text: {
              type: 'STRING',
              description: action.riddleDescription,
            },
            answer: answerSchema,
            hint: {
              type: 'STRING',
              description:
                'A short, very easy hint (a few words) that makes the object obvious, without literally naming it.',
            },
          },
          required: ['text', 'answer', 'hint'],
        },
      },
    },
    required: ['riddles'],
  };

  const answerRule = freeAnswers
    ? `A vision model checks whether ${action.checked} matches the answer, so every answer must be a simple,
recognisable thing (1-2 words) — an object, animal, food or similar — that is clearly
connected to ${drawingWorld} and can be sketched in under a minute.`
    : `A vision model checks whether ${action.checked} matches, so the answer must EXACTLY be one
of this fixed list of object names:
${objectPool.join(', ')}.`;

  const answerFormat = freeAnswers
    ? 'Has an "answer" that is just the object\'s short name (e.g. "wand", not "a magic wand made of holly").'
    : 'Has an "answer" copied verbatim from the allowed list above (e.g. "cell phone", not "phone").';

  let themeRule = '';
  if (isCustom) {
    themeRule = freeAnswers
      ? `\n- Is written in the style and world of "${customTheme}".`
      : `\n- Is written in the style and world of "${customTheme}" — describe the everyday object as if it
  belonged there (the answer is still the plain object name from the list).`;
  }

  const prompt = `You are writing short object-finding riddles for a mobile escape-room game played live in
${settings.label}. Players read a riddle, then ${action.playerTask} —
${settings.findWhere}. ${answerRule}

Write exactly ${count} riddles. Each riddle:
- Is 1-2 sentences, playful, and describes the object without naming it outright.
- ${answerFormat}
- Has a "hint": a short, very easy clue (a few words) that makes the object obvious, without literally
  naming it (e.g. for "laptop": "Something you open to browse the internet or write an essay").${themeRule}
- ${DIFFICULTY_HINTS[difficulty] || DIFFICULTY_HINTS.medium}
Vary the objects used across the set — don't repeat the same answer more than a couple of times.`;

  const isValidAnswer = freeAnswers
    ? (answer) =>
        typeof answer === 'string' &&
        answer.trim().length > 0 &&
        answer.trim().length <= MAX_FREE_ANSWER_LENGTH
    : (answer) => objectPool.includes(answer);

  return { prompt, schema, isValidAnswer };
}
