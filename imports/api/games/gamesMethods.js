import { Meteor } from 'meteor/meteor';
import { Games } from './GamesCollection';
import { Players } from '../players/PlayersCollection';
import { Rounds } from '../rounds/RoundsCollection';
import { RoundSessions } from '/imports/api/rounds/RoundSessions';
import { HARDCODED_RIDDLES } from '/imports/lib/riddles';
import { FINAL_RIDDLE } from '../../lib/finalRiddle';

const ROUND_DURATION_MS = 60 * 1000;

function generateJoinCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
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
  async 'games.create'({ timerMinutes = 30, totalRounds = 3, capacity = 4, difficulty = 'medium' } = {}) {
    const joinCode = generateJoinCode();
    return Games.insertAsync({
      joinCode,
      status: 'lobby',
      currentRound: 1,
      totalRounds,
      timerMinutes,
      capacity,
      difficulty,
      createdAt: new Date(),
      startedAt: null,
      endedAt: null,
      finalRiddle: FINAL_RIDDLE,
    });
  },

  async 'games.start'(gameId) {
    const game = await Games.findOneAsync(gameId);
    if (!game) throw new Meteor.Error('not-found', 'Game not found');
    if (game.status !== 'lobby')
      throw new Meteor.Error('invalid-state', 'Game is not in lobby state');

    await Meteor.callAsync('rounds.createForGame', gameId);

    await Games.updateAsync(gameId, {
      $set: { status: 'in_progress', startedAt: new Date() },
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
      throw new Meteor.Error('no-session', 'Round session not found — cannot verify timing');
    }

    const elapsed = Date.now() - session.startedAt.getTime();
    if (elapsed > ROUND_DURATION_MS) {
      throw new Meteor.Error('expired', 'Round timer has expired — submission rejected by server');
    }

    const riddle = HARDCODED_RIDDLES.find(r => r.playerId === playerId);
    if (!riddle) throw new Meteor.Error('no-riddle', 'No riddle found for this player');

    return riddle.revealedLetter;
  },

  async 'games.advanceRound'(gameId) {
    const game = await Games.findOneAsync(gameId);
    if (!game) throw new Meteor.Error('not-found', 'Game not found');
    if (game.currentRound >= game.totalRounds) return;

    await resolvePendingRounds({ gameId, roundNumber: game.currentRound });

    await Games.updateAsync(gameId, {
      $set: { currentRound: game.currentRound + 1 },
    });
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

    // finalRiddleAttempts is persisted on every attempt including the deciding
    // one, so the summary can report how many were used.
    const isDecided = isCorrect || attempts >= MAX_ATTEMPTS;
    const update = { finalRiddleAttempts: attempts };
    if (isDecided) {
      update.status = isCorrect ? 'won' : 'lost';
      update.endedAt = new Date();
    }

    await Games.updateAsync(gameId, { $set: update });

    // The last round never goes through advanceRound, so its rounds would stay
    // pending forever. Only resolve rounds a player was actually shown —
    // startedAt is the per-player proof of that. Rounds never put on screen
    // stay pending so the summary can tell "failed" from "never attempted".
    if (isDecided) {
      await resolvePendingRounds({
        gameId,
        startedAt: { $ne: null },
      });
    }

    return { isCorrect, attemptsLeft: isCorrect ? 0 : MAX_ATTEMPTS - attempts };
  },
});
