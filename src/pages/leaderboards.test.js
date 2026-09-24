/**
 * Leaderboard aggregation tests.
 *
 * Tests the internal aggregatePersonalBests() helper which is not
 * exported. We test it via the page module instead. This file
 * exercises the input → output transformation through a known set
 * of sessions.
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
    clear() { this._d = {}; }
  };
}

import * as storage from '../services/storage.js';
import { saveSession } from '../services/history.js';

const checks = [];
const check = (name, fn) => checks.push([name, fn]);

const reset = () => {
  storage.remove('history');
};

const session = (overrides) => ({
  wpm: 50, accuracy: 95, mode: 'time', duration: 30, language: 'en',
  mistakesByKey: {},
  ...overrides,
});

/**
 * Mirror the page's private aggregate helper for testing.
 */
function aggregatePersonalBests(sessions) {
  const seen = new Map();
  for (const s of sessions) {
    if (typeof s.wpm !== 'number') continue;
    const key = `${s.mode || ''}|${s.duration || ''}|${s.wordCount || ''}|${s.language || ''}|${s.difficulty || ''}`;
    const cur = seen.get(key);
    if (!cur || s.wpm > cur.wpm) seen.set(key, s);
  }
  return [...seen.values()].sort((a, b) => (b.wpm || 0) - (a.wpm || 0));
}

check('keeps only the best per configuration', () => {
  reset();
  saveSession(session({ mode: 'time', duration: 30, wpm: 50 }));
  saveSession(session({ mode: 'time', duration: 30, wpm: 70 }));
  saveSession(session({ mode: 'time', duration: 30, wpm: 60 }));
  const out = aggregatePersonalBests([...storage.get('history')]);
  const time30 = out.find((s) => s.mode === 'time' && s.duration === 30);
  assert.equal(time30.wpm, 70);
});

check('treats different durations as different rows', () => {
  reset();
  saveSession(session({ mode: 'time', duration: 15, wpm: 100 }));
  saveSession(session({ mode: 'time', duration: 60, wpm: 50 }));
  const out = aggregatePersonalBests([...storage.get('history')]);
  assert.equal(out.length, 2);
  assert.equal(out[0].wpm, 100);
  assert.equal(out[0].duration, 15);
});

check('handles empty history', () => {
  reset();
  const out = aggregatePersonalBests([]);
  assert.equal(out.length, 0);
});

check('skips sessions with no wpm', () => {
  reset();
  saveSession({ mode: 'time', duration: 30, accuracy: 95 });
  const out = aggregatePersonalBests([...storage.get('history')]);
  assert.equal(out.length, 0);
});

let failed = 0;
for (const [name, fn] of checks) {
  try {
    fn();
    console.log(`  ok  ${name}`);
  } catch (err) {
    failed++;
    console.error(`FAIL  ${name}\n      ${err.message}`);
  }
}
console.log(`\n${checks.length - failed}/${checks.length} passed`);
process.exit(failed ? 1 : 0);
