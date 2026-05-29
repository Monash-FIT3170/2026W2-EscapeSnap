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

    // Mark every still-pending round for the current round as wrong
    const pendingRounds = await Rounds.find({
      gameId,
      roundNumber: game.currentRound,
      status: 'pending',
    }).fetchAsync();

    await Promise.all(pendingRounds.map(async r => {
      await Rounds.updateAsync(r._id, {
        $set: { status: 'wrong', submittedAt: new Date() },
      });
      await Players.updateAsync(r.playerId, {
        $push: { revealedLetters: '?' },
      });
    }));

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

    if (isCorrect || attempts >= MAX_ATTEMPTS) {
      await Games.updateAsync(gameId, {
        $set: { status: isCorrect ? 'won' : 'lost', endedAt: new Date() },
      });
    } else {
      await Games.updateAsync(gameId, {
        $set: { finalRiddleAttempts: attempts },
      });
    }

    return { isCorrect, attemptsLeft: isCorrect ? 0 : MAX_ATTEMPTS - attempts };
  },
});
