import { Meteor } from 'meteor/meteor';
import { DDP } from 'meteor/ddp-client';
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

    it('enforces the configured minimum and maximum room capacities', async function () {
      for (const capacity of [1, 4]) {
        await Players.removeAsync({});
        const configuredGameId = await Meteor.callAsync('games.create', {
          groupName: `Capacity ${capacity}`,
          capacity,
        });
        const configuredGame = await Games.findOneAsync(configuredGameId);

        for (let index = 0; index < capacity; index++) {
          await Meteor.callAsync(
            'players.join',
            configuredGame.joinCode,
            `Player ${index + 1}`
          );
        }

        let error;
        try {
          await Meteor.callAsync(
            'players.join',
            configuredGame.joinCode,
            'One too many'
          );
        } catch (caught) {
          error = caught;
        }

        assert.equal(error?.error, 'full');
        assert.equal(
          await Players.find({ gameId: configuredGameId }).countAsync(),
          capacity
        );
      }
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

  describe('players.leave', function () {
    let gameId;
    let joinCode;
    let ada;
    let grace;

    beforeEach(async function () {
      await Games.removeAsync({});
      await Players.removeAsync({});
      await Rounds.removeAsync({});

      gameId = await Meteor.callAsync('games.create', {
        groupName: 'Team Rocket',
        capacity: 2,
      });
      ({ joinCode } = await Games.findOneAsync(gameId));
      ada = (await Meteor.callAsync('players.join', joinCode, 'Ada')).playerId;
      grace = (await Meteor.callAsync('players.join', joinCode, 'Grace'))
        .playerId;
    });

    it('frees the lobby slot straight away', async function () {
      await Meteor.callAsync('players.leave', ada);

      assert.isUndefined(await Players.findOneAsync(ada));
      // The lobby was full; someone else can now take the slot.
      const { playerId } = await Meteor.callAsync(
        'players.join',
        joinCode,
        'Linus'
      );
      assert.isString(playerId);
    });

    it('frees the slot of a player still bound to a connection', async function () {
      await Players.updateAsync(ada, { $set: { connectionId: 'live' } });

      await Meteor.callAsync('players.leave', ada);

      assert.isUndefined(await Players.findOneAsync(ada));
    });

    it('forfeits a player who leaves as the game starts', async function () {
      await Meteor.callAsync('games.start', gameId);

      await Meteor.callAsync('players.leave', ada);

      const adaRounds = await Rounds.find({ playerId: ada }).fetchAsync();
      assert.isTrue(adaRounds.every((r) => r.status === 'wrong'));
      const graceRound = await Rounds.findOneAsync({
        playerId: grace,
        roundNumber: 1,
      });
      await Meteor.callAsync('rounds.skip', graceRound._id);
      assert.equal((await Games.findOneAsync(gameId)).currentRound, 2);
    });

    it('ignores ids that are not a player', async function () {
      await Meteor.callAsync('players.leave', 'nope');
      await Meteor.callAsync('players.leave', { $ne: null });

      assert.equal(await Players.find({ gameId }).countAsync(), 2);
    });
  });

  // Real DDP connections back to this server, so a dropped socket goes
  // through the same path a phone losing signal does.
  describe('player.self presence', function () {
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
      client.subscribe('player.self', playerId);
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
