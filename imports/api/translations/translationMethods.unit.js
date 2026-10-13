import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { test } from 'node:test';
import { createTranslator, TRANSLATION_LANGUAGES } from './translateText.js';

function harness() {
  const calls = [];
  const round = {
    riddleText: 'I hold words.',
    hint: 'Turn my pages.',
    answer: 'book',
  };
  const game = {
    finalRiddle: { riddle: 'I have pages.', hint: 'Read me.', answer: 'BOOK' },
  };
  let methods;
  const source = readFileSync(
    new URL('./translationMethods.js', import.meta.url),
    'utf8'
  ).replace(/^import .*;\n/gm, '');
  vm.runInNewContext(source, {
    Meteor: {
      methods: (value) => {
        methods = value;
      },
      Error: class extends Error {},
    },
    Games: { findOneAsync: async (id) => (id === 'game' ? game : null) },
    Rounds: { findOneAsync: async (id) => (id === 'round' ? round : null) },
    createTranslator,
    TRANSLATION_LANGUAGES,
    callGemini: async (prompt) => {
      calls.push(prompt);
      return { text: 'Une énigme.' };
    },
  });
  const context = { connection: {} };
  return {
    call: (...args) => methods['translations.riddle'].apply(context, args),
    calls,
    round,
    game,
    context,
  };
}

test('translation endpoint refuses answer fields, unknown IDs/locales and unrevealed hints', async () => {
  const h = harness();
  await assert.rejects(
    h.call('round', 'round', 'answer', 'fr'),
    /invalid-translation/
  );
  await assert.rejects(h.call('round', 'round', 'hint', 'fr'), /invalid-state/);
  await assert.rejects(h.call('final', 'missing', 'riddle', 'fr'), /not-found/);
  await assert.rejects(
    h.call('final', 'game', 'riddle', 'constructor'),
    /invalid-translation/
  );
  assert.equal(h.calls.length, 0);
  h.round.hintRevealedAt = new Date();
  assert.equal(await h.call('round', 'round', 'hint', 'fr'), 'Une énigme.');
  assert.ok(!h.calls[0].includes('BOOK'));
  assert.equal(h.round.answer, 'book');
  assert.equal(h.game.finalRiddle.answer, 'BOOK');
});

test('final and round English clues retain originals; translated content does not mutate records', async () => {
  const h = harness();
  assert.equal(
    await h.call('final', 'game', 'riddle', 'en'),
    h.game.finalRiddle.riddle
  );
  assert.equal(
    await h.call('round', 'round', 'riddle', 'en'),
    h.round.riddleText
  );
  assert.equal(h.calls.length, 0);
  assert.equal(await h.call('final', 'game', 'riddle', 'fr'), 'Une énigme.');
  assert.equal(h.game.finalRiddle.riddle, 'I have pages.');
  assert.equal(h.context.connection.translationPending, 0);
});

test('final answer checking still accepts English and rejects translated answers', async () => {
  const source = readFileSync(
    new URL('../games/gamesMethods.js', import.meta.url),
    'utf8'
  );
  const start = source.indexOf("  async 'games.submitFinalAnswer'");
  const methodSource = `({${source.slice(start, source.lastIndexOf('});'))}})`;
  const game = {
    status: 'in_progress',
    finalRiddle: { answer: 'BOOK' },
    finalRiddleAttempts: 0,
  };
  const methods = vm.runInNewContext(methodSource, {
    Meteor: { Error },
    Games: { findOneAsync: async () => game, updateAsync: async () => {} },
    finalizeGameResults: async () => {},
  });
  assert.equal(
    (await methods['games.submitFinalAnswer']('game', 'livre')).isCorrect,
    false
  );
  assert.equal(
    (await methods['games.submitFinalAnswer']('game', ' book ')).isCorrect,
    true
  );
});
