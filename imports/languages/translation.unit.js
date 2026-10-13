import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync, readdirSync } from 'node:fs';
import { parse } from '@babel/parser';
import { LOCALES } from './index.js';
import { createTranslation } from './translate.js';
import { COCO_CLASSES } from '../lib/cocoClasses.js';
import { BADGE_DEFINITIONS } from '../api/achievements/badgeDefinitions.js';
import {
  buildShareText,
  renderShareCard,
} from '../ui/mobile/components/result/shareCard.js';

function flatten(object, prefix = '') {
  return Object.fromEntries(
    Object.entries(object).flatMap(([key, value]) =>
      typeof value === 'string'
        ? [[prefix + key, value]]
        : Object.entries(flatten(value, `${prefix}${key}.`))
    )
  );
}
const placeholders = (text) =>
  [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();

test('every locale covers every UI key, placeholder, object and badge', () => {
  const english = flatten(LOCALES.en.messages);
  for (const [code, { messages }] of Object.entries(LOCALES)) {
    const translated = flatten(messages);
    assert.deepEqual(
      Object.keys(translated).sort(),
      Object.keys(english).sort(),
      code
    );
    for (const [key, value] of Object.entries(english)) {
      assert.ok(translated[key].trim(), `${code}: ${key}`);
      assert.deepEqual(
        placeholders(translated[key]),
        placeholders(value),
        `${code}: ${key}`
      );
    }
    for (const object of COCO_CLASSES)
      assert.ok(messages.objects[object], `${code}: ${object}`);
    for (const id of Object.keys(BADGE_DEFINITIONS)) {
      assert.ok(messages.extra[`${id}Name`]);
      assert.ok(messages.extra[`${id}Description`]);
    }
  }
});

test('missing translations never expose English or internal keys', () => {
  for (const [code, { messages }] of Object.entries(LOCALES)) {
    const t = createTranslation(code);
    assert.equal(t('missing.key'), messages.errors.unknown);
    assert.equal(t('objects.unexpected'), messages.extra.unknownObject);
    assert.equal(t('extra.awaitingPlayers', { n: 3 }).includes('{n}'), false);
  }
});

function files(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? files(`${directory}/${entry.name}`)
      : [`${directory}/${entry.name}`]
  );
}
function walk(node, visit) {
  if (!node || typeof node !== 'object') return;
  visit(node);
  for (const [key, value] of Object.entries(node)) {
    if (key === 'loc') continue;
    if (Array.isArray(value)) value.forEach((child) => walk(child, visit));
    else walk(value, visit);
  }
}

test('UI contains no hardcoded JSX prose or accessibility labels except the product name', () => {
  for (const path of files('imports/ui').filter((path) =>
    path.endsWith('.jsx')
  )) {
    const tree = parse(readFileSync(path, 'utf8'), {
      sourceType: 'module',
      plugins: ['jsx'],
    });
    walk(tree, (node) => {
      if (
        node.type === 'CallExpression' &&
        node.callee.name === 't' &&
        node.arguments[0]?.type === 'StringLiteral'
      ) {
        const key = node.arguments[0].value;
        assert.ok(
          flatten(LOCALES.en.messages)[key],
          `${path}: missing key ${key}`
        );
      }
      if (node.type === 'JSXText' && /[a-z]/i.test(node.value)) {
        assert.ok(
          ['ESCAPESNAP', '#ESCAPESNAP', 'ESCAPE', 'SNAP'].includes(
            node.value.trim()
          ),
          `${path}:${node.loc.start.line} ${node.value}`
        );
      }
      if (
        node.type === 'JSXAttribute' &&
        ['alt', 'title', 'placeholder', 'aria-label'].includes(node.name.name)
      ) {
        assert.ok(
          node.value?.type !== 'StringLiteral' || !node.value.value,
          `${path}:${node.loc.start.line}`
        );
      }
    });
  }
});

const snapshot = {
  outcome: 'won',
  operativeName: 'Alex',
  score: 2000,
  difficulty: 'MEDIUM',
  missionRef: '1234',
  correct: 2,
  totalRounds: 3,
  accuracy: 67,
  timeUsedSeconds: 65,
  recoveredLetters: ['B', 'O', 'K'],
  squadRank: 1,
  squadSize: 1,
  squadBoard: [{ rank: 1, name: 'Alex', score: 2000, isCurrent: true }],
};
const sections = {
  result: true,
  score: true,
  stats: true,
  fragments: true,
  squad: true,
};

test('share captions translate prose while preserving names and English answer letters', () => {
  for (const code of Object.keys(LOCALES).filter((code) => code !== 'en')) {
    const t = createTranslation(code);
    const text = buildShareText(snapshot, sections, t, code);
    assert.ok(text.includes(t('mobile.share.afterActionReport')));
    assert.ok(text.includes('Alex'));
    assert.ok(text.includes('B O K'));
    assert.ok(!text.includes('AFTER-ACTION REPORT'));
    assert.ok(!text.includes('Key fragments:'));
  }
});

test('exported image uses the selected language, not just the on-screen preview', async () => {
  const original = globalThis.document;
  try {
    for (const locale of ['es', 'ar', 'zh']) {
      const drawn = [];
      const context = new Proxy(
        { fillText: (text) => drawn.push(text) },
        {
          get: (target, key) => target[key] ?? (() => {}),
        }
      );
      globalThis.document = {
        createElement: () => ({
          getContext: () => context,
          toBlob: (callback) => callback({}),
        }),
      };
      const t = createTranslation(locale);
      await renderShareCard({ snapshot, sections, t, locale });
      assert.ok(drawn.includes(t('mobile.share.afterActionReport')));
      assert.ok(drawn.some((text) => text.includes(t('difficulty.medium'))));
      assert.ok(!drawn.includes('MISSION SCORE'));
      assert.ok(!drawn.includes('MEDIUM'));
      assert.ok(drawn.includes('B'));
    }
  } finally {
    globalThis.document = original;
  }
});
