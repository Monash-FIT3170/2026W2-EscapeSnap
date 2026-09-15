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

    // Joins the fresh two-player lobby as Ada. Checks the returned game/player IDs and the
    // stored player name, game association and initially empty revealed-letter array.
    it('adds a player to the game and returns both ids', async function () {
      const result = await Meteor.callAsync('players.join', joinCode, 'Ada');

      assert.equal(result.gameId, gameId);
      assert.isString(result.playerId);

      const player = await Players.findOneAsync(result.playerId);
      assert.equal(player.name, 'Ada');
      assert.equal(player.gameId, gameId);
      assert.deepEqual(player.revealedLetters, []);
    });

    // Joins using the name surrounded by spaces, "  Grace  ". Checks that the stored name is
    // Grace without surrounding whitespace.
    it('trims surrounding whitespace from the player name', async function () {
      const { playerId } = await Meteor.callAsync(
        'players.join',
        joinCode,
        '  Grace  '
      );
      const player = await Players.findOneAsync(playerId);

      assert.equal(player.name, 'Grace');
    });

    // Attempts to join with code 0000, which does not identify the test lobby. Checks that
    // players.join rejects with not-found.
    it('throws not-found for an unknown join code', async function () {
      try {
        await Meteor.callAsync('players.join', '0000', 'Ada');
        assert.fail('expected players.join to throw');
      } catch (error) {
        assert.equal(error.error, 'not-found');
      }
    });

    // Fills and starts the lobby, then attempts to join as Katherine. Checks that a game already
    // in progress rejects the join with not-found.
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

    // Fills both lobby slots with Ada and Grace, then tries adding Katherine. Checks the full
    // error and verifies that the stored player count remains two.
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
