import { Meteor } from 'meteor/meteor';
import { DDP } from 'meteor/ddp-client';
import { assert } from 'chai';
import { Games } from '../games/GamesCollection';
import { Players } from './PlayersCollection';
import './playersMethods';
import './playersPublications';
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

  // Real DDP connections back to this server, so a dropped socket goes
  // through the same path a phone losing signal does.
  describe('players.presence', function () {
    this.timeout(10000);

    let playerId;
    const clients = [];

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const player = () => Players.findOneAsync(playerId);

    async function waitFor(predicate) {
      for (let i = 0; i < 100; i++) {
        if (predicate(await player())) return;
        await sleep(50);
      }
      assert.fail('timed out waiting for presence to update');
    }

    function connect() {
      const client = DDP.connect(Meteor.absoluteUrl());
      clients.push(client);
      client.subscribe('players.presence', playerId);
      return client;
    }

    beforeEach(async function () {
      await Games.removeAsync({});
      await Players.removeAsync({});
      const gameId = await Meteor.callAsync('games.create', {
        groupName: 'Team Rocket',
        capacity: 2,
      });
      const { joinCode } = await Games.findOneAsync(gameId);
      ({ playerId } = await Meteor.callAsync('players.join', joinCode, 'Ada'));
    });

    afterEach(function () {
      clients.splice(0).forEach((client) => client.disconnect());
    });

    it('flags a dropped connection and clears the flag on reconnect', async function () {
      const client = connect();
      await waitFor((p) => p.connectionId);

      client.disconnect();
      await waitFor((p) => p.disconnectedAt);

      client.reconnect();
      await waitFor((p) => !p.disconnectedAt);
    });

    it('ignores an old connection closing after the player is back on a new one', async function () {
      const stale = connect();
      await waitFor((p) => p.connectionId);
      const staleConnectionId = (await player()).connectionId;

      connect();
      await waitFor((p) => p.connectionId !== staleConnectionId);

      stale.disconnect();
      await sleep(500);
      assert.notExists((await player()).disconnectedAt);
    });
  });
}
