import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildClassifyPrompt, submissionMimeType } from './classifyPrompt.js';

const JSON_INSTRUCTION =
  'Respond with strict JSON only, no markdown: {"outcome": "pass" or "fail", "explanation": "one short sentence"}';

describe('buildClassifyPrompt', () => {
  it('keeps the original photo prompt for camera mode', () => {
    assert.equal(
      buildClassifyPrompt('cup', 'camera'),
      `Does this photo clearly show a "cup"? Ignore any other objects, people, or background in the frame — only judge whether a "cup" is present. ${JSON_INSTRUCTION}`
    );
  });

  it('uses the photo prompt when mode is missing or unknown', () => {
    assert.equal(
      buildClassifyPrompt('cup'),
      buildClassifyPrompt('cup', 'camera')
    );
    assert.equal(
      buildClassifyPrompt('cup', 'video'),
      buildClassifyPrompt('cup', 'camera')
    );
  });

  it('uses a lenient sketch prompt for drawing mode', () => {
    const prompt = buildClassifyPrompt('cup', 'drawing');
    assert.match(prompt, /hand-drawn sketch/);
    assert.match(prompt, /"cup"/);
    assert.match(prompt, /generous about drawing skill/);
    assert.ok(prompt.endsWith(JSON_INSTRUCTION));
  });
});

describe('submissionMimeType', () => {
  it('is png for drawings and jpeg otherwise', () => {
    assert.equal(submissionMimeType('drawing'), 'image/png');
    assert.equal(submissionMimeType('camera'), 'image/jpeg');
    assert.equal(submissionMimeType(undefined), 'image/jpeg');
  });
});
