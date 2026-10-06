import { Meteor } from 'meteor/meteor';
import { Games } from './GamesCollection';
import { getFallbackFinalRiddle } from '../../lib/finalRiddle';
import { RIDDLE_BANK } from '../../lib/riddleBank';
import { THEME_OBJECT_POOLS } from '../../lib/cocoClasses';
import { finalizeGameResults } from '../achievements/achievementService';
import {
  generateFinalRiddle,
  generateRoundRiddles,
} from '../riddles/geminiClient';

// Server-side game lifecycle shared by solo games (gamesMethods) and
// team-vs-team matches (matchService): riddle pre-warm, start and end.

// Final-answer length is capped to what the offline fallback bank actually
// covers (FINAL_RIDDLE_BANK in finalRiddle.js runs 3-12 letters). Requesting
// totalRounds * capacity letters directly asked Gemini for words up to 40
// letters long — almost always impossible — and rounds.createForGame already
// wraps letter positions via modulo when there are more player-rounds than
// letters, so a shorter word works fine.
const MIN_FINAL_ANSWER_LENGTH = 3;
const MAX_FINAL_ANSWER_LENGTH = 12;

function clampFinalAnswerLength(needed) {
  return Math.min(
    Math.max(needed, MIN_FINAL_ANSWER_LENGTH),
    MAX_FINAL_ANSWER_LENGTH
  );
}

// How long games.start waits for an in-flight pre-warm before giving up and
// starting with the offline fallback riddles instead of blocking the host.
const PREWARM_WAIT_MS = 10 * 1000;

