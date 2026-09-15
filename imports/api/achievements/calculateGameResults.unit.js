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
  // Checks every badge definition and requires both its color and its shape to be unique across
  // the badge catalog.
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

  // Calculates results for Ada with three correct solves and Grace with one correct, one wrong
  // and one timeout. Checks ranks, Ada's five performance/participation badges, Grace's
  // participation-only result, and accuracy of 100% versus 33%.
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

  // Gives Ada and Grace identical correct counts and solve timestamps. Checks that both share
  // rank 1 and receive Lightning Solver, Riddle Master and First Breakthrough.
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

  // Uses a ten-minute game with correct submissions at 300s and 550s. Checks that only the
  // player submitting in the last minute receives Clutch Specialist.
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

  // Finishes a lost game with one wrong answer and one timeout. Checks that each player receives
  // only Field Operative even though nobody solved a riddle.
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

describe('badge boundaries and ranking regressions', function () {
  for (const [submittedMs, expected] of [
    [539999, false],
    [540000, true],
    [600000, true],
    [600001, false],
  ]) {
    // Checks the clutch window against four explicit submission offsets: 539999ms is too early,
    // 540000ms and 600000ms qualify, and 600001ms is too late. This tests badge calculation, not
    // whether the server accepts a submission at the deadline.
    it(`clutch badge at ${submittedMs}ms is ${expected}`, function () {
      const [result] = calculateGameResults({
        game: makeGame({ totalRounds: 1 }),
        players: [{ _id: 'ada', name: 'Ada' }],
        rounds: [makeRound('ada', 1, 'correct', 0, submittedMs)],
        outcome: 'won',
        generatedAt: at(610000),
      });
      assert.equal(
        badgeIds(result).includes(BADGE_IDS.CLUTCH_SPECIALIST),
        expected
      );
    });
  }

  // Deducts a one-minute hint penalty from a ten-minute game. Checks that 485999ms does not
  // qualify for Clutch Specialist, while 486000ms qualifies with a metric of 54000ms remaining.
  it('moves the clutch boundary earlier when a hint costs one minute', function () {
    const players = [
      { _id: 'early', name: 'Early' },
      { _id: 'clutch', name: 'Clutch' },
    ];
    const results = calculateGameResults({
      game: makeGame({ totalRounds: 1, timePenaltyMs: 60000 }),
      players,
      rounds: [
        makeRound('early', 1, 'correct', 0, 485999),
        makeRound('clutch', 1, 'correct', 0, 486000),
      ],
      outcome: 'won',
      generatedAt: at(540000),
    });
    assert.equal(
      badgeIds(results.find((r) => r.playerId === 'early')).includes(
        BADGE_IDS.CLUTCH_SPECIALIST
      ),
      false
    );
    const clutch = results.find((r) => r.playerId === 'clutch');
    assert.equal(
      clutch.badges.find((b) => b.id === BADGE_IDS.CLUTCH_SPECIALIST)
        .metricValue,
      54000
    );
  });

  // Calculates a three-round player result with one correct round and one pending round. Checks
  // that Flawless Agent is absent, completed count is one, and accuracy is 33%.
  it('does not award flawless when a player still has pending rounds', function () {
    const [result] = calculateGameResults({
      game: makeGame(),
      players: [{ _id: 'ada', name: 'Ada' }],
      rounds: [
        makeRound('ada', 1, 'correct', 0, 10000),
        { playerId: 'ada', roundNumber: 2, status: 'pending' },
      ],
      outcome: 'lost',
      generatedAt: at(600000),
    });
    assert.equal(badgeIds(result).includes(BADGE_IDS.FLAWLESS_AGENT), false);
    assert.equal(result.stats.completedCount, 1);
    assert.equal(result.stats.accuracyPercent, 33);
  });

  // Provides a correct round without timestamps and another with a negative duration and
  // reversed timestamps. Checks that neither produces a fastestSolveMs value or Lightning Solver
  // badge.
  it('does not award timing badges for missing or reversed timestamps', function () {
    const [result] = calculateGameResults({
      game: makeGame(),
      players: [{ _id: 'ada', name: 'Ada' }],
      rounds: [
        { playerId: 'ada', status: 'correct' },
        makeRound('ada', 2, 'correct', 20000, 10000),
      ],
      outcome: 'lost',
      generatedAt: at(600000),
    });
    assert.equal(badgeIds(result).includes(BADGE_IDS.LIGHTNING_SOLVER), false);
    assert.equal(result.stats.fastestSolveMs, undefined);
  });

  // Gives both players one correct answer, but Grace takes 10s and Ada 20s. Checks that the
  // lower average correct-solve time places Grace first and Ada second.
  it('uses average correct solve time to break a score tie', function () {
    const results = calculateGameResults({
      game: makeGame({ totalRounds: 1 }),
      players: [
        { _id: 'ada', name: 'Ada' },
        { _id: 'grace', name: 'Grace' },
      ],
      rounds: [
        makeRound('ada', 1, 'correct', 0, 20000),
        makeRound('grace', 1, 'correct', 0, 10000),
      ],
      outcome: 'won',
      generatedAt: at(30000),
    });
    assert.deepEqual(
      results.map((r) => [r.playerId, r.rank]),
      [
        ['grace', 1],
        ['ada', 2],
      ]
    );
  });

  // Calculates results with no players and no rounds. Checks that the function returns an empty
  // array.
  it('returns no results for an empty team', function () {
    assert.deepEqual(
      calculateGameResults({
        game: makeGame(),
        players: [],
        rounds: [],
        outcome: 'lost',
        generatedAt: at(0),
      }),
      []
    );
  });
});
