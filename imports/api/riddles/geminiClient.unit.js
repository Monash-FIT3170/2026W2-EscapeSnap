import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it, mock } from 'node:test';
import { generateFinalRiddle, generateRoundRiddles } from './geminiClient.js';
import {
  geminiResponse,
  SEEDED_RIDDLE,
  SEEDED_FINAL_RIDDLE,
} from '../testing/seededScenario.js';

describe('seeded riddle generation', () => {
  let previousKey;
  beforeEach(() => {
    previousKey = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = 'test-only-key';
    mock.method(globalThis, 'fetch', async () => {
      throw new Error('Live network is forbidden');
    });
    mock.method(console, 'warn', () => {});
  });
  afterEach(() => {
    mock.restoreAll();
    if (previousKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previousKey;
  });

  // Stubs Gemini to return the cup fixture, then generates twice. Checks that the request schema
  // permits cup and both calls return exactly the same text, answer and hint.
  it('returns the same cup riddle on every request', async () => {
    fetch.mock.mockImplementation(async (_url, options) => {
      const body = JSON.parse(options.body);
      assert.ok(
        body.generationConfig.responseSchema.properties.riddles.items.properties.answer.enum.includes(
          'cup'
        )
      );
      return geminiResponse({ riddles: [SEEDED_RIDDLE] });
    });
    for (let i = 0; i < 2; i++) {
      assert.deepEqual(await generateRoundRiddles({ count: 1 }), [
        SEEDED_RIDDLE,
      ]);
    }
  });
  // Stubs a mixed response containing the valid cup fixture, an unsupported dragon answer, an
  // incomplete cup entry and null. Checks that only the complete supported cup riddle survives
  // validation.
  it('filters unsupported objects and incomplete riddles', async () => {
    fetch.mock.mockImplementation(async () =>
      geminiResponse({
        riddles: [
          SEEDED_RIDDLE,
          { ...SEEDED_RIDDLE, answer: 'dragon' },
          { answer: 'cup' },
          null,
        ],
      })
    );
    assert.deepEqual(await generateRoundRiddles({ count: 4 }), [SEEDED_RIDDLE]);
  });
  // Stubs an empty riddle pool. Checks generation rejects with a no-valid-round-riddles error
  // rather than returning unusable data.
  it('rejects a pool with no valid riddles', async () => {
    fetch.mock.mockImplementation(async () => geminiResponse({ riddles: [] }));
    await assert.rejects(
      generateRoundRiddles({ count: 1 }),
      /no valid round riddles/
    );
  });
  // Requests zero riddles. Checks an empty array is returned and fetch is never called.
  it('does not contact AI when no riddles are requested', async () => {
    assert.deepEqual(await generateRoundRiddles({ count: 0 }), []);
    assert.equal(fetch.mock.callCount(), 0);
  });
  // Stubs the final answer as k-e-y for a three-letter request. Checks that normalization
  // returns the exact KEY final-riddle fixture.
  it('normalizes the fixed final answer to KEY', async () => {
    fetch.mock.mockImplementation(async () =>
      geminiResponse({ ...SEEDED_FINAL_RIDDLE, answer: 'k-e-y' })
    );
    assert.deepEqual(
      await generateFinalRiddle({ letterCount: 3 }),
      SEEDED_FINAL_RIDDLE
    );
  });
  // Stubs LOCK on the first three-letter request and KEY on the second. Checks that generation
  // retries once, accepts the KEY fixture and makes exactly two calls.
  it('retries an incorrect answer length and accepts the next valid answer', async () => {
    let calls = 0;
    fetch.mock.mockImplementation(async () =>
      geminiResponse({
        ...SEEDED_FINAL_RIDDLE,
        answer: ++calls === 1 ? 'LOCK' : 'KEY',
      })
    );
    assert.deepEqual(
      await generateFinalRiddle({ letterCount: 3 }),
      SEEDED_FINAL_RIDDLE
    );
    assert.equal(calls, 2);
  });
  // Stubs LOCK for every three-letter final-riddle request. Checks rejection after three
  // attempts and exactly three fetch calls.
  it('stops after three invalid final answers', async () => {
    fetch.mock.mockImplementation(async () =>
      geminiResponse({ ...SEEDED_FINAL_RIDDLE, answer: 'LOCK' })
    );
    await assert.rejects(
      generateFinalRiddle({ letterCount: 3 }),
      /after 3 attempts/
    );
    assert.equal(fetch.mock.callCount(), 3);
  });
  // Injects AbortError on the first generation request and a valid cup response on the next.
  // Checks one retry and the returned cup fixture without waiting for a real timeout.
  it('retries one timeout without waiting for a real timeout', async () => {
    let calls = 0;
    fetch.mock.mockImplementation(async () => {
      if (++calls === 1)
        throw Object.assign(new Error('timeout'), { name: 'AbortError' });
      return geminiResponse({ riddles: [SEEDED_RIDDLE] });
    });
    assert.deepEqual(await generateRoundRiddles({ count: 1 }), [SEEDED_RIDDLE]);
    assert.equal(calls, 2);
  });
  // Stubs HTTP 429 with a quota message. Checks the error propagates and fetch is called once,
  // since only timeouts should retry.
  it('does not retry HTTP errors', async () => {
    fetch.mock.mockImplementation(async () => ({
      ok: false,
      status: 429,
      text: async () => 'quota',
    }));
    await assert.rejects(generateRoundRiddles({ count: 1 }), /429/);
    assert.equal(fetch.mock.callCount(), 1);
  });
});
