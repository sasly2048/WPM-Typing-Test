/**
 * History analytics tests.
 *
 * Run: node src/services/history.test.js
 */
import assert from 'node:assert/strict';

// Run in a fresh localStorage. Node 22 has a real localStorage; older
// versions may need a shim. Set up the shim before importing the
// modules that touch localStorage at import time.
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

import * as storage from './storage.js';
import { saveSession, getModeBreakdown, getDailyStats, getStreakInfo, getPersonalBest, recordPersonalBest, getAllPersonalBests } from './history.js';

const checks = [];
const check = (name, fn) => checks.push([name, fn]);

const session = (overrides) => ({
  wpm: 50, accuracy: 95, consistency: 80, mode: 'time', duration: 30, language: 'en',
  mistakesByKey: { a: 1, b: 2 },
  ...overrides,
});

const reset = () => {
  storage.remove('history');
  storage.remove('streak');
  storage.remove('personal_bests');
};

const restoreStorage = () => {
  // Clear test keys so the tests don't pollute a real install.
  try { storage.remove('history'); } catch {}
  try { storage.remove('streak'); } catch {}
};

check('getModeBreakdown groups by mode', () => {
  restoreStorage();
  saveSession(session({ mode: 'time', wpm: 50 }));
  saveSession(session({ mode: 'time', wpm: 60 }));
  saveSession(session({ mode: 'words', wpm: 70 }));
  const out = getModeBreakdown();
  const time = out.find((b) => b.mode === 'time');
  const words = out.find((b) => b.mode === 'words');
  assert.equal(time.tests, 2);
  assert.equal(time.bestWpm, 60);
  assert.equal(time.avgWpm, 55);
  assert.equal(words.tests, 1);
  assert.equal(words.bestWpm, 70);
});

check('getModeBreakdown returns sorted by test count', () => {
  restoreStorage();
  saveSession(session({ mode: 'time', wpm: 50 }));
  saveSession(session({ mode: 'time', wpm: 60 }));
  saveSession(session({ mode: 'code', wpm: 40 }));
  const out = getModeBreakdown();
  assert.equal(out[0].mode, 'time'); // 2 tests
  assert.equal(out[1].mode, 'code'); // 1 test
});

check('getDailyStats returns 30 days', () => {
  restoreStorage();
  const days = getDailyStats(30);
  assert.equal(days.length, 30);
  // Each entry has date, wpm, tests, accuracy
  for (const d of days) {
    assert.ok(typeof d.date === 'string');
    assert.ok(typeof d.tests === 'number');
    assert.ok(typeof d.wpm === 'number');
    assert.ok(typeof d.accuracy === 'number');
  }
});

check('getDailyStats aggregates today\'s sessions', () => {
  restoreStorage();
  saveSession(session({ wpm: 60, accuracy: 95 }));
  saveSession(session({ wpm: 80, accuracy: 90 }));
  const days = getDailyStats(1);
  const today = days[days.length - 1];
  assert.equal(today.tests, 2);
  assert.equal(Math.round(today.wpm), 70);
  assert.ok(today.accuracy > 0);
});

check('getModeBreakdown handles empty history', () => {
  restoreStorage();
  const out = getModeBreakdown();
  assert.deepEqual(out, []);
});

check('getStreakInfo starts at zero', () => {
  reset();
  const s = getStreakInfo();
  assert.equal(s.currentStreak, 0);
  assert.equal(s.bestStreak, 0);
});

check('personal best is recorded and read back', () => {
  reset();
  assert.equal(recordPersonalBest('time', { targetDuration: 30 }, 87), true);
  assert.equal(getPersonalBest('time', { targetDuration: 30 }), 87);
});

check('a slower run does not lower the best', () => {
  reset();
  recordPersonalBest('time', { targetDuration: 30 }, 100);
  assert.equal(recordPersonalBest('time', { targetDuration: 30 }, 50), false);
  assert.equal(getPersonalBest('time', { targetDuration: 30 }), 100);
});

check('a faster run replaces the best', () => {
  reset();
  recordPersonalBest('time', { targetDuration: 30 }, 100);
  assert.equal(recordPersonalBest('time', { targetDuration: 30 }), false); // missing wpm
  assert.equal(recordPersonalBest('time', { targetDuration: 30 }, 120), true);
  assert.equal(getPersonalBest('time', { targetDuration: 30 }), 120);
});

check('different durations track different bests', () => {
  reset();
  recordPersonalBest('time', { targetDuration: 15 }, 110);
  recordPersonalBest('time', { targetDuration: 60 }, 70);
  assert.equal(getPersonalBest('time', { targetDuration: 15 }), 110);
  assert.equal(getPersonalBest('time', { targetDuration: 60 }), 70);
});

check('PB survives a session round-trip through saveSession', () => {
  reset();
  saveSession({ mode: 'time', targetDuration: 30, wpm: 95, accuracy: 96, mistakesByKey: {} });
  assert.equal(getPersonalBest('time', { targetDuration: 30 }), 95);
});

check('getAllPersonalBests returns one row per (mode, config)', () => {
  reset();
  recordPersonalBest('time', { targetDuration: 15 }, 100);
  recordPersonalBest('time', { targetDuration: 60 }, 80);
  recordPersonalBest('words', { targetWordCount: 25 }, 60);
  const all = getAllPersonalBests();
  assert.equal(all.length, 3);
  // Sorted by wpm desc
  assert.equal(all[0].wpm, 100);
  assert.equal(all[1].wpm, 80);
  assert.equal(all[2].wpm, 60);
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
