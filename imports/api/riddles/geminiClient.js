// Server-only — reads GEMINI_API_KEY from process.env; never import from imports/ui.
import {
  buildRoundRiddleRequest,
  DIFFICULTY_HINTS,
} from '/imports/api/riddles/roundRiddlePrompt';
import { gemini, modelCandidates } from '/imports/api/gemini/geminiModels';

// gemini-2.0-flash/2.5-flash return 404/zero-quota on free-tier keys as of writing;
// gemini-flash-latest is tried first, then the shared fallback list in
// geminiModels.js if it is busy or missing. Override via GEMINI_MODEL.
const RIDDLE_MODELS = modelCandidates(
  process.env.GEMINI_MODEL || 'gemini-flash-latest'
);

// Bulk generation against a large enum can exceed 15s on a cold call.
const REQUEST_TIMEOUT_MS = 30000;
const MAX_ATTEMPTS = 2;

async function callGeminiOnce(prompt, schema) {
  const { data } = await gemini.generate(
    () => ({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: schema,
      },
    }),
    { models: RIDDLE_MODELS, timeoutMs: REQUEST_TIMEOUT_MS }
  );

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned no content');
  return JSON.parse(text);
}

// Retries once on timeout — the free tier occasionally runs long on a cold request.
async function callGemini(prompt, schema) {
  let lastErr;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await callGeminiOnce(prompt, schema);
    } catch (err) {
      lastErr = err;
      const isTimeout = err?.name === 'AbortError';
      if (!isTimeout || attempt === MAX_ATTEMPTS) throw err;
      console.warn(
        `[geminiClient] Attempt ${attempt} timed out after ${REQUEST_TIMEOUT_MS}ms, retrying...`
      );
    }
  }
  throw lastErr;
}

// Generates the final "escape code" riddle. `letterCount` sets the answer's exact
// length — the caller (gamesMethods.pregenerateRiddles) clamps this to a range the
// offline fallback bank covers rather than passing totalRounds * playerCount
// directly, since rounds.createForGame wraps letter positions via modulo anyway.
const MAX_LENGTH_ATTEMPTS = 3;

export async function generateFinalRiddle({
  difficulty = 'medium',
  letterCount,
}) {
  if (!letterCount || letterCount < 1) {
    throw new Error('generateFinalRiddle requires a positive letterCount');
  }

  const schema = {
    type: 'OBJECT',
    properties: {
      riddle: {
        type: 'STRING',
        description:
          'A short riddle (1-3 sentences) whose answer is the word below.',
      },
      answer: {
        type: 'STRING',
        description: `The single-word answer to the riddle. Letters only (A-Z), no spaces, hyphens, or punctuation. Must be EXACTLY ${letterCount} letters long.`,
      },
      hint: {
        type: 'STRING',
        description:
          'A short, very easy hint (1 sentence) that makes the answer obvious, without literally stating the answer word.',
      },
    },
    required: ['riddle', 'answer', 'hint'],
  };

  const prompt = `You are writing the final "escape code" riddle for an escape-room style mobile game played
live in a university classroom.
Write one short, fun riddle (1-3 sentences) whose answer is a single common English word that is EXACTLY
${letterCount} letters long — not one letter more, not one letter fewer.
${DIFFICULTY_HINTS[difficulty] || DIFFICULTY_HINTS.medium}
The answer must be a real, common English word made only of letters A-Z (no spaces, hyphens, or punctuation).
Count the letters in your answer carefully before responding — it must be exactly ${letterCount} letters.
Also write a "hint": one short, very easy sentence that makes the answer obvious to a student, without
literally stating the answer word itself.
Be original — don't reuse a riddle you may have generated before.`;

  let lastAttempt = null;
  for (let attempt = 1; attempt <= MAX_LENGTH_ATTEMPTS; attempt++) {
    const result = await callGemini(prompt, schema);
    const answer = String(result?.answer || '')
      .toUpperCase()
      .replace(/[^A-Z]/g, '');
    lastAttempt = { riddle: result?.riddle, answer, hint: result?.hint };

    if (result?.riddle && result?.hint && answer.length === letterCount) {
      return { riddle: result.riddle, answer, hint: result.hint };
    }

    console.warn(
      `[geminiClient] Final riddle answer "${answer}" is ${answer.length} letters, expected ${letterCount}. Retrying (${attempt}/${MAX_LENGTH_ATTEMPTS})...`
    );
  }

  throw new Error(
    `Gemini could not produce a final riddle answer with exactly ${letterCount} letters after ${MAX_LENGTH_ATTEMPTS} attempts (last: ${JSON.stringify(lastAttempt)})`
  );
}

// Generates `count` round riddles. The prompt, answer schema and answer check
// come from roundRiddlePrompt.js (preset themes enum-constrain the answer to
// the theme's object pool; see imports/lib/cocoClasses.js).
export async function generateRoundRiddles({
  count,
  difficulty = 'medium',
  theme = 'classroom',
  customTheme,
  mode,
}) {
  if (!count || count < 1) return [];

  const { prompt, schema, isValidAnswer } = buildRoundRiddleRequest({
    count,
    difficulty,
    theme,
    customTheme,
    mode,
  });

  const result = await callGemini(prompt, schema);
  const riddles = Array.isArray(result?.riddles) ? result.riddles : [];

  const valid = riddles
    .filter(
      (r) =>
        r &&
        typeof r.text === 'string' &&
        typeof r.hint === 'string' &&
        isValidAnswer(r.answer)
    )
    .map((r) => ({ text: r.text, answer: r.answer.trim(), hint: r.hint }));

  if (valid.length === 0) {
    throw new Error(
      `Gemini returned no valid round riddles: ${JSON.stringify(result)}`
    );
  }

  return valid;
}
