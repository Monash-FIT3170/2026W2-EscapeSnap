import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createTranslator } from './translateText.js';

test('English bypasses provider; translations coalesce and cache by text and locale', async () => {
  let calls = 0;
  const translate = createTranslator(async () => {
    calls++;
    return { text: `Traduction ${calls}` };
  });
  assert.equal(await translate('I have pages.', 'en'), 'I have pages.');
  assert.equal(calls, 0);
  const [a, b] = await Promise.all([
    translate('I have pages.', 'fr'),
    translate('I have pages.', 'fr'),
  ]);
  assert.equal(a, b);
  assert.equal(calls, 1);
  assert.equal(await translate('I have pages.', 'fr'), a);
  await translate('I have pages.', 'es');
  await translate('I have hands.', 'fr');
  assert.equal(calls, 3);
});

test('failures and invalid responses can be retried without caching English', async () => {
  let response = {};
  const translate = createTranslator(async () => response);
  await assert.rejects(translate('English clue', 'fr'));
  response = { text: 'English clue' };
  await assert.rejects(translate('English clue', 'fr'));
  response = { text: 'Indice français' };
  assert.equal(await translate('English clue', 'fr'), response.text);
  await assert.rejects(translate('English clue', 'xx'));
  await assert.rejects(translate('', 'fr'));
});

test('cache is bounded and never stores or mutates canonical answers', async () => {
  let calls = 0;
  const original = { riddle: 'I hold words.', answer: 'BOOK', hint: 'Pages' };
  const translate = createTranslator(
    async (prompt) => {
      calls++;
      assert.ok(!prompt.includes('BOOK'));
      return { text: 'Je contiens des mots.' };
    },
    { maxEntries: 1 }
  );
  await translate(original.riddle, 'fr');
  await translate(original.hint, 'fr');
  await translate(original.riddle, 'fr');
  assert.equal(calls, 3);
  assert.equal(original.answer, 'BOOK');
  assert.equal(original.riddle, 'I hold words.');
});
