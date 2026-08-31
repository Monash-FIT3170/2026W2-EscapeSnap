import { Meteor } from 'meteor/meteor';
import { assert } from 'chai';
import { Games } from '../games/GamesCollection';
import { Players } from './PlayersCollection';
import './playersMethods';
import '../games/gamesMethods';
import '../rounds/roundsMethods';

if (Meteor.isServer) {
  describe('players.join', function () {
    let gameId;
    let joinCode;

    beforeEach(async function () {
      await Games.removeAsync({});
      await Players.removeAsync({});

      gameId = await Meteor.callAsync('games.create', { groupName: 'Team Rocket', capacity: 2 });
      joinCode = (await Games.findOneAsync(gameId)).joinCode;
    });

    it('adds a player to the game and returns both ids', async function () {
      const result = await Meteor.callAsync('players.join', joinCode, 'Ada');

      assert.equal(result.gameId, gameId);
      assert.isString(result.playerId);

      const player = await Players.findOneAsync(result.playerId);
      assert.equal(player.name, 'Ada');
      assert.equal(player.gameId, gameId);
      assert.deepEqual(player.revealedLetters, []);
    });

    it('trims surrounding whitespace from the player name', async function () {
      const { playerId } = await Meteor.callAsync(
        'players.join',
        joinCode,
        '  Grace  '
      );
      const player = await Players.findOneAsync(playerId);

      assert.equal(player.name, 'Grace');
    });

    it('throws not-found for an unknown join code', async function () {
      try {
        await Meteor.callAsync('players.join', '0000', 'Ada');
        assert.fail('expected players.join to throw');
      } catch (error) {
        assert.equal(error.error, 'not-found');
      }
    });

    it('throws not-found once the game has left the lobby', async function () {
      await Meteor.callAsync('players.join', joinCode, 'Ada');
      await Meteor.callAsync('players.join', joinCode, 'Grace');
      await Meteor.callAsync('games.start', gameId);

      try {
        await Meteor.callAsync('players.join', joinCode, 'Katherine');
        assert.fail('expected players.join to throw');
      } catch (error) {
        assert.equal(error.error, 'not-found');
      }
    });

    it('throws full once the game is at capacity', async function () {
      await Meteor.callAsync('players.join', joinCode, 'Ada');
      await Meteor.callAsync('players.join', joinCode, 'Grace');

      try {
        await Meteor.callAsync('players.join', joinCode, 'Katherine');
        assert.fail('expected players.join to throw');
      } catch (error) {
        assert.equal(error.error, 'full');
      }

      assert.equal(await Players.find({ gameId }).countAsync(), 2);
    });
  });
}
