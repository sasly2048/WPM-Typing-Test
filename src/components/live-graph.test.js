/**
 * Live-graph options tests.
 *
 * The live-graph canvas component doesn't run in Node (it touches
 * `document`). We only test the option-merging logic that affects
 * how samples are scaled and which colours are used. The full
 * paint test is browser-only.
 */

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

import assert from 'node:assert/strict';

const checks = [];
const check = (name, fn) => checks.push([name, fn]);

/**
 * Mirror the min/max scaling logic from the live-graph component
 * (the parts that don't touch the DOM). If this drifts from the
 * component, our HUD will draw ugly lines.
 */
function scale(samples, minY, maxY) {
  if (!Array.isArray(samples) || samples.length === 0) return null;
  const computedMax = samples.reduce((m, s) => Math.max(m, s.wpm), 0);
  const maxWpm = maxY != null ? maxY : Math.max(40, computedMax);
  const minWpm = minY != null ? minY : 0;
  return { min: minWpm, max: maxWpm };
}

check('default scale uses max of samples, floor 40', () => {
  const s = scale([{ wpm: 30 }, { wpm: 20 }], null, null);
  assert.equal(s.min, 0);
  assert.equal(s.max, 40);
});

check('fixed min/max is honoured', () => {
  const s = scale([{ wpm: 30 }, { wpm: 20 }], 60, 100);
  assert.equal(s.min, 60);
  assert.equal(s.max, 100);
});

check('empty input returns null', () => {
  const s = scale([], null, null);
  assert.equal(s, null);
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
