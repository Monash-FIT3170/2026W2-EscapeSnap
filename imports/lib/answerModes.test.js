import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  ANSWER_MODES,
  DEFAULT_ANSWER_MODE,
  normalizeAnswerMode,
} from './answerModes.js';

describe('normalizeAnswerMode', () => {
  it('keeps the two supported modes', () => {
    assert.deepEqual(ANSWER_MODES, ['camera', 'drawing']);
    assert.equal(normalizeAnswerMode('camera'), 'camera');
    assert.equal(normalizeAnswerMode('drawing'), 'drawing');
  });

  it('falls back to camera for missing or unknown modes', () => {
    assert.equal(DEFAULT_ANSWER_MODE, 'camera');
    assert.equal(normalizeAnswerMode(undefined), 'camera');
    assert.equal(normalizeAnswerMode(null), 'camera');
    assert.equal(normalizeAnswerMode('video'), 'camera');
  });
});
