import { Meteor } from 'meteor/meteor';
import { Games } from './GamesCollection';
import { FINAL_RIDDLE } from '../../lib/finalRiddle';

Meteor.methods({
  async 'games.create'({ timerMinutes = 30, capacity = 4, difficulty = 'medium' } = {}) {
    return Games.insertAsync({
      status: 'lobby',
      createdAt: new Date(),
      timerMinutes,
      capacity,
      difficulty,
      players: [
        { id: 'player1', name: 'Dylan', revealedLetters: ['M', '?', 'A'] },
      ],
      finalRiddle: FINAL_RIDDLE,
    });
  },

  // SCRUM-103
  async 'games.start'(gameId) {
    const game = await Games.findOneAsync(gameId);
    if (!game) throw new Meteor.Error('not-found', 'Game not found');
    if (game.status !== 'lobby')
      throw new Meteor.Error('invalid-state', 'Game is not in lobby state');
    await Games.updateAsync(gameId, {
      $set: { status: 'in_progress', startedAt: new Date() },
    });
  },

  // SCRUM-126, SCRUM-119
  async 'games.submitFinalAnswer'(gameId, guess) {
    const game = await Games.findOneAsync(gameId);
    if (!game) throw new Meteor.Error('not-found', 'Game not found');
    if (game.status !== 'in_progress')
      throw new Meteor.Error('invalid-state', 'Game is not in progress');

    // Sprint 3: move answer validation server-side only so answer is never sent to client
    const isCorrect =
      guess.trim().toLowerCase() === game.finalRiddle.answer.toLowerCase();

    await Games.updateAsync(gameId, {
      $set: {
        status: 'ended',
        endedAt: new Date(),
      },
    });

    return isCorrect;
  },
});
