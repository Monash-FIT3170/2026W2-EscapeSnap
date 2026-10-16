import { Meteor } from 'meteor/meteor';
import { assert } from 'chai';
import { Games } from './GamesCollection';
import { Players } from '../players/PlayersCollection';
import { Rounds } from '../rounds/RoundsCollection';
import { advanceIfRoundSettled } from '../rounds/roundProgression';
import { joinCodeSource } from './gamesMethods';
import '../rounds/roundsMethods';

if (Meteor.isServer) {
  describe('games methods', function () {
    beforeEach(async function () {
      await Games.removeAsync({});
      await Players.removeAsync({});
      await Rounds.removeAsync({});
    });

    describe('games.create', function () {
      it('creates a game in lobby status with a four digit join code', async function () {
        const gameId = await Meteor.callAsync('games.create', { groupName: 'Team Rocket' });
        const game = await Games.findOneAsync(gameId);

        assert.equal(game.status, 'lobby');
        assert.match(game.joinCode, /^\d{4}$/);
        assert.equal(game.currentRound, 1);
        assert.isNull(game.startedAt);
      });

      it('never reuses a join code an open lobby already has', async function () {
        // Raw insert: only the fields the code lookup reads, so skip the schema.
        await Games.rawCollection().insertOne({ _id: 'open-lobby', joinCode: '1000', status: 'lobby' });
        // First draw collides with the open lobby (1000), second is free (5500).
        const draws = ['1000', '5500'];
        const realNext = joinCodeSource.next;
        joinCodeSource.next = () => draws.shift() ?? realNext();
        try {
          const gameId = await Meteor.callAsync('games.create', { groupName: 'Team Rocket' });
          const game = await Games.findOneAsync(gameId);
          assert.equal(game.joinCode, '5500');
        } finally {
          joinCodeSource.next = realNext;
        }
      });

      it('gives games created at the same moment different join codes', async function () {
        // server/main.js creates this index at startup, which tests don't run.
        await Games.createIndexAsync(
          { joinCode: 1, status: 1 },
          {
            name: 'unique_open_lobby_joinCode',
            unique: true,
            partialFilterExpression: { status: 'lobby' },
          }
        );
        // Both games draw 1000 first; whichever loses must move to 5500.
        const draws = ['1000', '1000', '5500'];
        const realNext = joinCodeSource.next;
        joinCodeSource.next = () => draws.shift() ?? realNext();
        try {
          const ids = await Promise.all([
            Meteor.callAsync('games.create', { groupName: 'Team Rocket' }),
            Meteor.callAsync('games.create', { groupName: 'Team Aqua' }),
          ]);
          const codes = await Promise.all(
            ids.map(async (id) => (await Games.findOneAsync(id)).joinCode)
          );
          assert.sameMembers(codes, ['1000', '5500']);
        } finally {
          joinCodeSource.next = realNext;
        }
      });

      it('applies the documented defaults when called with no options', async function () {
        const gameId = await Meteor.callAsync('games.create', { groupName: 'Team Rocket' });
        const game = await Games.findOneAsync(gameId);

        assert.equal(game.totalRounds, 3);
        assert.equal(game.capacity, 4);
        assert.equal(game.timerMinutes, 30);
        assert.equal(game.difficulty, 'medium');
      });

      it('honours supplied options', async function () {
        const gameId = await Meteor.callAsync('games.create', {
          groupName: 'Team Rocket',
          timerMinutes: 45,
          totalRounds: 5,
          capacity: 2,
          difficulty: 'hard',
        });
        const game = await Games.findOneAsync(gameId);

        assert.equal(game.timerMinutes, 45);
        assert.equal(game.totalRounds, 5);
        assert.equal(game.capacity, 2);
        assert.equal(game.difficulty, 'hard');
      });

      it('allows room capacities from one through four players', async function () {
        for (const capacity of [1, 4]) {
          const gameId = await Meteor.callAsync('games.create', {
            groupName: `Capacity ${capacity}`,
            capacity,
          });
          const game = await Games.findOneAsync(gameId);

          assert.equal(game.capacity, capacity);
        }
      });

      it('rejects room capacities outside the supported range or not whole numbers', async function () {
        for (const capacity of [0, 5, 1.5]) {
          let error;
          try {
            await Meteor.callAsync('games.create', {
              groupName: 'Team Rocket',
              capacity,
            });
          } catch (caught) {
            error = caught;
          }

          assert.isDefined(error, `capacity ${capacity} should be rejected`);
        }
      });

      it('rejects a difficulty outside the allowed values', async function () {
        try {
          await Meteor.callAsync('games.create', { groupName: 'Team Rocket', difficulty: 'impossible' });
          assert.fail('expected the schema to reject an unknown difficulty');
        } catch (error) {
          assert.ok(error, 'an error was thrown');
        }
      });

      it('defaults the answer mode to camera', async function () {
        const gameId = await Meteor.callAsync('games.create', { groupName: 'Team Rocket' });
        const game = await Games.findOneAsync(gameId);

        assert.equal(game.mode, 'camera');
      });

      it('stores drawing mode when requested', async function () {
        const gameId = await Meteor.callAsync('games.create', { groupName: 'Team Rocket', mode: 'drawing' });
        const game = await Games.findOneAsync(gameId);

        assert.equal(game.mode, 'drawing');
      });

      it('stores a cleaned custom theme', async function () {
        const gameId = await Meteor.callAsync('games.create', {
          groupName: 'Team Rocket',
          theme: 'custom',
          customTheme: '  Harry   "Potter"  ',
        });
        const game = await Games.findOneAsync(gameId);

        assert.equal(game.theme, 'custom');
        assert.equal(game.customTheme, 'Harry Potter');
      });

      it('rejects a custom theme with no text', async function () {
        try {
          await Meteor.callAsync('games.create', { groupName: 'Team Rocket', theme: 'custom', customTheme: '   ' });
          assert.fail('expected an empty custom theme to be rejected');
        } catch (error) {
          assert.equal(error.error, 'invalid-custom-theme');
        }
      });

      it('ignores custom theme text when a preset theme is chosen', async function () {
        const gameId = await Meteor.callAsync('games.create', {
          groupName: 'Team Rocket',
          theme: 'home',
          customTheme: 'Harry Potter',
        });
        const game = await Games.findOneAsync(gameId);

        assert.equal(game.theme, 'home');
        assert.isUndefined(game.customTheme);
      });

      it('rejects a mode outside the allowed values', async function () {
        try {
          await Meteor.callAsync('games.create', { groupName: 'Team Rocket', mode: 'video' });
          assert.fail('expected the schema to reject an unknown mode');
        } catch (error) {
          assert.notEqual(error.message, 'expected the schema to reject an unknown mode');
        }
      });
    });

    describe('games.start', function () {
      it('does not start until every configured player slot is filled', async function () {
        const gameId = await Meteor.callAsync('games.create', {
          groupName: 'Team Rocket',
          capacity: 2,
        });
        const { joinCode } = await Games.findOneAsync(gameId);
        await Meteor.callAsync('players.join', joinCode, 'Ada');

        let error;
        try {
          await Meteor.callAsync('games.start', gameId);
        } catch (caught) {
          error = caught;
        }

        assert.equal(error?.error, 'lobby-not-full');
        assert.equal((await Games.findOneAsync(gameId)).status, 'lobby');
      });

      it('moves a lobby game to in_progress and stamps startedAt', async function () {
        const gameId = await Meteor.callAsync('games.create', { groupName: 'Team Rocket', capacity: 1 });
        const { joinCode } = await Games.findOneAsync(gameId);
        await Meteor.callAsync('players.join', joinCode, 'Ada');

        await Meteor.callAsync('games.start', gameId);
        const game = await Games.findOneAsync(gameId);

        assert.equal(game.status, 'in_progress');
        assert.instanceOf(game.startedAt, Date);
      });

      it('throws not-found for a game that does not exist', async function () {
        try {
          await Meteor.callAsync('games.start', 'no-such-game-id');
          assert.fail('expected games.start to throw');
        } catch (error) {
          assert.equal(error.error, 'not-found');
        }
      });

      it('refuses to start a game that has already left the lobby', async function () {
        const gameId = await Meteor.callAsync('games.create', { groupName: 'Team Rocket', capacity: 1 });
        const { joinCode } = await Games.findOneAsync(gameId);
        await Meteor.callAsync('players.join', joinCode, 'Ada');
        await Meteor.callAsync('games.start', gameId);

        try {
          await Meteor.callAsync('games.start', gameId);
          assert.fail('expected the second start to throw');
        } catch (error) {
          assert.equal(error.error, 'invalid-state');
        }
      });

      it('creates one round per player per round number', async function () {
        const gameId = await Meteor.callAsync('games.create', {
          groupName: 'Team Rocket',
          totalRounds: 3,
          capacity: 2,
        });
        const game = await Games.findOneAsync(gameId);
        await Meteor.callAsync('players.join', game.joinCode, 'Ada');
        await Meteor.callAsync('players.join', game.joinCode, 'Grace');

        await Meteor.callAsync('games.start', gameId);

        const rounds = await Rounds.find({ gameId }).fetchAsync();
        assert.lengthOf(rounds, 6, '3 rounds x 2 players');
        assert.isTrue(rounds.every((round) => round.status === 'pending'));
      });
    });

    describe('round progression', function () {
      async function startTwoPlayerGame() {
        const gameId = await Meteor.callAsync('games.create', {
          groupName: 'Team Rocket',
          totalRounds: 2,
          capacity: 2,
        });
        const { joinCode } = await Games.findOneAsync(gameId);
        const ada = await Meteor.callAsync('players.join', joinCode, 'Ada');
        const grace = await Meteor.callAsync('players.join', joinCode, 'Grace');
        await Meteor.callAsync('games.start', gameId);
        return { gameId, adaId: ada.playerId, graceId: grace.playerId };
      }

      async function skip(gameId, playerId) {
        const { currentRound } = await Games.findOneAsync(gameId);
        const round = await Rounds.findOneAsync({
          playerId,
          roundNumber: currentRound,
        });
        await Meteor.callAsync('rounds.skip', round._id);
      }

      it('leaves a lobby game on round 1', async function () {
        const gameId = await Meteor.callAsync('games.create', {
          groupName: 'Team Rocket',
        });

        assert.isFalse(await advanceIfRoundSettled(gameId, 1));
        assert.equal((await Games.findOneAsync(gameId)).currentRound, 1);
      });

      it('stops waiting on a player gone past the grace period, every round including the last', async function () {
        const { gameId, adaId, graceId } = await startTwoPlayerGame();
        await Players.updateAsync(graceId, {
          $set: { disconnectedAt: new Date(Date.now() - 61 * 1000) },
        });

        await skip(gameId, adaId);
        assert.equal((await Games.findOneAsync(gameId)).currentRound, 2);

        await skip(gameId, adaId);
        const graceRounds = await Rounds.find({
          playerId: graceId,
        }).fetchAsync();
        assert.isTrue(graceRounds.every((round) => round.status === 'wrong'));
        assert.deepEqual(
          (await Players.findOneAsync(graceId)).revealedLetters,
          ['?', '?']
        );
      });

      it('keeps waiting on a player still inside the grace period', async function () {
        const { gameId, adaId, graceId } = await startTwoPlayerGame();
        await Players.updateAsync(graceId, {
          $set: { disconnectedAt: new Date(Date.now() - 10 * 1000) },
        });

        await skip(gameId, adaId);

        const graceRound = await Rounds.findOneAsync({
          playerId: graceId,
          roundNumber: 1,
        });
        assert.equal((await Games.findOneAsync(gameId)).currentRound, 1);
        assert.equal(graceRound.status, 'pending');
      });

      it('games.advanceRound forfeits every pending round, including the last', async function () {
        const { gameId, adaId, graceId } = await startTwoPlayerGame();

        await Meteor.callAsync('games.advanceRound', gameId);
        assert.equal((await Games.findOneAsync(gameId)).currentRound, 2);

        await Meteor.callAsync('games.advanceRound', gameId);
        const rounds = await Rounds.find({ gameId }).fetchAsync();
        assert.isTrue(rounds.every((round) => round.status === 'wrong'));
        for (const playerId of [adaId, graceId]) {
          assert.deepEqual(
            (await Players.findOneAsync(playerId)).revealedLetters,
            ['?', '?']
          );
        }
      });
    });

    describe('games.startRound', function () {
      it('rejects a missing sessionId', async function () {
        try {
          await Meteor.callAsync('games.startRound', '');
          assert.fail('expected games.startRound to throw');
        } catch (error) {
          assert.equal(error.error, 'invalid');
        }
      });
    });

    describe('games.submitRiddle', function () {
      it('throws no-session when the round was never started', async function () {
        try {
          await Meteor.callAsync('games.submitRiddle', 'unknown-session', 'p1');
          assert.fail('expected games.submitRiddle to throw');
        } catch (error) {
          assert.equal(error.error, 'no-session');
        }
      });
    });
  });
}
