// Server-only — reads GEMINI_API_KEY from process.env; never import from imports/ui.
import { ROUND_RIDDLE_CLASSES } from '/imports/lib/cocoClasses';

// gemini-2.0-flash/2.5-flash return 404/zero-quota on free-tier keys as of writing;
// gemini-flash-latest works. Override via GEMINI_MODEL if that changes.
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';
const GEMINI_URL = (model) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

// Bulk generation against a large enum can exceed 15s on a cold call.
const REQUEST_TIMEOUT_MS = 30000;
const MAX_ATTEMPTS = 2;

const DIFFICULTY_HINTS = {
  easy: 'Keep the wording simple and the clue very obvious.',
  medium:
    'Use a moderate level of wordplay — not too obvious, not too obscure.',
  hard: 'Use clever misdirection and less literal phrasing.',
};

async function callGeminiOnce(prompt, schema) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${GEMINI_URL(GEMINI_MODEL)}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: schema,
        },
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Gemini request failed: ${res.status} ${body}`);
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Gemini returned no content');
    return JSON.parse(text);
  } finally {
    clearTimeout(timeout);
  }
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

// Generates the final "escape code" riddle. `letterCount` is required — every
// letter a player earns must map to a real position in the answer, so its length
// must be exact (see rounds.createForGame for how letterCount is derived).
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

// Generates `count` round riddles. `answer` is enum-constrained to
// ROUND_RIDDLE_CLASSES so it's always a class the vision model can detect.
export async function generateRoundRiddles({ count, difficulty = 'medium' }) {
  if (!count || count < 1) return [];

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
              description:
                'A short riddle (1-2 sentences) describing a real-world object a player could photograph.',
            },
            answer: {
              type: 'STRING',
              enum: ROUND_RIDDLE_CLASSES,
              description:
                'The object the riddle describes. Must be exactly one of the allowed values.',
            },
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

  const prompt = `You are writing short object-finding riddles for a mobile escape-room game played live
in a university classroom. Players read a riddle, then find and photograph the real-world object it
describes — something a student would realistically have on them or nearby in that room (in their bag,
on the desk, or in the room itself). A vision model checks whether the photo matches, so the answer must
EXACTLY be one of this fixed list of object names:
${ROUND_RIDDLE_CLASSES.join(', ')}.

Write exactly ${count} riddles. Each riddle:
- Is 1-2 sentences, playful, and describes the object without naming it outright.
- Has an "answer" copied verbatim from the allowed list above (e.g. "cell phone", not "phone").
- Has a "hint": a short, very easy clue (a few words) that makes the object obvious, without literally
  naming it (e.g. for "laptop": "Something you open to browse the internet or write an essay").
- ${DIFFICULTY_HINTS[difficulty] || DIFFICULTY_HINTS.medium}
Vary the objects used across the set — don't repeat the same answer more than a couple of times.`;

  const result = await callGemini(prompt, schema);
  const riddles = Array.isArray(result?.riddles) ? result.riddles : [];

  const valid = riddles
    .filter(
      (r) =>
        r &&
        typeof r.text === 'string' &&
        typeof r.hint === 'string' &&
        ROUND_RIDDLE_CLASSES.includes(r.answer)
    )
    .map((r) => ({ text: r.text, answer: r.answer, hint: r.hint }));

  if (valid.length === 0) {
    throw new Error(
      `Gemini returned no valid round riddles: ${JSON.stringify(result)}`
    );
  }

  return valid;
}
