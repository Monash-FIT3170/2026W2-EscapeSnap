import { Meteor } from 'meteor/meteor';
import { Games } from './GamesCollection';
import { FINAL_RIDDLE } from '../../lib/finalRiddle';

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

    // Assign individual riddles to each player for every round before starting.
    // Done first so a failure here (e.g. no players) leaves the game in 'lobby'.
    await Meteor.callAsync('rounds.createForGame', gameId);

    await Games.updateAsync(gameId, {
      $set: { status: 'in_progress', startedAt: new Date() },
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
