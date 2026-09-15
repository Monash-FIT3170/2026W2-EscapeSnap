import { Meteor } from 'meteor/meteor';
import { assert } from 'chai';
import { Games } from './GamesCollection';
import { Rounds } from '../rounds/RoundsCollection';
import { GameResults } from '../achievements/GameResultsCollection';
import { finalizeGameResults } from '../achievements/achievementService';
import { seedGame } from '../testing/seedGame';
import './gamesMethods';
import '../rounds/roundsMethods';

if (Meteor.isServer) {
  describe('seeded final answer and persisted team badges', function () {
    let seed;
    beforeEach(async function () {
      seed = await seedGame();
    });

    // Submits "  key  " against the seeded answer KEY. Checks whitespace/case normalization, a
    // win with no attempts left, an end timestamp, and two saved winning results containing only
    // participation badges.
    it('accepts a trimmed case-insensitive KEY and stores results for both players', async function () {
      assert.deepEqual(
        await Meteor.callAsync(
          'games.submitFinalAnswer',
          seed.gameId,
          '  key  '
        ),
        { isCorrect: true, attemptsLeft: 0 }
      );
      const game = await Games.findOneAsync(seed.gameId);
      assert.equal(game.status, 'won');
      assert.instanceOf(game.endedAt, Date);
      const results = await GameResults.find({
        gameId: seed.gameId,
      }).fetchAsync();
      assert.lengthOf(results, 2);
      results.forEach((r) => {
        assert.equal(r.outcome, 'won');
        assert.deepEqual(
          r.badges.map((b) => b.id),
          ['field-operative']
        );
      });
    });
    // Submits WRONG three times. Checks attempts remaining decrease to 2, 1 and 0; the game
    // stays active for the first two guesses and becomes lost on the third, when both losing
    // results are saved.
    it('allows two incorrect guesses, then loses on the third', async function () {
      for (let attempt = 1; attempt <= 3; attempt++) {
        assert.deepEqual(
          await Meteor.callAsync(
            'games.submitFinalAnswer',
            seed.gameId,
            'WRONG'
          ),
          { isCorrect: false, attemptsLeft: 3 - attempt }
        );
        assert.equal(
          (await Games.findOneAsync(seed.gameId)).status,
          attempt < 3 ? 'in_progress' : 'lost'
        );
        assert.equal(
          await GameResults.find({ gameId: seed.gameId }).countAsync(),
          attempt < 3 ? 0 : 2
        );
      }
      const results = await GameResults.find({
        gameId: seed.gameId,
      }).fetchAsync();
      results.forEach((r) => assert.equal(r.outcome, 'lost'));
    });
    // Submits A and B before submitting KEY. Checks that a correct third guess still returns
    // isCorrect true and leaves the game won.
    it('can still win on the third guess', async function () {
      await Meteor.callAsync('games.submitFinalAnswer', seed.gameId, 'A');
      await Meteor.callAsync('games.submitFinalAnswer', seed.gameId, 'B');
      assert.isTrue(
        (await Meteor.callAsync('games.submitFinalAnswer', seed.gameId, 'KEY'))
          .isCorrect
      );
      assert.equal((await Games.findOneAsync(seed.gameId)).status, 'won');
    });
    // Wins with KEY, snapshots the results, then submits WRONG. Checks invalid-state, unchanged
    // result documents and an attempt count that remains one.
    it('rejects guesses after the game ends and preserves its results', async function () {
      await Meteor.callAsync('games.submitFinalAnswer', seed.gameId, 'KEY');
      const before = await GameResults.find({
        gameId: seed.gameId,
      }).fetchAsync();
      try {
        await Meteor.callAsync('games.submitFinalAnswer', seed.gameId, 'WRONG');
        assert.fail('Expected rejection');
      } catch (error) {
        assert.equal(error.error, 'invalid-state');
      }
      assert.deepEqual(
        await GameResults.find({ gameId: seed.gameId }).fetchAsync(),
        before
      );
      assert.equal(
        (await Games.findOneAsync(seed.gameId)).finalRiddleAttempts,
        1
      );
    });
    // Seeds Ada with three correct five-second solves ending 10s, 20s and 550s after game start,
    // leaving Grace pending. Finalizes twice at the same time and checks exactly two results,
    // all six badges/rank 1 for Ada, and participation only/rank 2 for Grace.
    it('persists all six badges from fixed timestamps without duplicating team results', async function () {
      const baseline = seed.startedAt.getTime();
      for (let n = 1; n <= 3; n++) {
        const end = n === 3 ? 550000 : n * 10000;
        await Rounds.updateAsync((await seed.round(seed.adaId, n))._id, {
          $set: {
            status: 'correct',
            startedAt: new Date(baseline + end - 5000),
            submittedAt: new Date(baseline + end),
            solveDurationMs: 5000,
          },
        });
      }
      const generatedAt = new Date(baseline + 560000);
      await finalizeGameResults(seed.gameId, 'won', generatedAt);
      await finalizeGameResults(seed.gameId, 'won', generatedAt);
      assert.equal(
        await GameResults.find({ gameId: seed.gameId }).countAsync(),
        2
      );
      const ada = await GameResults.findOneAsync({ playerId: seed.adaId });
      assert.equal(ada.rank, 1);
      assert.sameMembers(
        ada.badges.map((b) => b.id),
        [
          'field-operative',
          'lightning-solver',
          'riddle-master',
          'flawless-agent',
          'first-breakthrough',
          'clutch-specialist',
        ]
      );
      const grace = await GameResults.findOneAsync({ playerId: seed.graceId });
      assert.equal(grace.rank, 2);
      assert.deepEqual(
        grace.badges.map((b) => b.id),
        ['field-operative']
      );
    });
  });
}
