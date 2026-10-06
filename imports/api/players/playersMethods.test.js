import { Meteor } from 'meteor/meteor';
import { assert } from 'chai';
import { Games } from '../games/GamesCollection';
import { Players } from './PlayersCollection';
import { Rounds } from '../rounds/RoundsCollection';
import { RECONNECT_WINDOW_MS } from './presence';
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

      gameId = await Meteor.callAsync('games.create', {
        groupName: 'Team Rocket',
        capacity: 2,
      });
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
  describe('players.rejoin', function () {
    let gameId;
    let ada;
    let grace;

    // Backdates the disconnect so the window has (or hasn't) run out.
    async function droppedAgo(playerId, ms) {
      await Players.updateAsync(playerId, {
        $set: {
          connectionId: 'gone',
          disconnectedAt: new Date(Date.now() - ms),
        },
      });
    }

    async function expectRejoinError(playerId, code) {
      try {
        await Meteor.callAsync('players.rejoin', playerId);
        assert.fail('expected players.rejoin to throw');
      } catch (error) {
        assert.equal(error.error, code);
      }
    }

    beforeEach(async function () {
      await Games.removeAsync({});
      await Players.removeAsync({});
      await Rounds.removeAsync({});

      gameId = await Meteor.callAsync('games.create', {
        groupName: 'Team Rocket',
        capacity: 2,
      });
      const { joinCode } = await Games.findOneAsync(gameId);
      ada = (await Meteor.callAsync('players.join', joinCode, 'Ada')).playerId;
      grace = (await Meteor.callAsync('players.join', joinCode, 'Grace'))
        .playerId;
    });

    it('restores a player who dropped inside the window', async function () {
      await droppedAgo(ada, RECONNECT_WINDOW_MS - 10_000);

      const session = await Meteor.callAsync('players.rejoin', ada);

      assert.deepInclude(session, {
        playerId: ada,
        gameId,
        playerName: 'Ada',
        status: 'lobby',
      });
    });

    it('rejects ids that are not a player', async function () {
      await expectRejoinError('nope', 'not-found');
      await expectRejoinError({ $ne: null }, 'not-found');
    });

    it('frees the lobby slot once the window has closed', async function () {
      await droppedAgo(ada, RECONNECT_WINDOW_MS);

      await expectRejoinError(ada, 'expired');
      assert.isUndefined(await Players.findOneAsync(ada));
    });

    it('forfeits an expired player so the team can still advance', async function () {
      await Meteor.callAsync('games.start', gameId);
      await droppedAgo(ada, RECONNECT_WINDOW_MS);

      await expectRejoinError(ada, 'expired');

      const adaRounds = await Rounds.find({ playerId: ada }).fetchAsync();
      assert.isTrue(adaRounds.every((r) => r.status === 'wrong'));
      assert.deepEqual(
        (await Players.findOneAsync(ada)).revealedLetters,
        adaRounds.map(() => '?')
      );

      const graceRound = await Rounds.findOneAsync({
        playerId: grace,
        roundNumber: 1,
      });
      await Meteor.callAsync('rounds.skip', graceRound._id);
      assert.equal((await Games.findOneAsync(gameId)).currentRound, 2);
    });

    it('ignores a close from a connection the player already replaced', async function () {
      const publish = Meteor.server.publish_handlers['player.self'];
      const connect = (id) => {
        const conn = { id, onClose: (cb) => (conn.close = cb) };
        return conn;
      };
      const settle = () => new Promise((resolve) => setTimeout(resolve, 50));

      const first = connect('first');
      await publish.call({ connection: first }, ada);
      const second = connect('second');
      await publish.call({ connection: second }, ada);

      first.close(); // the old socket is only noticed after the player is back
      await settle();
      assert.isUndefined((await Players.findOneAsync(ada)).disconnectedAt);

      second.close();
      await settle();
      assert.instanceOf((await Players.findOneAsync(ada)).disconnectedAt, Date);
    });

    it('refuses a game that has already ended', async function () {
      await Games.updateAsync(gameId, { $set: { status: 'won' } });

      await expectRejoinError(ada, 'invalid-state');
    });
  });
}
