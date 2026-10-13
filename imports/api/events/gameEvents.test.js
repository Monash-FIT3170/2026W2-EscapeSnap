import { Meteor } from 'meteor/meteor';
import { assert } from 'chai';
import { Games } from '../games/GamesCollection';
import { Players } from '../players/PlayersCollection';
import { Rounds } from '../rounds/RoundsCollection';
import { GameEvents } from './GameEventsCollection';
import '../games/gamesMethods';
import '../players/playersMethods';
import '../rounds/roundsMethods';

async function eventTypes(gameId) {
  // Events written in the same millisecond share a createdAt, so tests check
  // which events exist rather than their order.
  const events = await GameEvents.find({ gameId }).fetchAsync();
  return events.map((event) => event.type);
}

if (Meteor.isServer) {
  describe('game event log', function () {
    let gameId;
    let playerId;

    beforeEach(async function () {
      await Games.removeAsync({});
      await Players.removeAsync({});
      await Rounds.removeAsync({});
      await GameEvents.removeAsync({});

      gameId = await Meteor.callAsync('games.create', {
        groupName: 'Team Rocket',
        capacity: 1,
        totalRounds: 2,
      });
      const { joinCode } = await Games.findOneAsync(gameId);
      ({ playerId } = await Meteor.callAsync('players.join', joinCode, 'Ada'));
    });

    async function startAndGetRound(roundNumber = 1) {
      await Meteor.callAsync('games.start', gameId);
      return Rounds.findOneAsync({ gameId, playerId, roundNumber });
    }

    it('logs a join with the player name', async function () {
      const event = await GameEvents.findOneAsync({ gameId });

      assert.equal(event.type, 'playerJoined');
      assert.equal(event.playerId, playerId);
      assert.equal(event.playerName, 'Ada');
      assert.instanceOf(event.createdAt, Date);
    });

    it('logs the game starting', async function () {
      await startAndGetRound();

      assert.sameMembers(await eventTypes(gameId), ['playerJoined', 'gameStarted']);
    });

    it('logs a solved round and the next round starting', async function () {
      const round = await startAndGetRound();
      await Meteor.callAsync('rounds.submit', round._id, true);

      const solved = await GameEvents.findOneAsync({ gameId, type: 'roundSolved' });
      assert.equal(solved.playerName, 'Ada');
      assert.equal(solved.roundNumber, 1);

      const started = await GameEvents.findOneAsync({ gameId, type: 'roundStarted' });
      assert.equal(started.roundNumber, 2);
    });

    it('logs a skipped round', async function () {
      const round = await startAndGetRound();
      await Meteor.callAsync('rounds.skip', round._id);

      const skipped = await GameEvents.findOneAsync({ gameId, type: 'roundSkipped' });
      assert.equal(skipped.roundNumber, 1);
    });

    it('logs a hint only the first time it is revealed', async function () {
      const round = await startAndGetRound();
      await Meteor.callAsync('rounds.revealHint', round._id);
      await Meteor.callAsync('rounds.revealHint', round._id);

      const hints = await GameEvents.find({ gameId, type: 'hintRevealed' }).countAsync();
      assert.equal(hints, 1);
    });

    it('logs wrong final answers and the loss', async function () {
      await startAndGetRound();
      for (let i = 0; i < 3; i++) {
        await Meteor.callAsync('games.submitFinalAnswer', gameId, 'definitely-wrong');
      }

      const types = await eventTypes(gameId);
      assert.equal(types.filter((type) => type === 'finalAnswerWrong').length, 2);
      assert.equal(types.filter((type) => type === 'gameLost').length, 1);
    });

    it('logs a win on the correct final answer', async function () {
      await startAndGetRound();
      const { finalRiddle } = await Games.findOneAsync(gameId);
      await Meteor.callAsync('games.submitFinalAnswer', gameId, finalRiddle.answer);

      assert.include(await eventTypes(gameId), 'gameWon');
    });
  });
}
