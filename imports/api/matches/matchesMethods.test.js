import { Meteor } from 'meteor/meteor';
import { assert } from 'chai';
import { Games } from '../games/GamesCollection';
import { Players } from '../players/PlayersCollection';
import { Rounds } from '../rounds/RoundsCollection';
import { Matches } from './MatchesCollection';
import { GameResults } from '../achievements/GameResultsCollection';
import '../games/gamesMethods';
import '../players/playersMethods';
import '../rounds/roundsMethods';
import './matchesMethods';

if (Meteor.isServer) {
  async function fillLobby(gameId, prefix) {
    const game = await Games.findOneAsync(gameId);
    for (let i = 0; i < game.capacity; i++) {
      await Meteor.callAsync('players.join', game.joinCode, `${prefix}${i}`);
    }
  }

  async function expectError(promise, code) {
    try {
      await promise;
      assert.fail(`expected a ${code} error`);
    } catch (error) {
      assert.equal(error.error, code);
    }
  }

  async function createStartedLocalMatch() {
    const matchId = await Meteor.callAsync('matches.createLocal', {
      teamNames: ['Red', 'Blue'],
      capacity: 1,
      totalRounds: 2,
    });
    const [red, blue] = (await Matches.findOneAsync(matchId)).gameIds;
    await fillLobby(red, 'r');
    await fillLobby(blue, 'b');
    await Meteor.callAsync('matches.start', matchId);
    return { matchId, red, blue };
  }

  async function answerOf(gameId) {
    return (await Games.findOneAsync(gameId)).finalRiddle.answer;
  }

  describe('team vs team matches', function () {
    beforeEach(async function () {
      await Games.removeAsync({});
      await Players.removeAsync({});
      await Rounds.removeAsync({});
      await Matches.removeAsync({});
      await GameResults.removeAsync({});
    });

    describe('matches.createLocal', function () {
      it('creates two linked lobby games with distinct join codes', async function () {
        const matchId = await Meteor.callAsync('matches.createLocal', {
          teamNames: ['Red', 'Blue'],
          capacity: 2,
        });
        const match = await Matches.findOneAsync(matchId);
        const games = await Games.find({ matchId }).fetchAsync();

        assert.equal(match.mode, 'local');
        assert.equal(match.status, 'lobby');
        assert.lengthOf(games, 2);
        assert.sameMembers(
          games.map((g) => g.groupName),
          ['Red', 'Blue']
        );
        assert.isTrue(games.every((g) => g.mode === 'local'));
        assert.notEqual(games[0].joinCode, games[1].joinCode);
      });

      it('rejects two teams with the same name', async function () {
        await expectError(
          Meteor.callAsync('matches.createLocal', {
            teamNames: ['Red', 'red '],
          }),
          'duplicate-team-name'
        );
      });

      it('rejects a missing team name', async function () {
        await expectError(
          Meteor.callAsync('matches.createLocal', { teamNames: ['Red', ''] }),
          'invalid-group-name'
        );
      });
    });

    describe('matches.start', function () {
      it('refuses to start until both lobbies are full', async function () {
        const matchId = await Meteor.callAsync('matches.createLocal', {
          teamNames: ['Red', 'Blue'],
          capacity: 1,
        });
        const [red] = (await Matches.findOneAsync(matchId)).gameIds;
        await fillLobby(red, 'r');

        await expectError(
          Meteor.callAsync('matches.start', matchId),
          'lobby-not-full'
        );
        assert.equal((await Matches.findOneAsync(matchId)).status, 'lobby');
      });

      it('starts both teams on the same clock with the same round riddles', async function () {
        const { matchId, red, blue } = await createStartedLocalMatch();
        const redGame = await Games.findOneAsync(red);
        const blueGame = await Games.findOneAsync(blue);

        assert.equal((await Matches.findOneAsync(matchId)).status, 'in_progress');
        assert.equal(redGame.status, 'in_progress');
        assert.equal(blueGame.status, 'in_progress');
        assert.equal(
          redGame.startedAt.getTime(),
          blueGame.startedAt.getTime()
        );

        const objects = async (gameId) =>
          (await Rounds.find({ gameId }, { sort: { roundNumber: 1 } }).fetchAsync()).map(
            (r) => r.answer
          );
        assert.deepEqual(await objects(red), await objects(blue));
      });

      it('stops a versus game being started on its own', async function () {
        const matchId = await Meteor.callAsync('matches.createLocal', {
          teamNames: ['Red', 'Blue'],
          capacity: 1,
        });
        const [red] = (await Matches.findOneAsync(matchId)).gameIds;
        await fillLobby(red, 'r');

        await expectError(Meteor.callAsync('games.start', red), 'invalid-state');
      });
    });

    describe('finishing a match', function () {
      it('gives the match to the first team to crack its code', async function () {
        const { matchId, red, blue } = await createStartedLocalMatch();

        const res = await Meteor.callAsync(
          'games.submitFinalAnswer',
          red,
          await answerOf(red)
        );

        assert.equal(res.outcome, 'won');
        const match = await Matches.findOneAsync(matchId);
        assert.equal(match.status, 'finished');
        assert.equal(match.winnerGameId, red);
        assert.equal((await Games.findOneAsync(red)).status, 'won');
        assert.equal((await Games.findOneAsync(blue)).status, 'lost');
        assert.equal(await GameResults.find({ gameId: blue }).countAsync(), 1);
      });

      it('keeps the match alive while the rival can still win', async function () {
        const { matchId, red, blue } = await createStartedLocalMatch();
        for (let i = 0; i < 3; i++) {
          await Meteor.callAsync('games.submitFinalAnswer', red, 'WRONGWORD');
        }

        assert.equal((await Games.findOneAsync(red)).status, 'lost');
        assert.equal((await Matches.findOneAsync(matchId)).status, 'in_progress');

        await Meteor.callAsync(
          'games.submitFinalAnswer',
          blue,
          await answerOf(blue)
        );
        assert.equal((await Matches.findOneAsync(matchId)).winnerGameId, blue);
      });

      it('ends in a draw when every team fails', async function () {
        const { matchId, red, blue } = await createStartedLocalMatch();
        for (const gameId of [red, blue]) {
          for (let i = 0; i < 3; i++) {
            await Meteor.callAsync('games.submitFinalAnswer', gameId, 'WRONGWORD');
          }
        }

        const match = await Matches.findOneAsync(matchId);
        assert.equal(match.status, 'finished');
        assert.isUndefined(match.winnerGameId);
      });
    });

    describe('online matchmaking', function () {
      async function createOnlineTeam(groupName, options = {}) {
        const gameId = await Meteor.callAsync('games.create', {
          groupName,
          mode: 'online',
          capacity: 1,
          ...options,
        });
        await fillLobby(gameId, groupName);
        return gameId;
      }

      it('queues a lone team until a rival arrives', async function () {
        const alpha = await createOnlineTeam('alpha');
        await Meteor.callAsync('matches.findOpponent', alpha);

        const queued = await Games.findOneAsync(alpha);
        assert.equal(queued.status, 'lobby');
        assert.instanceOf(queued.matchmakingSince, Date);
        assert.isUndefined(queued.matchId);
      });

      it('pairs two waiting teams and starts them on the first team’s terms', async function () {
        const alpha = await createOnlineTeam('alpha', { timerMinutes: 45 });
        const bravo = await createOnlineTeam('bravo', { timerMinutes: 20 });

        await Meteor.callAsync('matches.findOpponent', alpha);
        await Meteor.callAsync('matches.findOpponent', bravo);

        const a = await Games.findOneAsync(alpha);
        const b = await Games.findOneAsync(bravo);
        assert.exists(a.matchId);
        assert.equal(a.matchId, b.matchId);
        assert.equal(a.status, 'in_progress');
        assert.equal(b.status, 'in_progress');
        assert.equal(b.timerMinutes, 45);
        assert.isUndefined(b.matchmakingSince);

        const match = await Matches.findOneAsync(a.matchId);
        assert.equal(match.mode, 'online');
        assert.equal(match.status, 'in_progress');
      });

      it('only pairs teams of the same size', async function () {
        const solo = await createOnlineTeam('solo', { capacity: 1 });
        const pairId = await Meteor.callAsync('games.create', {
          groupName: 'pair',
          mode: 'online',
          capacity: 2,
        });
        await fillLobby(pairId, 'pair');

        await Meteor.callAsync('matches.findOpponent', solo);
        await Meteor.callAsync('matches.findOpponent', pairId);

        assert.isUndefined((await Games.findOneAsync(solo)).matchId);
        assert.isUndefined((await Games.findOneAsync(pairId)).matchId);
      });

      it('lets a team leave the queue', async function () {
        const alpha = await createOnlineTeam('alpha');
        await Meteor.callAsync('matches.findOpponent', alpha);
        await Meteor.callAsync('matches.cancelSearch', alpha);
        const bravo = await createOnlineTeam('bravo');
        await Meteor.callAsync('matches.findOpponent', bravo);

        assert.isUndefined((await Games.findOneAsync(alpha)).matchId);
        assert.isUndefined((await Games.findOneAsync(bravo)).matchId);
      });

      it('refuses to queue a team whose lobby is not full', async function () {
        const gameId = await Meteor.callAsync('games.create', {
          groupName: 'alpha',
          mode: 'online',
          capacity: 2,
        });
        await expectError(
          Meteor.callAsync('matches.findOpponent', gameId),
          'lobby-not-full'
        );
      });
    });
  });
}
