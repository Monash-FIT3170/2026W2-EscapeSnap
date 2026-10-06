import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  createGeminiCaller,
  modelCandidates,
  supportsThinkingLevel,
} from './geminiModels.js';

const MODELS = ['model-a', 'model-b', 'model-c'];

// Fake fetch: answers each model with the status in `statuses` (default 200)
// and records which models were called, in order.
function fakeFetch(statuses = {}) {
  const calls = [];
  const fetchImpl = async (url) => {
    const model = url.match(/models\/([^:]+):/)[1];
    calls.push(model);
    const status = statuses[model] ?? 200;
    return {
      ok: status === 200,
      status,
      json: async () => ({ answeredBy: model }),
      text: async () => `status ${status}`,
    };
  };
  return { fetchImpl, calls };
}

function caller(fetchImpl, clock = { now: 0 }) {
  return createGeminiCaller({
    apiKey: 'test-key',
    fetchImpl,
    now: () => clock.now,
    log: () => {},
  });
}

const body = () => ({ contents: [] });

describe('modelCandidates', () => {
  it('puts the preferred model first and removes duplicates', () => {
    const list = modelCandidates('gemini-flash-latest');
    assert.equal(list[0], 'gemini-flash-latest');
    assert.equal(new Set(list).size, list.length);
    assert.ok(list.includes('gemini-3-flash-preview'));
  });

  it('works with no preferred model', () => {
    assert.deepEqual(modelCandidates(undefined), modelCandidates(''));
    assert.ok(modelCandidates(undefined).length >= 2);
  });
});

describe('supportsThinkingLevel', () => {
  it('is true only for Gemini 3 models', () => {
    assert.equal(supportsThinkingLevel('gemini-3-flash-preview'), true);
    assert.equal(supportsThinkingLevel('gemini-flash-latest'), false);
    assert.equal(supportsThinkingLevel('gemini-2.5-flash'), false);
  });
});

describe('createGeminiCaller', () => {
  it('uses the first model when it answers', async () => {
    const { fetchImpl, calls } = fakeFetch();
    const result = await caller(fetchImpl).generate(body, { models: MODELS });
    assert.deepEqual(calls, ['model-a']);
    assert.equal(result.model, 'model-a');
    assert.deepEqual(result.data, { answeredBy: 'model-a' });
  });

  for (const status of [503, 429, 500, 404]) {
    it(`falls back to the next model on ${status}`, async () => {
      const { fetchImpl, calls } = fakeFetch({ 'model-a': status });
      const result = await caller(fetchImpl).generate(body, { models: MODELS });
      assert.deepEqual(calls, ['model-a', 'model-b']);
      assert.equal(result.model, 'model-b');
    });
  }

  it('stops without falling back on a 400', async () => {
    const { fetchImpl, calls } = fakeFetch({ 'model-a': 400 });
    await assert.rejects(
      caller(fetchImpl).generate(body, { models: MODELS }),
      (err) => err.status === 400
    );
    assert.deepEqual(calls, ['model-a']);
  });

  it('throws the last error when every model fails', async () => {
    const { fetchImpl, calls } = fakeFetch({
      'model-a': 503,
      'model-b': 503,
      'model-c': 429,
    });
    await assert.rejects(
      caller(fetchImpl).generate(body, { models: MODELS }),
      (err) => err.status === 429
    );
    assert.deepEqual(calls, MODELS);
  });

  it('skips a busy model for 60 seconds, then tries it again', async () => {
    const clock = { now: 0 };
    const statuses = { 'model-a': 503 };
    const { fetchImpl, calls } = fakeFetch(statuses);
    const gemini = caller(fetchImpl, clock);

    await gemini.generate(body, { models: MODELS });
    assert.deepEqual(calls, ['model-a', 'model-b']);

    calls.length = 0;
    clock.now = 59_000;
    await gemini.generate(body, { models: MODELS });
    assert.deepEqual(calls, ['model-b'], 'busy model skipped during cooldown');

    calls.length = 0;
    clock.now = 61_000;
    delete statuses['model-a'];
    await gemini.generate(body, { models: MODELS });
    assert.deepEqual(calls, ['model-a'], 'busy model retried after cooldown');
  });

  it('retries a missing (404) model on the next call', async () => {
    const { fetchImpl, calls } = fakeFetch({ 'model-a': 404 });
    const gemini = caller(fetchImpl);
    await gemini.generate(body, { models: MODELS });
    calls.length = 0;
    await gemini.generate(body, { models: MODELS });
    assert.deepEqual(calls, ['model-a', 'model-b']);
  });

  it('still tries cooling-down models when nothing else is left', async () => {
    const clock = { now: 0 };
    const statuses = { 'model-a': 503, 'model-b': 503, 'model-c': 503 };
    const { fetchImpl, calls } = fakeFetch(statuses);
    const gemini = caller(fetchImpl, clock);
    await assert.rejects(gemini.generate(body, { models: MODELS }));

    calls.length = 0;
    clock.now = 1_000;
    statuses['model-b'] = 200;
    const result = await gemini.generate(body, { models: MODELS });
    assert.equal(result.model, 'model-b');
  });

  it('builds the request body per model', async () => {
    const seen = [];
    const fetchImpl = async (url, init) => {
      seen.push(JSON.parse(init.body));
      const model = url.match(/models\/([^:]+):/)[1];
      const status = model === 'model-a' ? 503 : 200;
      return {
        ok: status === 200,
        status,
        json: async () => ({}),
        text: async () => '',
      };
    };
    await caller(fetchImpl).generate((model) => ({ model }), {
      models: MODELS,
    });
    assert.deepEqual(seen, [{ model: 'model-a' }, { model: 'model-b' }]);
  });

  it('throws when no API key is configured', async () => {
    const { fetchImpl, calls } = fakeFetch();
    const gemini = createGeminiCaller({ apiKey: '', fetchImpl, log: () => {} });
    await assert.rejects(
      gemini.generate(body, { models: MODELS }),
      /GEMINI_API_KEY/
    );
    assert.deepEqual(calls, []);
  });
});
