import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it, mock } from 'node:test';
import { classifyWithGemini } from './classifyWithGemini.js';
import { geminiResponse, SEEDED_RIDDLE } from '../testing/seededScenario.js';

describe('seeded photo classification', () => {
  let previousKey;
  beforeEach(() => {
    previousKey = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = 'test-only-key';
    mock.method(globalThis, 'fetch', async () => {
      throw new Error('Unconfigured test response: live network is forbidden');
    });
    mock.method(console, 'error', () => {});
  });
  afterEach(() => {
    mock.restoreAll();
    if (previousKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previousKey;
  });

  for (const outcome of ['pass', 'fail']) {
    // Runs once with a pass verdict and once with fail. Checks the outgoing prompt targets cup,
    // the JPEG payload contains the fixed base64 string, the verdict/explanation are preserved,
    // and exactly one request is made.
    it(`returns the fixed ${outcome} response and sends the photo and seeded target`, async () => {
      globalThis.fetch.mock.mockImplementation(async (_url, options) => {
        const body = JSON.parse(options.body);
        assert.ok(body.contents[0].parts[0].text.includes('"cup"'));
        assert.deepEqual(body.contents[0].parts[1].inline_data, {
          mime_type: 'image/jpeg',
          data: 'fixture-photo-base64',
        });
        return geminiResponse({ outcome, explanation: 'Seeded verdict' });
      });
      assert.deepEqual(
        await classifyWithGemini('fixture-photo-base64', SEEDED_RIDDLE.answer),
        {
          outcome,
          explanation: 'Seeded verdict',
        }
      );
      assert.equal(fetch.mock.callCount(), 1);
    });
  }

  // Removes the Gemini API key before classifying. Checks an error outcome and zero fetch calls,
  // so missing configuration cannot trigger a network request.
  it('reports missing configuration without making a request', async () => {
    delete process.env.GEMINI_API_KEY;
    assert.equal((await classifyWithGemini('photo', 'cup')).outcome, 'error');
    assert.equal(fetch.mock.callCount(), 0);
  });

  for (const [name, response] of [
    [
      'HTTP failure',
      async () => ({ ok: false, status: 503, text: async () => 'unavailable' }),
    ],
    [
      'malformed JSON',
      async () => ({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: '{broken' }] } }],
        }),
      }),
    ],
    ['empty content', async () => ({ ok: true, json: async () => ({}) })],
    ['unsupported verdict', async () => geminiResponse({ outcome: 'maybe' })],
    [
      'network failure',
      async () => {
        throw new Error('offline');
      },
    ],
    [
      'timeout',
      async () => {
        throw Object.assign(new Error('timeout'), { name: 'AbortError' });
      },
    ],
  ]) {
    // Runs separately for HTTP 503, malformed JSON, empty content, an unsupported verdict,
    // network failure and AbortError. Checks each returns the same retryable error response
    // after one request, never a pass verdict.
    it(`returns a retryable error for ${name}`, async () => {
      fetch.mock.mockImplementation(response);
      assert.deepEqual(await classifyWithGemini('photo', 'cup'), {
        outcome: 'error',
        explanation: 'Could not verify photo — try again.',
      });
      assert.equal(fetch.mock.callCount(), 1);
    });
  }
});
