/**
 * Self-checks for the adaptive practice engine.
 *
 * Run with:  node src/services/adaptive.test.js
 */

import assert from 'node:assert/strict';

if (typeof localStorage === 'undefined') {
  globalThis.localStorage = {
    _d: {},
    getItem(k) { return this._d[k] ?? null; },
    setItem(k, v) { this._d[k] = String(v); },
    removeItem(k) { delete this._d[k]; },
    key(i) { return Object.keys(this._d)[i] ?? null; },
    get length() { return Object.keys(this._d).length; },
    clear() { this._d = {}; },
  };
} else {
  localStorage.clear();
}

const storage = await import('./storage.js');
const { weakKeys, weakKeySummary, generateWeakKeyText } = await import('./adaptive.js');

const checks = [];
const check = (name, fn) => checks.push([name, fn]);

const seedHistory = (sessions) => {
  storage.set('history', sessions);
};

const makeSession = (mistakes, extras = {}) => ({
  wpm: 50, accuracy: 90, errors: Object.keys(mistakes).length,
  ...extras,
  mistakesByKey: mistakes,
  mode: 'words', difficulty: 'medium', timestamp: Date.now() + Math.random(),
});

check('weakKeys returns keys sorted by mistake count', () => {
  localStorage.clear();
  seedHistory([
    makeSession({ e: 10, t: 5, s: 2, a: 8 }),
    makeSession({ e: 3, t: 4, a: 1 }),
  ]);
  const keys = weakKeys(5, 1);
  assert.ok(keys.includes('e'), 'e should be a weak key');
  assert.ok(keys.includes('a'), 'a should be a weak key');
  // 'e' has the highest count, so it should be first.
  assert.equal(keys[0], 'e');
});

check('weakKeys respects minMistakes', () => {
  localStorage.clear();
  seedHistory([makeSession({ e: 1, t: 5 })]);
  const keys = weakKeys(5, 3);
  assert.ok(!keys.includes('e'), 'e with only 1 mistake is below minMistakes=3');
  assert.ok(keys.includes('t'), 't with 5 mistakes is above the floor');
});

check('weakKeys returns [] when there are no qualifying keys', () => {
  localStorage.clear();
  seedHistory([makeSession({ x: 1 })]);
  const keys = weakKeys(5, 2);
  assert.deepEqual(keys, []);
});

check('weakKeySummary produces a sorted list of {key, count}', () => {
  localStorage.clear();
  seedHistory([makeSession({ q: 10, w: 3, e: 5 })]);
  const summary = weakKeySummary();
  assert.equal(summary[0].key, 'q');
  assert.equal(summary[0].count, 10);
});

check('generateWeakKeyText returns fallback when no weak keys', async () => {
  localStorage.clear();
  seedHistory([makeSession({ x: 1 })]);
  const text = await generateWeakKeyText({ count: 20, minMistakes: 3 });
  // Fallback path returns ordinary words, not specifically targeted.
  // We don't assert the words themselves (the pool varies), only
  // that the function returned something non-empty.
  assert.ok(text.length > 0);
  assert.ok(text.split(' ').length >= 1);
});

check('generateWeakKeyText with a strong signal returns targeted text', async () => {
  localStorage.clear();
  // Force a key with many mistakes so the engine has signal to
  // target. We use 'r' because it's a common letter that should
  // appear in many words across difficulties.
  seedHistory([
    makeSession({ r: 25 }),
    makeSession({ r: 15 }),
  ]);
  const text = await generateWeakKeyText({ count: 30, minMistakes: 1, weakKeyCount: 3 });
  // Many of the produced words should contain 'r' since that's the
  // most-failed key. The exact count varies by difficulty pool,
  // but it should be at least 30% of words containing r.
  const words = text.split(' ');
  const withR = words.filter((w) => w.toLowerCase().includes('r')).length;
  const ratio = withR / words.length;
  assert.ok(ratio > 0.3, `expected >30% of words to contain 'r', got ${(ratio * 100).toFixed(0)}%`);
});

check('generateWeakKeyText does not exceed the requested count by much', async () => {
  localStorage.clear();
  seedHistory([makeSession({ a: 50, b: 30 })]);
  const text = await generateWeakKeyText({ count: 25 });
  // We may pad with general words if the pool is small, but we
  // should never return dramatically more than requested.
  const wc = text.split(' ').length;
  assert.ok(wc <= 50, `expected <=50 words, got ${wc}`);
});

let failed = 0;
for (const [name, fn] of checks) {
  try {
    await fn();
    console.log(`  ok  ${name}`);
  } catch (err) {
    failed++;
    console.error(`FAIL  ${name}\n      ${err.message}`);
  }
}
console.log(`\n${checks.length - failed}/${checks.length} passed`);
process.exit(failed ? 1 : 0);
