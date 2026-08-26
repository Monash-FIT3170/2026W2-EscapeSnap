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
const STORED_PHOTO_WIDTH = 900;
const STORED_PHOTO_QUALITY = 65;

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3-flash-preview';
const GEMINI_TIMEOUT_MS = 10_000;

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
});

Meteor.methods({
  // Returns { outcome: 'pass' | 'fail' | 'error', explanation: string }
  async 'submissions.classify'(imageBase64, targetObject) {
    console.log(
      `[submissions.classify] target="${targetObject}" size=${imageBase64?.length ?? 0} chars`
    );
    return classifyWithGemini(imageBase64, targetObject);
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
          generationConfig: { responseMimeType: 'application/json' },
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
  
  
    // Detection runs on the full-resolution buffer; only the stored copy is downscaled.
  async function compressForStorage(buf) {
    const jpeg = await sharp(buf)
      .rotate()
      .resize({ width: STORED_PHOTO_WIDTH, withoutEnlargement: true })
      .jpeg({ quality: STORED_PHOTO_QUALITY })
      .toBuffer();
    return `data:image/jpeg;base64,${jpeg.toString('base64')}`;
  }

  async function recordSubmission({ buf, roundId, targetObject, outcome, predictions }) {
    if (!roundId) return;
    const round = await Rounds.findOneAsync(roundId);
    if (!round) return;

    const photoUrl = await compressForStorage(buf);
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
      detections: predictions.map((p) => ({
        label: p.class,
        confidence: Math.min(1, Math.max(0, p.score)),
      })),
      createdAt,
      expiresAt: photoExpiryFrom(createdAt),
    });

    const kb = Math.round((photoUrl.length * 3) / 4 / 1024);
    console.log(`[EscapeSnap] submission stored round=${roundId} attempt=${priorAttempts + 1} outcome=${outcome} ~${kb}KB`);
  }
}
