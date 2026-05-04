import { Meteor } from 'meteor/meteor';
import { Games } from './GamesCollection';
import { FINAL_RIDDLE } from '../../lib/finalRiddle';

Meteor.methods({
  async 'games.create'() {
    return Games.insertAsync({
      status: 'lobby',
      createdAt: new Date(),
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
    if (game.status !== 'final_riddle')
      throw new Meteor.Error(
        'invalid-state',
        'Game is not in final riddle phase'
      );

    const submittedAnswer = typeof guess === 'string' ? guess.trim() : '';
    if (!submittedAnswer)
      throw new Meteor.Error('invalid-answer', 'Answer cannot be blank');
    if (typeof game.finalRiddle?.answer !== 'string')
      throw new Meteor.Error(
        'invalid-state',
        'Final riddle answer is unavailable'
      );

    const isCorrect =
      submittedAnswer.toLowerCase() ===
      game.finalRiddle.answer.trim().toLowerCase();

    if (isCorrect) {
      await Games.updateAsync(gameId, {
        $set: {
          endedAt: new Date(),
        },
      });
    }

    return isCorrect;
  },
});
