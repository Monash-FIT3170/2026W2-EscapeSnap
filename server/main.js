import { Meteor } from 'meteor/meteor';
import '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import sharp from 'sharp';
import '../imports/api/games/gamesMethods';
import '../imports/api/games/gamesPublications';
import '../imports/api/players/playersMethods';
import '../imports/api/players/playersPublications';
import '../imports/api/rounds/roundsMethods';
import '../imports/api/rounds/roundsPublications';
import '/imports/api/rounds/RoundSessions';
import { Games } from '../imports/api/games/GamesCollection';
import { Rounds } from '../imports/api/rounds/RoundsCollection';
import { Submissions, photoExpiryFrom } from '../imports/api/submissions/SubmissionsCollection';

const MAX_UPLOAD_CHARS = 10 * 1024 * 1024; // ~7.5MB of image data
const STORED_PHOTO_WIDTH = 900;
const STORED_PHOTO_QUALITY = 65;

let detectionModel = null;
let modelLoadPromise = null;

function ensureModel() {
  if (detectionModel) return Promise.resolve(detectionModel);
  if (modelLoadPromise) return modelLoadPromise;
  modelLoadPromise = cocoSsd.load().then((m) => {
    detectionModel = m;
    console.log('[EscapeSnap] COCO-SSD ready');
    return m;
  });
  return modelLoadPromise;
}

Meteor.startup(async () => {
  console.log('[EscapeSnap] server ready — warming COCO-SSD');
  ensureModel().catch((err) => console.error('[EscapeSnap] model load failed:', err));
  await Games.createIndexAsync({ joinCode: 1 });
  await Games.createIndexAsync({ status: 1 });
  await Rounds.createIndexAsync({ gameId: 1, roundNumber: 1 });
  await Rounds.createIndexAsync({ playerId: 1, roundNumber: 1 });
  await Submissions.createIndexAsync({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await Submissions.createIndexAsync({ gameId: 1, roundNumber: 1, playerId: 1 });
  await Submissions.createIndexAsync({ roundId: 1, attemptNumber: 1 });
});

Meteor.methods({
  async 'submissions.detect'(imageBase64, targetObject, roundId) {
    if (typeof imageBase64 !== 'string' || imageBase64.length === 0) {
      throw new Meteor.Error('invalid-image', 'No image data supplied');
    }
    if (imageBase64.length > MAX_UPLOAD_CHARS) {
      throw new Meteor.Error('image-too-large', 'Image exceeds the maximum upload size');
    }

    const model = await ensureModel();
    const buf = Buffer.from(imageBase64, 'base64');
    const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const pixelData = { data: new Uint8Array(data.buffer), width: info.width, height: info.height };
    const predictions = await model.detect(pixelData);
    console.log(`[COCO-SSD] target="${targetObject}" detections:`, predictions.map(p => `${p.class} (${(p.score * 100).toFixed(1)}%)`));
    const outcome = evaluatePredictions(predictions, targetObject);

    // Record every attempt, pass or fail. Never let this break the capture flow.
    try {
      await recordSubmission({ buf, roundId, targetObject, outcome, predictions });
    } catch (err) {
      console.error('[EscapeSnap] submission not recorded:', err);
    }

    return { outcome, predictions };
  },

  // Layer 2 (Gemini) will replace this stub — interface is fixed.
  // Returns { outcome: 'pass' | 'fail', explanation: string }
  'submissions.validate'(imageBase64, targetObject) {
    console.log(`[submissions.validate] target="${targetObject}" size=${imageBase64?.length ?? 0} chars`);
    return { outcome: 'fail', explanation: 'stub - Gemini integration pending' };
  },
});

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

function evaluatePredictions(predictions, target) {
  const match = predictions.find((p) => p.class === target);
  if (match) return match.score >= 0.65 ? 'pass' : 'escalate';
  const top = predictions[0];
  if (top && top.score >= 0.8) return 'fail';
  return 'escalate';
}
