import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildEndgameShareSnapshot,
  calculateMissionScore,
} from './shareSnapshot.js';

test('calculateMissionScore includes objective, escape, time, and penalties', () => {
  const score = calculateMissionScore({
    outcome: 'won',
    correct: 2,
    totalRounds: 3,
    missed: 1,
    timeRemainingSeconds: 120,
    difficulty: 'easy',
    finalRiddleMisses: 1,
  });

  assert.deepEqual(score, {
    total: 4060,
    objectivePoints: 1800,
    evidenceBonus: 533,
    escapeBonus: 1800,
    timeBonus: 360,
    penalties: 430,
    multiplier: 1,
  });
});

test('calculateMissionScore does not award escape or time bonuses for a loss', () => {
  const score = calculateMissionScore({
    outcome: 'lost',
    correct: 1,
    totalRounds: 2,
    missed: 1,
    timeRemainingSeconds: 100,
    difficulty: 'medium',
    finalRiddleMisses: 0,
  });

  assert.equal(score.escapeBonus, 0);
  assert.equal(score.timeBonus, 0);
  assert.equal(score.total, 1290);
});

test('buildEndgameShareSnapshot ranks teammates and summarizes the current player', () => {
  const snapshot = buildEndgameShareSnapshot({
    game: {
      status: 'won',
      startedAt: '2026-10-06T10:00:00.000Z',
      endedAt: '2026-10-06T10:02:00.000Z',
      timerMinutes: 5,
      totalRounds: 2,
      difficulty: 'easy',
      finalRiddleAttempts: 0,
    },
    playerId: 'p1',
    players: [
      { _id: 'p1', name: 'Ada', joinedAt: '2026-10-06T09:00:00.000Z', revealedLetters: ['A', '?'] },
      { _id: 'p2', name: 'Grace', joinedAt: '2026-10-06T09:01:00.000Z', revealedLetters: ['B', 'C'] },
    ],
    rounds: [
      {
        _id: 'r1',
        playerId: 'p1',
        roundNumber: 1,
        status: 'correct',
        submittedAt: '2026-10-06T10:00:30.000Z',
      },
      {
        _id: 'r2',
        playerId: 'p1',
        roundNumber: 2,
        status: 'wrong',
        submittedAt: '2026-10-06T10:01:00.000Z',
      },
      {
        _id: 'r3',
        playerId: 'p2',
        roundNumber: 1,
        status: 'correct',
        submittedAt: '2026-10-06T10:01:30.000Z',
      },
      {
        _id: 'r4',
        playerId: 'p2',
        roundNumber: 2,
        status: 'correct',
        submittedAt: '2026-10-06T10:02:00.000Z',
      },
    ],
  });

  assert.equal(snapshot.outcome, 'won');
  assert.equal(snapshot.operativeName, 'Ada');
  assert.equal(snapshot.score, 3460);
  assert.equal(snapshot.correct, 1);
  assert.equal(snapshot.missed, 1);
  assert.equal(snapshot.accuracy, 50);
  assert.deepEqual(snapshot.recoveredLetters, ['A', '?']);
  assert.equal(snapshot.recoveredCount, 1);
  assert.equal(snapshot.timeUsedSeconds, 120);
  assert.equal(snapshot.timeRemainingSeconds, 180);
  assert.equal(snapshot.squadRank, 2);
  assert.equal(snapshot.squadBoard[0].name, 'Grace');
  assert.deepEqual(snapshot.globalLeaderboard, { available: false });
});

test('buildEndgameShareSnapshot tolerates missing game and player subscription data', () => {
  assert.equal(buildEndgameShareSnapshot({ game: null, playerId: 'p1' }), null);

  const snapshot = buildEndgameShareSnapshot({
    game: { status: 'lost', totalRounds: 0 },
    playerId: 'p1',
  });

  assert.equal(snapshot.operativeName, 'OPERATIVE');
  assert.equal(snapshot.squadSize, 1);
  assert.equal(snapshot.squadRank, 1);
  assert.equal(snapshot.timeUsedSeconds, null);
});
