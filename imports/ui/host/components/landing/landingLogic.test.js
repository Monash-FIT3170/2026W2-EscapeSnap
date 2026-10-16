import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  cleanRoomCode,
  formatDuration,
  isDemoAnswer,
  isValidRoomCode,
  joinProblem,
  normaliseAnswer,
} from './landingLogic.js';

describe('room code validation', () => {
  it('keeps only digits and caps the code at four', () => {
    assert.equal(cleanRoomCode('4821'), '4821');
    assert.equal(cleanRoomCode('48 21'), '4821');
    assert.equal(cleanRoomCode('12ab345'), '1234');
    assert.equal(cleanRoomCode(''), '');
    assert.equal(cleanRoomCode(undefined), '');
  });

  it('accepts exactly four digits', () => {
    assert.equal(isValidRoomCode('4821'), true);
    assert.equal(isValidRoomCode('0000'), true);
    for (const bad of ['', '482', '48211', '48a1', 'abcd', ' 4821']) {
      assert.equal(isValidRoomCode(bad), false, bad);
    }
  });

  it('asks for the name first, then a full code', () => {
    assert.equal(joinProblem('', '4821'), 'name');
    assert.equal(joinProblem('   ', '4821'), 'name');
    assert.equal(joinProblem(undefined, ''), 'name');
    assert.equal(joinProblem('Ada', '482'), 'code');
    assert.equal(joinProblem('Ada', ''), 'code');
    assert.equal(joinProblem(' Ada ', '4821'), null);
  });
});

describe('riddle answer check', () => {
  it('accepts door, a door and the door in any case', () => {
    for (const ok of [
      'door',
      'DOOR',
      'a door',
      'the door',
      'The Door.',
      '  A   door  ',
      'door!',
    ]) {
      assert.equal(isDemoAnswer(ok), true, ok);
    }
  });

  it('rejects other words', () => {
    for (const bad of ['', 'doors', 'floor', 'the', 'a', 'adoor', 'dor']) {
      assert.equal(isDemoAnswer(bad), false, bad);
    }
  });

  it('strips articles, punctuation and spaces when normalising', () => {
    assert.equal(normaliseAnswer('The Door.'), 'DOOR');
    assert.equal(normaliseAnswer('an open door'), 'OPENDOOR');
    assert.equal(normaliseAnswer(null), '');
  });

  it('formats the escape time as m:ss', () => {
    assert.equal(formatDuration(0), '0:01');
    assert.equal(formatDuration(75000), '1:15');
    assert.equal(formatDuration(600000), '10:00');
  });
});
