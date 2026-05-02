import { Meteor } from 'meteor/meteor';
import { Games } from './GamesCollection';
import { FINAL_RIDDLE } from '../../lib/finalRiddle';

Meteor.methods({
  async 'games.create'() {
    return Games.insertAsync({
      status: 'final_riddle',
      createdAt: new Date(),
      players: [
        { id: 'player1', name: 'Dylan', revealedLetters: ['M', '?', 'A'] },
      ],
      finalRiddle: FINAL_RIDDLE,
    });
  },

  // SCRUM-126, SCRUM-119
  async 'games.submitFinalAnswer'(gameId, guess) {
    const game = await Games.findOneAsync(gameId);
    if (!game) throw new Meteor.Error('not-found', 'Game not found');
    if (game.status !== 'final_riddle')
      throw new Meteor.Error('invalid-state', 'Game is not in final riddle phase');

    // Sprint 3: move answer validation server-side only so answer is never sent to client
    const isCorrect =
      guess.trim().toLowerCase() === game.finalRiddle.answer.toLowerCase();

    await Games.updateAsync(gameId, {
      $set: {
        // status: isCorrect ? 'won' : 'lost',
        endedAt: new Date(),
      },
    });

    return isCorrect;
  },
});
