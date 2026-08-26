import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BADGE_DEFINITIONS, BADGE_IDS } from './badgeDefinitions.js';
import { calculateGameResults } from './calculateGameResults.js';

const BASE_TIME = new Date('2026-08-24T00:00:00.000Z');

function at(milliseconds) {
  return new Date(BASE_TIME.getTime() + milliseconds);
}

function makeGame(overrides = {}) {
  return {
    _id: 'game-1',
    totalRounds: 3,
    timerMinutes: 10,
    startedAt: BASE_TIME,
    ...overrides,
  };
}

function makeRound(playerId, roundNumber, status, startedMs, submittedMs) {
  const round = {
    _id: `${playerId}-${roundNumber}`,
    gameId: 'game-1',
    playerId,
    roundNumber,
    status,
    startedAt: at(startedMs),
    submittedAt: at(submittedMs),
  };
  if (status === 'correct') round.solveDurationMs = submittedMs - startedMs;
  return round;
}

function badgeIds(result) {
  return result.badges.map((badge) => badge.id);
}

describe('achievement results', function () {
  it('defines a unique colour and shape for every badge', function () {
    const definitions = Object.values(BADGE_DEFINITIONS);
    assert.equal(
      new Set(definitions.map((badge) => badge.color)).size,
      definitions.length
    );
    assert.equal(
      new Set(definitions.map((badge) => badge.shape)).size,
      definitions.length
    );
  });

  it('ranks players and awards performance badges from round statistics', function () {
    const players = [
      { _id: 'ada', name: 'Ada' },
      { _id: 'grace', name: 'Grace' },
    ];
    const rounds = [
      makeRound('ada', 1, 'correct', 0, 10_000),
      makeRound('ada', 2, 'correct', 60_000, 75_000),
      makeRound('ada', 3, 'correct', 120_000, 140_000),
      makeRound('grace', 1, 'correct', 0, 25_000),
      makeRound('grace', 2, 'wrong', 60_000, 90_000),
      makeRound('grace', 3, 'timeout', 120_000, 180_000),
    ];

    const results = calculateGameResults({
      game: makeGame(),
      players,
      rounds,
      outcome: 'won',
      generatedAt: at(300_000),
    });

    const ada = results.find((result) => result.playerId === 'ada');
    const grace = results.find((result) => result.playerId === 'grace');

    assert.equal(ada.rank, 1);
    assert.equal(grace.rank, 2);
    [
      BADGE_IDS.FIELD_OPERATIVE,
      BADGE_IDS.LIGHTNING_SOLVER,
      BADGE_IDS.RIDDLE_MASTER,
      BADGE_IDS.FLAWLESS_AGENT,
      BADGE_IDS.FIRST_BREAKTHROUGH,
    ].forEach((badgeId) => assert.ok(badgeIds(ada).includes(badgeId)));
    assert.deepEqual(badgeIds(grace), [BADGE_IDS.FIELD_OPERATIVE]);
    assert.equal(ada.stats.accuracyPercent, 100);
    assert.equal(grace.stats.accuracyPercent, 33);
  });

  it('awards tied competitive badges to every tied player', function () {
    const players = [
      { _id: 'ada', name: 'Ada' },
      { _id: 'grace', name: 'Grace' },
    ];
    const rounds = [
      makeRound('ada', 1, 'correct', 0, 10_000),
      makeRound('grace', 1, 'correct', 0, 10_000),
    ];

    const results = calculateGameResults({
      game: makeGame({ totalRounds: 1 }),
      players,
      rounds,
      outcome: 'won',
      generatedAt: at(20_000),
    });

    results.forEach((result) => {
      assert.equal(result.rank, 1);
      assert.ok(badgeIds(result).includes(BADGE_IDS.LIGHTNING_SOLVER));
      assert.ok(badgeIds(result).includes(BADGE_IDS.RIDDLE_MASTER));
      assert.ok(badgeIds(result).includes(BADGE_IDS.FIRST_BREAKTHROUGH));
    });
  });

  it('awards clutch specialist only inside the final ten percent of the timer', function () {
    const players = [
      { _id: 'early', name: 'Early' },
      { _id: 'clutch', name: 'Clutch' },
    ];
    const rounds = [
      makeRound('early', 1, 'correct', 0, 300_000),
      makeRound('clutch', 1, 'correct', 500_000, 550_000),
    ];

    const results = calculateGameResults({
      game: makeGame({ totalRounds: 1 }),
      players,
      rounds,
      outcome: 'won',
      generatedAt: at(560_000),
    });

    assert.ok(
      !badgeIds(results.find((result) => result.playerId === 'early')).includes(
        BADGE_IDS.CLUTCH_SPECIALIST
      )
    );
    assert.ok(
      badgeIds(results.find((result) => result.playerId === 'clutch')).includes(
        BADGE_IDS.CLUTCH_SPECIALIST
      )
    );
  });

  it('still gives every participant a field operative badge when nobody solves a riddle', function () {
    const players = [
      { _id: 'ada', name: 'Ada' },
      { _id: 'grace', name: 'Grace' },
    ];
    const rounds = [
      makeRound('ada', 1, 'wrong', 0, 30_000),
      makeRound('grace', 1, 'timeout', 0, 60_000),
    ];

    const results = calculateGameResults({
      game: makeGame({ totalRounds: 1 }),
      players,
      rounds,
      outcome: 'lost',
      generatedAt: at(60_000),
    });

    results.forEach((result) => {
      assert.deepEqual(badgeIds(result), [BADGE_IDS.FIELD_OPERATIVE]);
    });
  });
});
