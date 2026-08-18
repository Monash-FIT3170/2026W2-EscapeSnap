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
});

Meteor.methods({
  async 'submissions.detect'(imageBase64, targetObject) {
    const model = await ensureModel();
    const buf = Buffer.from(imageBase64, 'base64');
    const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const pixelData = { data: new Uint8Array(data.buffer), width: info.width, height: info.height };
    const predictions = await model.detect(pixelData);
    console.log(`[COCO-SSD] target="${targetObject}" detections:`, predictions.map(p => `${p.class} (${(p.score * 100).toFixed(1)}%)`));
    const outcome = evaluatePredictions(predictions, targetObject);
    return { outcome, predictions };
  },

  // Layer 2 (Gemini) will replace this stub — interface is fixed.
  // Returns { outcome: 'pass' | 'fail', explanation: string }
  'submissions.validate'(imageBase64, targetObject) {
    console.log(`[submissions.validate] target="${targetObject}" size=${imageBase64?.length ?? 0} chars`);
    return { outcome: 'fail', explanation: 'stub - Gemini integration pending' };
  },
});

function evaluatePredictions(predictions, target) {
  const match = predictions.find((p) => p.class === target);
  if (match) return match.score >= 0.65 ? 'pass' : 'escalate';
  const top = predictions[0];
  if (top && top.score >= 0.8) return 'fail';
  return 'escalate';
}
