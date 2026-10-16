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

    it('hands the joining player a session token and stores only its hash', async function () {
      const ada = await Meteor.callAsync('players.join', joinCode, 'Ada');
      const grace = await Meteor.callAsync('players.join', joinCode, 'Grace');

      assert.isString(ada.sessionToken);
      assert.isAtLeast(ada.sessionToken.length, 40);
      assert.notEqual(ada.sessionToken, grace.sessionToken);
      const stored = await Players.findOneAsync(ada.playerId);
      assert.isString(stored.sessionTokenHash);
      assert.notEqual(stored.sessionTokenHash, ada.sessionToken);
    });

    it('never publishes the token hash or connection to the game', async function () {
      await Meteor.callAsync('players.join', joinCode, 'Ada');
      await Players.updateAsync({}, { $set: { connectionId: 'c1' } });

      const cursor = Meteor.server.publish_handlers['players.inGame'].call(
        {},
        gameId
      );
      const [published] = await cursor.fetchAsync();

      assert.equal(published.name, 'Ada');
      assert.notProperty(published, 'sessionTokenHash');
      assert.notProperty(published, 'connectionId');
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
  // Teammates see each other's player ids in the lobby, so every test below
  // also checks that an id without its own session token gets nowhere.
  async function joinTwo() {
    const gameId = await Meteor.callAsync('games.create', {
      groupName: 'Team Rocket',
      capacity: 2,
    });
    const { joinCode } = await Games.findOneAsync(gameId);
    const ada = await Meteor.callAsync('players.join', joinCode, 'Ada');
    const grace = await Meteor.callAsync('players.join', joinCode, 'Grace');
    return { gameId, joinCode, ada, grace };
  }

  async function expectError(promise, code) {
    try {
      await promise;
      assert.fail(`expected a ${code} error`);
    } catch (error) {
      assert.equal(error.error, code);
    }
  }

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

    const rejoin = (playerId, sessionToken) =>
      Meteor.callAsync('players.rejoin', playerId, sessionToken);

    beforeEach(async function () {
      await Games.removeAsync({});
      await Players.removeAsync({});
      await Rounds.removeAsync({});
      ({ gameId, ada, grace } = await joinTwo());
    });

    it('restores a player who dropped inside the window', async function () {
      await droppedAgo(ada.playerId, RECONNECT_WINDOW_MS - 10_000);

      const session = await rejoin(ada.playerId, ada.sessionToken);

      assert.deepInclude(session, {
        playerId: ada.playerId,
        gameId,
        playerName: 'Ada',
        status: 'lobby',
      });
    });

    it('refuses an id without its own session token', async function () {
      await expectError(rejoin(ada.playerId), 'not-found');
      await expectError(rejoin(ada.playerId, 'guess'), 'not-found');
      // Grace knows Ada's id and has a real token, just not Ada's.
      await expectError(rejoin(ada.playerId, grace.sessionToken), 'not-found');
    });

    it('rejects ids that are not a player', async function () {
      await expectError(rejoin('nope', ada.sessionToken), 'not-found');
      await expectError(rejoin({ $ne: null }, ada.sessionToken), 'not-found');
    });

    it('frees the lobby slot once the window has closed', async function () {
      await droppedAgo(ada.playerId, RECONNECT_WINDOW_MS);

      await expectError(rejoin(ada.playerId, ada.sessionToken), 'expired');
      assert.isUndefined(await Players.findOneAsync(ada.playerId));
    });

    it('does not let a wrong token trigger the expiry', async function () {
      await droppedAgo(ada.playerId, RECONNECT_WINDOW_MS);

      await expectError(rejoin(ada.playerId, grace.sessionToken), 'not-found');
      assert.exists(await Players.findOneAsync(ada.playerId));
    });

    it('forfeits an expired player so the team can still advance', async function () {
      await Meteor.callAsync('games.start', gameId);
      await droppedAgo(ada.playerId, RECONNECT_WINDOW_MS);

      await expectError(rejoin(ada.playerId, ada.sessionToken), 'expired');

      const adaRounds = await Rounds.find({
        playerId: ada.playerId,
      }).fetchAsync();
      assert.isTrue(adaRounds.every((r) => r.status === 'wrong'));
      assert.deepEqual(
        (await Players.findOneAsync(ada.playerId)).revealedLetters,
        adaRounds.map(() => '?')
      );

      const graceRound = await Rounds.findOneAsync({
        playerId: grace.playerId,
        roundNumber: 1,
      });
      await Meteor.callAsync('rounds.skip', graceRound._id);
      assert.equal((await Games.findOneAsync(gameId)).currentRound, 2);
    });

    it('refuses a game that has already ended', async function () {
      await Games.updateAsync(gameId, { $set: { status: 'won' } });

      await expectError(
        rejoin(ada.playerId, ada.sessionToken),
        'invalid-state'
      );
    });
  });

  describe('player.self', function () {
    let ada;
    let grace;

    const publish = Meteor.server.publish_handlers['player.self'];
    const fakeConnection = (id) => {
      const conn = { id, onClose: (cb) => (conn.close = cb) };
      return conn;
    };
    const settle = () => new Promise((resolve) => setTimeout(resolve, 50));

    beforeEach(async function () {
      await Games.removeAsync({});
      await Players.removeAsync({});
      ({ ada, grace } = await joinTwo());
    });

    it('ignores a close from a connection the player already replaced', async function () {
      const first = fakeConnection('first');
      await publish.call({ connection: first }, ada.playerId, ada.sessionToken);
      const second = fakeConnection('second');
      await publish.call(
        { connection: second },
        ada.playerId,
        ada.sessionToken
      );

      first.close(); // the old socket is only noticed after the player is back
      await settle();
      const player = () => Players.findOneAsync(ada.playerId);
      assert.isUndefined((await player()).disconnectedAt);

      second.close();
      await settle();
      assert.instanceOf((await player()).disconnectedAt, Date);
    });

    it("won't bind a player to someone else's connection", async function () {
      const own = fakeConnection('ada-conn');
      await publish.call({ connection: own }, ada.playerId, ada.sessionToken);

      // Grace subscribes with Ada's id, then drops, hoping to mark Ada offline.
      const intruder = fakeConnection('grace-conn');
      await expectError(
        publish.call(
          { connection: intruder },
          ada.playerId,
          grace.sessionToken
        ),
        'not-found'
      );
      assert.notExists(intruder.close);

      const player = await Players.findOneAsync(ada.playerId);
      assert.equal(player.connectionId, 'ada-conn');
      assert.notExists(player.disconnectedAt);
    });
  });

  describe('players.leave', function () {
    let gameId;
    let joinCode;
    let ada;
    let grace;

    const leave = (playerId, sessionToken) =>
      Meteor.callAsync('players.leave', playerId, sessionToken);

    beforeEach(async function () {
      await Games.removeAsync({});
      await Players.removeAsync({});
      await Rounds.removeAsync({});
      ({ gameId, joinCode, ada, grace } = await joinTwo());
    });

    it('frees the lobby slot straight away', async function () {
      await leave(ada.playerId, ada.sessionToken);

      assert.isUndefined(await Players.findOneAsync(ada.playerId));
      // The lobby was full; someone else can now take the slot.
      const { playerId } = await Meteor.callAsync(
        'players.join',
        joinCode,
        'Linus'
      );
      assert.isString(playerId);
    });

    it('frees the slot of a player bound to a connection', async function () {
      await Players.updateAsync(ada.playerId, {
        $set: { connectionId: 'ada-conn' },
      });

      await leave(ada.playerId, ada.sessionToken);

      assert.isUndefined(await Players.findOneAsync(ada.playerId));
    });

    it('forfeits a player who leaves as the game starts', async function () {
      await Meteor.callAsync('games.start', gameId);

      await leave(ada.playerId, ada.sessionToken);

      const adaRounds = await Rounds.find({
        playerId: ada.playerId,
      }).fetchAsync();
      assert.isTrue(adaRounds.every((r) => r.status === 'wrong'));
      const graceRound = await Rounds.findOneAsync({
        playerId: grace.playerId,
        roundNumber: 1,
      });
      await Meteor.callAsync('rounds.skip', graceRound._id);
      assert.equal((await Games.findOneAsync(gameId)).currentRound, 2);
    });

    it("refuses to remove a player without that player's token", async function () {
      // Grace can see Ada's id in the lobby, but can't make her leave.
      await expectError(leave(ada.playerId, grace.sessionToken), 'not-found');
      await expectError(leave(ada.playerId), 'not-found');

      assert.exists(await Players.findOneAsync(ada.playerId));
    });

    it('refuses ids that are not a player', async function () {
      await expectError(leave('nope', ada.sessionToken), 'not-found');
      await expectError(leave({ $ne: null }, ada.sessionToken), 'not-found');

      assert.equal(await Players.find({ gameId }).countAsync(), 2);
    });
  });

  // Real DDP connections back to this server, so a dropped socket goes
  // through the same path a phone losing signal does.
  describe('player.self presence', function () {
    this.timeout(10000);

    let playerId;
    let sessionToken;
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
      client.subscribe('player.self', playerId, sessionToken);
      return client;
    }

    beforeEach(async function () {
      await Games.removeAsync({});
      await Players.removeAsync({});
      ({
        ada: { playerId, sessionToken },
      } = await joinTwo());
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
