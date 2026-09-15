import { Meteor } from 'meteor/meteor';
import { assert } from 'chai';
import { Games } from './GamesCollection';
import { Players } from '../players/PlayersCollection';
import { Rounds } from '../rounds/RoundsCollection';
import './gamesMethods';
import '../rounds/roundsMethods';

if (Meteor.isServer) {
  describe('games methods', function () {
    beforeEach(async function () {
      await Games.removeAsync({});
      await Players.removeAsync({});
      await Rounds.removeAsync({});
    });

    describe('games.create', function () {
      // Creates Team Rocket with only its required group name. Checks that the stored game is in
      // the lobby, has a four-digit numeric join code, starts on round 1, and has no start time.
      it('creates a game in lobby status with a four digit join code', async function () {
        const gameId = await Meteor.callAsync('games.create', { groupName: 'Team Rocket' });
        const game = await Games.findOneAsync(gameId);

        assert.equal(game.status, 'lobby');
        assert.match(game.joinCode, /^\d{4}$/);
        assert.equal(game.currentRound, 1);
        assert.isNull(game.startedAt);
      });

      // Omits all optional settings while supplying the required group name. Checks defaults of
      // three rounds, four players, 30 minutes and medium difficulty.
      it('applies the documented defaults when called with no options', async function () {
        const gameId = await Meteor.callAsync('games.create', { groupName: 'Team Rocket' });
        const game = await Games.findOneAsync(gameId);

        assert.equal(game.totalRounds, 3);
        assert.equal(game.capacity, 4);
        assert.equal(game.timerMinutes, 30);
        assert.equal(game.difficulty, 'medium');
      });

      // Creates a game with 45 minutes, five rounds, two player slots and hard difficulty.
      // Checks that each supplied option is stored instead of its default.
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

      // Calls games.create with difficulty impossible to exercise schema rejection. The existing
      // assertion only checks that an error is caught; it also catches assert.fail, so it does
      // not reliably prove rejection.
      it('rejects a difficulty outside the allowed values', async function () {
        try {
          await Meteor.callAsync('games.create', { groupName: 'Team Rocket', difficulty: 'impossible' });
          assert.fail('expected the schema to reject an unknown difficulty');
        } catch (error) {
          assert.ok(error, 'an error was thrown');
        }
      });
    });

    describe('games.start', function () {
      // Fills a one-player lobby with Ada and starts it. Checks that the game becomes
      // in_progress and stores a Date in startedAt.
      it('moves a lobby game to in_progress and stamps startedAt', async function () {
        const gameId = await Meteor.callAsync('games.create', { groupName: 'Team Rocket', capacity: 1 });
        const { joinCode } = await Games.findOneAsync(gameId);
        await Meteor.callAsync('players.join', joinCode, 'Ada');

        await Meteor.callAsync('games.start', gameId);
        const game = await Games.findOneAsync(gameId);

        assert.equal(game.status, 'in_progress');
        assert.instanceOf(game.startedAt, Date);
      });

      // Attempts to start a nonexistent game ID. Checks that the method rejects it with the not-
      // found error code.
      it('throws not-found for a game that does not exist', async function () {
        try {
          await Meteor.callAsync('games.start', 'no-such-game-id');
          assert.fail('expected games.start to throw');
        } catch (error) {
          assert.equal(error.error, 'not-found');
        }
      });

      // Starts a full one-player game, then starts it again. Checks that the second call rejects
      // with invalid-state.
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

      // Starts a three-round game containing Ada and Grace. Checks that six round documents are
      // created and every one is pending.
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

    describe('games.startRound', function () {
      // Passes an empty session ID to games.startRound. Checks that it is rejected with the
      // invalid error code.
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
      // Submits a riddle for an unknown session and player p1. Checks that the server returns
      // no-session because no round session was started.
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
