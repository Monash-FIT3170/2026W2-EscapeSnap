import { Meteor } from 'meteor/meteor';
import { assert } from 'chai';
import { Games } from '../games/GamesCollection';
import { Players } from '../players/PlayersCollection';
import { Rounds } from './RoundsCollection';
import { seedGame } from '../testing/seedGame';
import { SEEDED_RIDDLE } from '../testing/seededScenario';
import { HINT_PENALTY_MS } from '../../lib/gameClock';
import './roundsMethods';

if (Meteor.isServer) {
  describe('seeded rounds and shared hints', function () {
    let seed;
    beforeEach(async function () {
      seed = await seedGame();
    });

    // Inspects the seeded two-player, three-round game. Checks all six round documents contain
    // the same cup riddle, answer and hint, and only round one carries the seeded start
    // timestamp.
    it('deals the fixed cup riddle to all six player-rounds and stamps only round one', async function () {
      const rounds = await Rounds.find({ gameId: seed.gameId }).fetchAsync();
      assert.lengthOf(rounds, 6);
      for (const round of rounds) {
        assert.equal(round.riddleText, SEEDED_RIDDLE.text);
        assert.equal(round.answer, 'cup');
        assert.equal(round.hint, SEEDED_RIDDLE.hint);
        if (round.roundNumber === 1)
          assert.equal(+round.startedAt, +seed.startedAt);
        else assert.notExists(round.startedAt);
      }
    });
    // Submits Ada's first round as correct while Grace is pending. Checks the returned/stored
    // letter, correct status and nonnegative solve duration, and verifies that the game still
    // waits on round 1.
    it('awards the assigned letter and waits for the teammate', async function () {
      const round = await seed.round();
      assert.equal(
        await Meteor.callAsync('rounds.submit', round._id, true),
        round.letter
      );
      assert.deepEqual(
        (await Players.findOneAsync(seed.adaId)).revealedLetters,
        [round.letter]
      );
      assert.equal((await seed.round()).status, 'correct');
      assert.isAtLeast((await seed.round()).solveDurationMs, 0);
      assert.equal((await Games.findOneAsync(seed.gameId)).currentRound, 1);
    });
    // Lets Ada solve and Grace skip round one. Checks that Grace receives ?, the shared game
    // advances to round 2, and both players' second-round start timestamps are set.
    it('advances both players together when the last player skips', async function () {
      await Meteor.callAsync('rounds.submit', (await seed.round())._id, true);
      await Meteor.callAsync(
        'rounds.skip',
        (await seed.round(seed.graceId))._id
      );
      assert.equal((await Games.findOneAsync(seed.gameId)).currentRound, 2);
      assert.deepEqual(
        (await Players.findOneAsync(seed.graceId)).revealedLetters,
        ['?']
      );
      for (const playerId of [seed.adaId, seed.graceId]) {
        assert.instanceOf((await seed.round(playerId, 2)).startedAt, Date);
      }
    });
    // Submits the same correct round twice. Checks invalid-state on the second call and that Ada
    // still has exactly one revealed letter.
    it('rejects a duplicate submission without adding another letter', async function () {
      const round = await seed.round();
      await Meteor.callAsync('rounds.submit', round._id, true);
      try {
        await Meteor.callAsync('rounds.submit', round._id, true);
        assert.fail('Expected duplicate rejection');
      } catch (error) {
        assert.equal(error.error, 'invalid-state');
      }
      assert.lengthOf(
        (await Players.findOneAsync(seed.adaId)).revealedLetters,
        1
      );
    });
    // Races a correct submission against a skip for the same round. Either outcome may win;
    // checks that the settled status is correct or wrong and the player has exactly its matching
    // single letter.
    it('settles racing submit and skip calls only once', async function () {
      const round = await seed.round();
      await Promise.allSettled([
        Meteor.callAsync('rounds.submit', round._id, true),
        Meteor.callAsync('rounds.skip', round._id),
      ]);
      const saved = await seed.round();
      assert.include(['correct', 'wrong'], saved.status);
      assert.deepEqual(
        (await Players.findOneAsync(seed.adaId)).revealedLetters,
        [saved.status === 'correct' ? round.letter : '?']
      );
    });
    // Backdates game start by 601 seconds before a correct submission. Checks a timeout error,
    // persisted timeout status and a single ? instead of the correct letter.
    it('rejects an expired submission and awards only a question mark', async function () {
      await Games.updateAsync(seed.gameId, {
        $set: { startedAt: new Date(Date.now() - 601000) },
      });
      try {
        await Meteor.callAsync('rounds.submit', (await seed.round())._id, true);
        assert.fail('Expected timeout');
      } catch (error) {
        assert.equal(error.error, 'timeout');
      }
      assert.equal((await seed.round()).status, 'timeout');
      assert.deepEqual(
        (await Players.findOneAsync(seed.adaId)).revealedLetters,
        ['?']
      );
    });
    // Requests the same round hint concurrently twice. Checks both responses contain the seeded
    // hint, exactly one response charges 60000ms, and the shared penalty is only 60000ms.
    it('charges exactly one minute even for simultaneous hint requests', async function () {
      const round = await seed.round();
      const responses = await Promise.all([
        Meteor.callAsync('rounds.revealHint', round._id),
        Meteor.callAsync('rounds.revealHint', round._id),
      ]);
      assert.deepEqual(
        responses.map((r) => r.penaltyMs).sort((a, b) => a - b),
        [0, HINT_PENALTY_MS]
      );
      responses.forEach((r) => assert.equal(r.hint, SEEDED_RIDDLE.hint));
      assert.equal(
        (await Games.findOneAsync(seed.gameId)).timePenaltyMs,
        HINT_PENALTY_MS
      );
    });
    // Reveals the first-round hint separately for Ada and Grace. Checks that both one-minute
    // penalties accumulate on the same game to 120000ms.
    it('charges separate player hints to the same shared clock', async function () {
      for (const id of [seed.adaId, seed.graceId]) {
        await Meteor.callAsync('rounds.revealHint', (await seed.round(id))._id);
      }
      assert.equal(
        (await Games.findOneAsync(seed.gameId)).timePenaltyMs,
        2 * HINT_PENALTY_MS
      );
    });
    // Calls markStarted for a round that already has a start time. Checks that the stored
    // timestamp is unchanged, so refreshing cannot reset its timer.
    it('does not restart the timer when markStarted runs again', async function () {
      const round = await seed.round();
      await Meteor.callAsync('rounds.markStarted', round._id);
      assert.equal(+(await seed.round()).startedAt, +round.startedAt);
    });
    for (const method of [
      'rounds.submit',
      'rounds.skip',
      'rounds.revealHint',
    ]) {
      // Runs this case separately for rounds.submit, rounds.skip and rounds.revealHint with an
      // unknown round ID. Checks that each method rejects with not-found.
      it(`${method} rejects a missing round`, async function () {
        try {
          await Meteor.callAsync(method, 'missing-round');
          assert.fail('Expected rejection');
        } catch (error) {
          assert.equal(error.error, 'not-found');
        }
      });
    }
  });
}
