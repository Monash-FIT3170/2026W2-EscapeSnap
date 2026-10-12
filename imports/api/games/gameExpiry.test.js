import { Meteor } from 'meteor/meteor';
import { assert } from 'chai';
import { Games } from './GamesCollection';
import { Players } from '../players/PlayersCollection';
import { Rounds } from '../rounds/RoundsCollection';
import { Matches } from '../matches/MatchesCollection';
import { GameResults } from '../achievements/GameResultsCollection';
import './gamesMethods';
import '../players/playersMethods';
import '../rounds/roundsMethods';

if (Meteor.isServer) {
  const { sweepExpiredGames } = require('./gameExpiry');

  async function startedGame() {
    const gameId = await Meteor.callAsync('games.create', {
      groupName: 'Team Rocket',
      capacity: 1,
      totalRounds: 1,
    });
    const { joinCode } = await Games.findOneAsync(gameId);
    await Meteor.callAsync('players.join', joinCode, 'Ada');
    await Meteor.callAsync('games.start', gameId);
    return gameId;
  }

  // Moves the start back so the whole clock (plus `extraMs`) has passed.
  async function runClockOut(gameId, extraMs = 60 * 1000) {
    const { timerMinutes } = await Games.findOneAsync(gameId);
    const startedAt = new Date(Date.now() - timerMinutes * 60 * 1000 - extraMs);
    await Games.updateAsync(gameId, { $set: { startedAt } });
  }

  describe('game expiry', function () {
    beforeEach(async function () {
      await Games.removeAsync({});
      await Players.removeAsync({});
      await Rounds.removeAsync({});
      await Matches.removeAsync({});
      await GameResults.removeAsync({});
    });

    it('ends a game whose clock has run out as lost', async function () {
      const gameId = await startedGame();
      await runClockOut(gameId);

      await sweepExpiredGames();

      const game = await Games.findOneAsync(gameId);
      assert.equal(game.status, 'lost');
      assert.instanceOf(game.endedAt, Date);
    });

    it('leaves a game with time on the clock alone', async function () {
      const gameId = await startedGame();

      await sweepExpiredGames();

      assert.equal((await Games.findOneAsync(gameId)).status, 'in_progress');
    });

    it('gives a just-expired game a few seconds of grace', async function () {
      const gameId = await startedGame();
      await runClockOut(gameId, 1000);

      await sweepExpiredGames();

      assert.equal((await Games.findOneAsync(gameId)).status, 'in_progress');
    });

    it('refuses a correct final answer once time is up', async function () {
      const gameId = await startedGame();
      const { finalRiddle } = await Games.findOneAsync(gameId);
      await runClockOut(gameId);

      const result = await Meteor.callAsync(
        'games.submitFinalAnswer',
        gameId,
        finalRiddle.answer
      );

      assert.isFalse(result.isCorrect);
      assert.equal(result.outcome, 'lost');
      assert.equal((await Games.findOneAsync(gameId)).status, 'lost');
    });
  });
}
