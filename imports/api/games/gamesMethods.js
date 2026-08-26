import { Meteor } from 'meteor/meteor';
import { Games } from './GamesCollection';
import { Players } from '../players/PlayersCollection';
import { Rounds } from '../rounds/RoundsCollection';
import { RoundSessions } from '/imports/api/rounds/RoundSessions';
import { HARDCODED_RIDDLES } from '/imports/lib/riddles';
import { FINAL_RIDDLE, getFallbackFinalRiddle } from '../../lib/finalRiddle';
import { RIDDLE_BANK } from '../../lib/riddleBank';
import { THEME_OBJECT_POOLS } from '../../lib/cocoClasses';
import { advanceGameRound } from '../rounds/roundProgression';
import { finalizeGameResults } from '../achievements/achievementService';
import { generateFinalRiddle, generateRoundRiddles } from '../riddles/geminiClient';

const ROUND_DURATION_MS = 60 * 1000;

function generateJoinCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
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

// Generates the final riddle + round pool for this game, sized to capacity
// (games.start requires a full lobby, so capacity === player count by the
// time these are used). Fire-and-forget from games.create, or awaited from
// games.start if generation hasn't finished yet.
async function pregenerateRiddles(gameId, { totalRounds, capacity, difficulty, theme }) {
  const needed = totalRounds * capacity;

  const [finalRiddleResult, roundPoolResult] = await Promise.allSettled([
    generateFinalRiddle({ difficulty, letterCount: needed }),
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
    finalRiddle = getFallbackFinalRiddle(needed);
  }

  let roundRiddles;
  if (roundPoolResult.status === 'fulfilled' && roundPoolResult.value.length > 0) {
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

  await Games.updateAsync(gameId, {
    $set: {
      finalRiddle,
      pregeneratedRoundRiddles: roundRiddles,
      riddlesReady: true,
    },
  });
  console.log(
    `[games.create] Riddles ready for game ${gameId} (${roundRiddles.length} round riddles, ${finalRiddle.answer.length}-letter final answer).`
  );
}

// Mark every still-pending round matching `selector` as wrong.
// The status is part of the update selector, so a round can only make the
// pending -> wrong transition once and can never push a duplicate '?'.
async function resolvePendingRounds(selector) {
  const pending = await Rounds.find({ ...selector, status: 'pending' }).fetchAsync();
  let resolved = 0;

  for (const round of pending) {
    const updated = await Rounds.updateAsync(
      { _id: round._id, status: 'pending' },
      { $set: { status: 'wrong', submittedAt: new Date() } }
    );
    if (updated === 1) {
      await Players.updateAsync(round.playerId, {
        $push: { revealedLetters: '?' },
      });
      resolved++;
    }
  }

  return resolved;
}

Meteor.methods({
  async 'games.create'({
    groupName,
    timerMinutes = 30,
    totalRounds = 3,
    capacity = 4,
    difficulty = 'medium',
    theme = 'classroom',
  } = {}) {
    if (!groupName || !groupName.trim()) {
      throw new Meteor.Error('invalid-group-name', 'Group name is required');
    }
    const joinCode = generateJoinCode();

    const gameId = await Games.insertAsync({
      joinCode,
      groupName: groupName.trim(),
      status: 'lobby',
      currentRound: 1,
      totalRounds,
      timerMinutes,
      capacity,
      difficulty,
      theme,
      createdAt: new Date(),
      startedAt: null,
      endedAt: null,
      // Placeholder — overwritten by pregenerateRiddles below.
      finalRiddle: FINAL_RIDDLE,
    });

    // Fire-and-forget — runs while players join, so START MISSION is instant.
    pregenerateRiddles(gameId, { totalRounds, capacity, difficulty, theme }).catch((err) => {
      console.error(`[games.create] Riddle pre-warm crashed for game ${gameId}:`, err);
    });

    return gameId;
  },

  async 'games.start'(gameId) {
    const game = await Games.findOneAsync(gameId);
    if (!game) throw new Meteor.Error('not-found', 'Game not found');
    if (game.status !== 'lobby')
      throw new Meteor.Error('invalid-state', 'Game is not in lobby state');

    const playerCount = await Players.find({ gameId }).countAsync();
    if (playerCount !== game.capacity) {
      throw new Meteor.Error(
        'lobby-not-full',
        'All player slots must be filled before starting'
      );
    }

    if (!game.riddlesReady) {
      // Rare: lobby filled before pre-warm finished — finish it now.
      await pregenerateRiddles(gameId, {
        totalRounds: game.totalRounds,
        capacity: game.capacity,
        difficulty: game.difficulty,
        theme: game.theme,
      });
    }

    const startedAt = new Date();
    await Meteor.callAsync('rounds.createForGame', gameId, startedAt);

    await Games.updateAsync(gameId, {
      $set: { status: 'in_progress', startedAt },
    });
  },

  async 'games.startRound'(sessionId) {
    if (!sessionId || typeof sessionId !== 'string') {
      throw new Meteor.Error('invalid', 'sessionId required');
    }
    await RoundSessions.upsertAsync(
      { sessionId },
      { $set: { sessionId, startedAt: new Date() } }
    );
  },

  async 'games.submitRiddle'(sessionId, playerId) {
    const session = await RoundSessions.findOneAsync({ sessionId });
    if (!session) {
      throw new Meteor.Error(
        'no-session',
        'Round session not found — cannot verify timing'
      );
    }

    const elapsed = Date.now() - session.startedAt.getTime();
    if (elapsed > ROUND_DURATION_MS) {
      throw new Meteor.Error(
        'expired',
        'Round timer has expired — submission rejected by server'
      );
    }

    const riddle = HARDCODED_RIDDLES.find((r) => r.playerId === playerId);
    if (!riddle)
      throw new Meteor.Error('no-riddle', 'No riddle found for this player');

    return riddle.revealedLetter;
  },

  async 'games.advanceRound'(gameId) {
    const game = await Games.findOneAsync(gameId);
    if (!game) throw new Meteor.Error('not-found', 'Game not found');
    if (game.currentRound >= game.totalRounds) return;

    await resolvePendingRounds({ gameId, roundNumber: game.currentRound });

    await advanceGameRound(gameId, game.currentRound);
  },

  async 'games.submitFinalAnswer'(gameId, guess) {
    const game = await Games.findOneAsync(gameId);
    if (!game) throw new Meteor.Error('not-found', 'Game not found');
    if (game.status !== 'in_progress')
      throw new Meteor.Error('invalid-state', 'Game is not in progress');

    const MAX_ATTEMPTS = 3;
    const attempts = (game.finalRiddleAttempts ?? 0) + 1;

    const isCorrect =
      guess.trim().toLowerCase() === game.finalRiddle.answer.toLowerCase();

    if (isCorrect || attempts >= MAX_ATTEMPTS) {
      const outcome = isCorrect ? 'won' : 'lost';
      const endedAt = new Date();
      await finalizeGameResults(gameId, outcome, endedAt);
      await Games.updateAsync(gameId, {
        $set: { status: outcome, endedAt, finalRiddleAttempts: attempts },
      });
    } else {
      await Games.updateAsync(gameId, {
        $set: { finalRiddleAttempts: attempts },
      });
    }

    return { isCorrect, attemptsLeft: isCorrect ? 0 : MAX_ATTEMPTS - attempts };
  },
});
