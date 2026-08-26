import { Meteor } from 'meteor/meteor';
import '../imports/api/games/gamesMethods';
import '../imports/api/games/gamesPublications';
import '../imports/api/players/playersMethods';
import '../imports/api/players/playersPublications';
import '../imports/api/rounds/roundsMethods';
import '../imports/api/rounds/roundsPublications';
import '../imports/api/achievements/achievementsPublications';
import '/imports/api/rounds/RoundSessions';
import '../imports/api/submissions/submissionsPublications';
import { Games } from '../imports/api/games/GamesCollection';
import { Rounds } from '../imports/api/rounds/RoundsCollection';
import { Submissions, photoExpiryFrom } from '../imports/api/submissions/SubmissionsCollection';
import { GameResults } from '../imports/api/achievements/GameResultsCollection';

const MAX_UPLOAD_CHARS = 10 * 1024 * 1024; // ~7.5MB of image data
// Mirrors the `photoUrl` max in SubmissionsCollection — kept here so an
// oversized capture is skipped with a log rather than throwing on insert.
const MAX_STORED_PHOTO_CHARS = 1500000;

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3-flash-preview';
// gemini-3-flash-preview thinks before answering, and at the default budget
// that regularly ran 3-10s and occasionally past the old 10s abort. Capping
// the thinking at 'low' puts it at ~2-5s; the timeout keeps real headroom
// over that so a slow-but-working call isn't killed mid-flight.
const GEMINI_TIMEOUT_MS = 20_000;

// Meteor's DDP (WebSocket) endpoint accepts connections from any origin by
// default - there's no traditional CORS surface here (no REST endpoints),
// but the same "only our frontend may talk to the backend" concern applies
// to DDP. Reject browser connections whose Origin isn't our own deployed
// app. Skipped in development so localhost/ngrok testing isn't affected.
Meteor.onConnection((connection) => {
  if (Meteor.isDevelopment) return;

  const origin = connection.httpHeaders?.origin;
  if (!origin) return; // non-browser DDP clients don't send an Origin header

  const allowedOrigin = Meteor.absoluteUrl().replace(/\/$/, '');
  if (origin !== allowedOrigin) {
    console.warn(`[CORS] Rejected DDP connection from unauthorized origin: ${origin}`);
    connection.close();
  }
});

Meteor.startup(async () => {
  console.log('[EscapeSnap] server ready');
  await Games.createIndexAsync({ joinCode: 1 });
  await Games.createIndexAsync({ status: 1 });
  await Rounds.createIndexAsync({ gameId: 1, roundNumber: 1 });
  await Rounds.createIndexAsync({ playerId: 1, roundNumber: 1 });
  await GameResults.createIndexAsync({ gameId: 1, playerId: 1 }, { unique: true });

  // TTL index: Mongo drops each submission once its own expiresAt passes,
  // which photoExpiryFrom sets to createdAt + PHOTO_TTL_MS (6 hours). The
  // per-document expiry lives in the field, so the lifetime is changed in
  // SubmissionsCollection, not here. Sweeps run about once a minute, so
  // deletion is shortly after expiry rather than exactly on it.
  await Submissions.createIndexAsync(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 }
  );
  await Submissions.createIndexAsync({ gameId: 1, roundId: 1 });
});

Meteor.methods({
  // Returns { outcome: 'pass' | 'fail' | 'error', explanation: string }
  async 'submissions.classify'(imageBase64, targetObject, roundId) {
    console.log(
      `[submissions.classify] target="${targetObject}" round=${roundId ?? 'none'} size=${imageBase64?.length ?? 0} chars`
    );

    if (typeof imageBase64 !== 'string' || !imageBase64) {
      return { outcome: 'error', explanation: 'No photo received.' };
    }
    if (imageBase64.length > MAX_UPLOAD_CHARS) {
      return { outcome: 'error', explanation: 'Photo is too large.' };
    }

    const result = await classifyWithGemini(imageBase64, targetObject);

    // Store every attempt, pass or fail — the end-game gallery needs the
    // misses too. A classification error is not a submission, so it is not
    // recorded. Never let a storage failure sink the player's result.
    if (result.outcome === 'pass' || result.outcome === 'fail') {
      try {
        await recordSubmission({
          imageBase64,
          roundId,
          targetObject,
          outcome: result.outcome,
        });
      } catch (err) {
        console.error('[EscapeSnap] recordSubmission failed:', err);
      }
    }

    return result;
  },
});

async function classifyWithGemini(imageBase64, targetObject) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('[Gemini] GEMINI_API_KEY is not set');
    return {
      outcome: 'error',
      explanation: 'Photo verification is not configured.',
    };
  }

  const prompt = `Does this photo clearly show a "${targetObject}"? Ignore any other objects, people, or background in the frame — only judge whether a "${targetObject}" is present. Respond with strict JSON only, no markdown: {"outcome": "pass" or "fail", "explanation": "one short sentence"}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                { inline_data: { mime_type: 'image/jpeg', data: imageBase64 } },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            thinkingConfig: { thinkingLevel: 'low' },
          },
        }),
        signal: controller.signal,
      }
    );

    if (!response.ok) {
      const body = await response.text();
      console.error(`[Gemini] HTTP ${response.status}:`, body);
      return {
        outcome: 'error',
        explanation: 'Could not verify photo — try again.',
      };
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = JSON.parse(text);

    if (parsed.outcome !== 'pass' && parsed.outcome !== 'fail') {
      throw new Error(`unexpected outcome: ${parsed.outcome}`);
    }

    return { outcome: parsed.outcome, explanation: parsed.explanation ?? '' };
  } catch (err) {
    console.error('[Gemini] classification failed:', err);
    return {
      outcome: 'error',
      explanation: 'Could not verify photo — try again.',
    };
  } finally {
    clearTimeout(timeout);
  }
}

// The capture is downscaled on the client before upload (see
// MobileRiddlePage), so what arrives is already storage-sized and is kept
// as-is. The schema wants a data URL, but the client strips the prefix to
// send Gemini bare base64 — put it back.
function toPhotoUrl(imageBase64) {
  return `data:image/jpeg;base64,${imageBase64}`;
}

async function recordSubmission({
  imageBase64,
  roundId,
  targetObject,
  outcome,
}) {
  if (!roundId) return;
  const round = await Rounds.findOneAsync(roundId);
  if (!round) return;

  const photoUrl = toPhotoUrl(imageBase64);
  if (photoUrl.length > MAX_STORED_PHOTO_CHARS) {
    console.warn(
      `[EscapeSnap] submission photo too large to store round=${roundId} ${photoUrl.length} chars`
    );
    return;
  }

  const priorAttempts = await Submissions.find({ roundId }).countAsync();
  const createdAt = new Date();

  await Submissions.insertAsync({
    gameId: round.gameId,
    playerId: round.playerId,
    roundId,
    roundNumber: round.roundNumber,
    attemptNumber: priorAttempts + 1,
    targetObject: targetObject ?? round.answer,
    outcome,
    photoUrl,
    createdAt,
    expiresAt: photoExpiryFrom(createdAt),
  });

  const kb = Math.round((photoUrl.length * 3) / 4 / 1024);
  console.log(
    `[EscapeSnap] submission stored round=${roundId} attempt=${priorAttempts + 1} outcome=${outcome} ~${kb}KB`
  );
}
