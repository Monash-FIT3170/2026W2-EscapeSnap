import { Meteor } from 'meteor/meteor';
import { Games } from './GamesCollection';
import { RoundSessions } from '/imports/api/rounds/RoundSessions';
import { HARDCODED_RIDDLES } from '/imports/lib/riddles';
import { FINAL_RIDDLE } from '/imports/lib/finalRiddle';

const ROUND_DURATION_MS = 60 * 1000;

Meteor.methods({
  async 'games.create'() {
    return Games.insertAsync({
      status: 'lobby',
      createdAt: new Date(),
      players: [],
      finalRiddle: FINAL_RIDDLE,
    });
  },

  async 'games.start'(gameId) {
    const game = await Games.findOneAsync(gameId);
    if (!game) throw new Meteor.Error('not-found', 'Game not found');
    if (game.status !== 'lobby')
      throw new Meteor.Error('invalid-state', 'Game is not in lobby state');
    await Games.updateAsync(gameId, {
      $set: { status: 'in_progress', startedAt: new Date() },
    });
  },

  // Called by the client when the round timer starts — records the deadline server-side
  async 'games.startRound'(sessionId) {
    if (!sessionId || typeof sessionId !== 'string') {
      throw new Meteor.Error('invalid', 'sessionId required');
    }
    await RoundSessions.upsertAsync(
      { sessionId },
      { $set: { sessionId, startedAt: new Date() } }
    );
  },

  // Validates the round has not expired before awarding the revealed letter
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

  async 'games.submitFinalAnswer'(gameId, guess) {
    const game = await Games.findOneAsync(gameId);
    if (!game) throw new Meteor.Error('not-found', 'Game not found');
    const isCorrect =
      guess.trim().toLowerCase() === game.finalRiddle.answer.toLowerCase();
    await Games.updateAsync(gameId, { $set: { endedAt: new Date() } });
    return isCorrect;
  },
});
