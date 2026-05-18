import { Meteor } from 'meteor/meteor';
import { Rounds } from './RoundsCollection';
import { Players } from '../players/PlayersCollection';
import { Games } from '../games/GamesCollection';
import { RIDDLE_BANK } from '../../lib/riddleBank';

function assignLetters(answer, totalRounds, playerCount) {
  const letters = answer.toUpperCase().split('');
  const pool = [];
  for (let r = 0; r < totalRounds; r++) {
    for (let p = 0; p < playerCount; p++) {
      pool.push(letters[(r * playerCount + p) % letters.length]);
    }
  }
  return pool;
}

Meteor.methods({
  async 'rounds.createForGame'(gameId) {
    const game = await Games.findOneAsync(gameId);
    if (!game) throw new Meteor.Error('not-found', 'Game not found');

    const players = await Players.find({ gameId }).fetchAsync();
    if (players.length === 0)
      throw new Meteor.Error('no-players', 'No players in game');

    const totalRounds = game.totalRounds;
    const answer = game.finalRiddle.answer;
    const letterPool = assignLetters(answer, totalRounds, players.length);

    const needed = totalRounds * players.length;
    const shuffled = [...RIDDLE_BANK].sort(() => Math.random() - 0.5).slice(0, needed);

    const inserts = [];
    let riddleIndex = 0;

    for (let round = 1; round <= totalRounds; round++) {
      for (let p = 0; p < players.length; p++) {
        const riddle = shuffled[riddleIndex];
        const letter = letterPool[riddleIndex];
        riddleIndex++;
        inserts.push(
          Rounds.insertAsync({
            gameId,
            playerId: players[p]._id,
            roundNumber: round,
            riddleText: riddle.text,
            answer: riddle.answer,
            letter,
            status: 'pending',
            photoUrl: null,
            submittedAt: null,
          })
        );
      }
    }

    await Promise.all(inserts);
  },



  async 'rounds.submit'(roundId, photoUrl) {
    const round = await Rounds.findOneAsync(roundId);
    if (!round) throw new Meteor.Error('not-found', 'Round not found');
    if (round.status !== 'pending')
      throw new Meteor.Error('invalid-state', 'Round already submitted');

    // reject submissions made after the round timer expires.
    // MVP uses the total game timer as the round timer.
    const game = await Games.findOneAsync(round.gameId);
    const expired = game?.startedAt &&
      Date.now() - game.startedAt.getTime() > game.timerMinutes * 60 * 1000;

    if (expired) {
      await Rounds.updateAsync(roundId, {
        $set: {
          status: 'timeout',
          photoUrl,
          submittedAt: new Date(),
        },
      });
      await Players.updateAsync(round.playerId, {
        $push: { revealedLetters: '?' },
      });
      throw new Meteor.Error('timeout', 'Round timer expired');
    }

    const isCorrect = false; // placeholder until AI validation

    const letter = isCorrect ? round.letter : '?';

    await Rounds.updateAsync(roundId, {
      $set: {
        status: isCorrect ? 'correct' : 'wrong',
        photoUrl,
        submittedAt: new Date(),
      },
    });

    await Players.updateAsync(round.playerId, {
      $push: { revealedLetters: letter },
    });

    return isCorrect;
  },
});
