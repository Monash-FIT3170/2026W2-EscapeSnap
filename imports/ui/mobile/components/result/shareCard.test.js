import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildShareText,
  formatMissionTime,
  formatScore,
} from './shareCard.js';

test('formats mission scores and elapsed time for the share card', () => {
  assert.equal(formatScore(1234567), '1,234,567');
  assert.equal(formatScore(null), '0');
  assert.equal(formatMissionTime(65), '01:05');
  assert.equal(formatMissionTime(-4), '00:00');
  assert.equal(formatMissionTime(null), '--:--');
});

test('buildShareText includes only the selected report sections', () => {
  const text = buildShareText(
    {
      outcome: 'won',
      operativeName: 'Ada',
      score: 1234,
      correct: 2,
      totalRounds: 3,
      accuracy: 67,
      timeUsedSeconds: 65,
      recoveredLetters: ['A', '?', 'C'],
      squadRank: 2,
      squadSize: 4,
    },
    {
      result: true,
      score: false,
      stats: true,
      fragments: false,
      squad: true,
    }
  );

  assert.equal(
    text,
    [
      'ESCAPESNAP // AFTER-ACTION REPORT',
      'Ada escaped the mission.',
      'Solved: 2/3 · Accuracy: 67% · Time: 01:05',
      'Squad standing: #2 of 4',
      '#EscapeSnap #MissionDebrief',
    ].join('\n')
  );
  assert.doesNotMatch(text, /Score:|Key fragments:/);
});

test('buildShareText uses the debrief message for a loss', () => {
  const text = buildShareText(
    {
      outcome: 'lost',
      operativeName: 'Grace',
      score: 0,
      correct: 0,
      totalRounds: 3,
      accuracy: 0,
      timeUsedSeconds: null,
      recoveredLetters: [],
      squadRank: 1,
      squadSize: 1,
    },
    { result: true }
  );

  assert.match(text, /Grace survived the debrief\./);
  assert.match(text, /#EscapeSnap #MissionDebrief/);
});
