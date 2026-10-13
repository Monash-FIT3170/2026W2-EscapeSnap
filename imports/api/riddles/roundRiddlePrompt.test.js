import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildRoundRiddleRequest } from './roundRiddlePrompt.js';
import { THEME_OBJECT_POOLS } from '../../lib/cocoClasses.js';

const answerSchema = (request) =>
  request.schema.properties.riddles.items.properties.answer;

describe('buildRoundRiddleRequest — preset themes', () => {
  it('constrains answers to the theme object pool', () => {
    const request = buildRoundRiddleRequest({ count: 4, theme: 'home' });
    assert.deepEqual(answerSchema(request).enum, THEME_OBJECT_POOLS.home);
    assert.match(request.prompt, /a player's home/);
    assert.match(request.prompt, /fixed list of object names/);
    assert.doesNotMatch(request.prompt, /world of/);
  });

  it('only accepts answers from the pool', () => {
    const { isValidAnswer } = buildRoundRiddleRequest({
      count: 4,
      theme: 'classroom',
    });
    assert.equal(isValidAnswer('laptop'), true);
    assert.equal(isValidAnswer('wand'), false);
  });

  it('ignores custom theme text unless the theme is custom', () => {
    const request = buildRoundRiddleRequest({
      count: 4,
      theme: 'classroom',
      customTheme: 'Harry Potter',
    });
    assert.doesNotMatch(request.prompt, /Harry Potter/);
  });
});

describe('buildRoundRiddleRequest — custom theme, camera mode', () => {
  const request = buildRoundRiddleRequest({
    count: 4,
    theme: 'custom',
    customTheme: 'Harry Potter',
    mode: 'camera',
  });

  it('keeps answers to everyday classroom objects', () => {
    assert.deepEqual(answerSchema(request).enum, THEME_OBJECT_POOLS.classroom);
    assert.equal(request.isValidAnswer('cell phone'), true);
    assert.equal(request.isValidAnswer('wand'), false);
  });

  it('asks for riddles written in the style of the theme', () => {
    assert.match(request.prompt, /world of "Harry Potter"/);
    assert.match(request.prompt, /fixed list of object names/);
  });
});

describe('buildRoundRiddleRequest — custom theme, drawing mode', () => {
  const request = buildRoundRiddleRequest({
    count: 4,
    theme: 'custom',
    customTheme: 'Harry Potter',
    mode: 'drawing',
  });

  it('lets answers come from the theme itself', () => {
    assert.equal(answerSchema(request).enum, undefined);
    assert.match(request.prompt, /connected to the world of "Harry Potter"/);
    assert.doesNotMatch(request.prompt, /fixed list of object names/);
  });

  it('accepts short object names and rejects empty or long ones', () => {
    assert.equal(request.isValidAnswer('wand'), true);
    assert.equal(request.isValidAnswer('sorting hat'), true);
    assert.equal(request.isValidAnswer(''), false);
    assert.equal(request.isValidAnswer('   '), false);
    assert.equal(request.isValidAnswer('a'.repeat(31)), false);
    assert.equal(request.isValidAnswer(undefined), false);
  });
});

describe('buildRoundRiddleRequest — custom theme with no text', () => {
  it('falls back to the classroom preset', () => {
    const request = buildRoundRiddleRequest({
      count: 4,
      theme: 'custom',
      customTheme: '',
    });
    assert.deepEqual(answerSchema(request).enum, THEME_OBJECT_POOLS.classroom);
    assert.match(request.prompt, /a university classroom/);
  });
});

describe('buildRoundRiddleRequest — preset theme, drawing mode', () => {
  const request = buildRoundRiddleRequest({
    count: 4,
    theme: 'home',
    mode: 'drawing',
  });

  it('does not limit answers to the object pool', () => {
    assert.equal(answerSchema(request).enum, undefined);
    assert.doesNotMatch(request.prompt, /fixed list of object names/);
    assert.equal(request.isValidAnswer('teapot'), true);
  });

  it('keeps answers connected to the preset theme', () => {
    assert.match(request.prompt, /connected to a home/);
  });
});