// players.join looks a game up by code among lobby games, so a code only has
// to be unique among those. A match creates two lobbies in the same instant,
// which makes a collision far more likely than it was for solo games.
export async function generateJoinCode() {
  for (let attempt = 0; attempt < 20; attempt++) {
    const code = String(Math.floor(1000 + Math.random() * 9000));
    const taken = await Games.findOneAsync(
      { joinCode: code, status: 'lobby' },
      { fields: { _id: 1 } }
    );
    if (!taken) return code;
  }
  throw new Meteor.Error('no-join-code', 'Could not allocate a join code');
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Tops up a short/empty AI pool with the theme-filtered fallback bank, so a
// Gemini failure never blocks round creation.
function ensureEnoughRiddles(pool, needed, theme) {
  const combined = [...(pool || [])];
  if (combined.length < needed) {
    const objectPool =
      THEME_OBJECT_POOLS[theme] || THEME_OBJECT_POOLS.classroom;
    const themedBank = RIDDLE_BANK.filter((r) => objectPool.includes(r.answer));
    const fallback = [...themedBank].sort(() => Math.random() - 0.5);
    let i = 0;
    while (combined.length < needed) {
      combined.push(fallback[i % fallback.length]);
      i++;
    }
  }
  return combined.slice(0, needed);
}

// Writes riddles only if this game doesn't already have them. games.create's
// fire-and-forget pre-warm and games.start's "not ready yet" pre-warm can end
// up racing for the same gameId; without this guard, whichever write lands
// last would silently overwrite finalRiddle after rounds.createForGame may
// have already handed out letters for the other answer.
async function writeRiddlesIfNotReady(gameId, finalRiddle, roundRiddles) {
  const updated = await Games.updateAsync(
    { _id: gameId, riddlesReady: { $ne: true } },
    {
      $set: {
        finalRiddle,
        pregeneratedRoundRiddles: roundRiddles,
        riddlesReady: true,
      },
    }
  );
  return updated === 1;
}

// Generates the final riddle + round pool for this game, sized to capacity
// (games.start requires a full lobby, so capacity === player count by the
// time these are used). Fire-and-forget from games.create, or awaited from
// games.start if generation hasn't finished yet.
async function pregenerateRiddles(
  gameId,
  { totalRounds, capacity, difficulty, theme }
) {
  const needed = totalRounds * capacity;
  const finalAnswerLength = clampFinalAnswerLength(needed);

  const [finalRiddleResult, roundPoolResult] = await Promise.allSettled([
    generateFinalRiddle({ difficulty, letterCount: finalAnswerLength }),
    generateRoundRiddles({ count: needed, difficulty, theme }),
  ]);

  let finalRiddle;
  if (finalRiddleResult.status === 'fulfilled') {
    finalRiddle = finalRiddleResult.value;
  } else {
    console.error(
      `[games.create] Final riddle pre-warm failed for game ${gameId}, using fallback:`,
      finalRiddleResult.reason
    );
    finalRiddle = getFallbackFinalRiddle(finalAnswerLength);
  }

  let roundRiddles;
  if (
    roundPoolResult.status === 'fulfilled' &&
    roundPoolResult.value.length > 0
  ) {
    roundRiddles = ensureEnoughRiddles(roundPoolResult.value, needed, theme);
  } else {
    if (roundPoolResult.status === 'rejected') {
      console.error(
        `[games.create] Round-riddle pre-warm failed for game ${gameId}, using fallback bank:`,
        roundPoolResult.reason
      );
    }
    roundRiddles = ensureEnoughRiddles(null, needed, theme);
  }

  const wrote = await writeRiddlesIfNotReady(gameId, finalRiddle, roundRiddles);
  if (wrote) {
    console.log(
      `[games.create] Riddles ready for game ${gameId} (${roundRiddles.length} round riddles, ${finalRiddle.answer.length}-letter final answer).`
    );
  } else {
    console.log(
      `[games.create] Riddle pre-warm finished for game ${gameId} but another generation already won — discarding.`
    );
  }
}

// De-dupes concurrent pre-warm calls for the same game (games.create's
// fire-and-forget call and games.start's "not ready yet" call can otherwise
// both be in flight at once) and never rejects — callers only care whether
// riddlesReady ends up true, not why a pre-warm attempt failed.
const pendingPregeneration = new Map();

export function pregenerateRiddlesOnce(gameId, params) {
  if (!pendingPregeneration.has(gameId)) {
    const promise = pregenerateRiddles(gameId, params)
      .catch((err) => {
        console.error(
          `[games] Riddle pre-warm crashed for game ${gameId}:`,
          err
        );
      })
      .finally(() => pendingPregeneration.delete(gameId));
    pendingPregeneration.set(gameId, promise);
  }
  return pendingPregeneration.get(gameId);
}

// Resolves once the game has riddles. Rare: lobby filled before pre-warm
// finished. Waits for the in-flight (or newly started) pre-warm, but doesn't
// block the host indefinitely — Gemini retries can take up to ~3 minutes worst
// case — and falls back to the offline riddles instead.
export async function ensureRiddlesReady(game) {
  if (game.riddlesReady) return;

  const prewarm = pregenerateRiddlesOnce(game._id, {
    totalRounds: game.totalRounds,
    capacity: game.capacity,
    difficulty: game.difficulty,
    theme: game.theme,
  });

  const readyInTime = await Promise.race([
    prewarm.then(() => true),
    delay(PREWARM_WAIT_MS).then(() => false),
  ]);

  if (!readyInTime) {
    console.warn(
      `[games.start] Riddle pre-warm still running for game ${game._id} after ${PREWARM_WAIT_MS}ms — starting with the offline fallback riddles instead of waiting further.`
    );
    const needed = game.totalRounds * game.capacity;
    await writeRiddlesIfNotReady(
      game._id,
      getFallbackFinalRiddle(clampFinalAnswerLength(needed)),
      ensureEnoughRiddles(null, needed, game.theme)
    );
  }
}

// Deals the rounds and flips the game live. Callers have already checked the
// lobby is full and the riddles are ready.
export async function startGame(gameId, startedAt = new Date()) {
  await Meteor.callAsync('rounds.createForGame', gameId, startedAt);
  await Games.updateAsync(gameId, {
    $set: { status: 'in_progress', startedAt },
  });
}

// Moves a live game to its final outcome and writes the per-player results.
// The status guard means only one caller can end a game, so a final answer
// racing a rival's win can never record two outcomes.
export async function endGame(gameId, outcome, endedAt = new Date(), extra = {}) {
  const updated = await Games.updateAsync(
    { _id: gameId, status: 'in_progress' },
    { $set: { status: outcome, endedAt, ...extra } }
  );
  if (updated === 0) return false;
  await finalizeGameResults(gameId, outcome, endedAt);
  return true;
}
