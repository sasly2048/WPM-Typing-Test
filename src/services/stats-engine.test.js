/**
 * Self-check for the WPM/accuracy maths.
 *
 * Run with:  node src/services/stats-engine.test.js
 *
 * These guard the failure that motivated them: a near-zero elapsed time used
 * to produce a finite, plausible, wrong rate (60 characters in 3ms read as
 * ~16,000 WPM) which was then rounded, stored, and skewed every average.
 */

import assert from 'node:assert/strict';
import { calculateWPM, calculateRawWPM, calculateAccuracy } from './stats-engine.js';

const checks = [];
const check = (name, fn) => checks.push([name, fn]);

check('a normal run reports a normal rate', () => {
  // 250 correct characters in 60s = 50 words/min.
  assert.equal(Math.round(calculateWPM(250, 60)), 50);
});

check('half the time doubles the rate', () => {
  assert.equal(Math.round(calculateWPM(250, 30)), 100);
});

check('zero elapsed time does not produce Infinity', () => {
  const wpm = calculateWPM(60, 0);
  assert.ok(Number.isFinite(wpm), 'expected a finite value');
  assert.equal(wpm, 0);
});

check('a near-zero denominator cannot inflate the rate', () => {
  // The original bug: 60 chars in 3ms.
  const wpm = calculateWPM(60, 0.003);
  assert.ok(Number.isFinite(wpm));
  assert.ok(wpm <= 400, `expected a clamped rate, got ${wpm}`);
});

check('no input reports zero rather than NaN', () => {
  assert.equal(calculateWPM(0, 10), 0);
  assert.ok(!Number.isNaN(calculateWPM(0, 0)));
});

check('negative input is rejected rather than propagated', () => {
  assert.equal(calculateWPM(-5, 10), 0);
  assert.equal(calculateWPM(10, -5), 0);
});

check('raw WPM counts every keystroke, net counts only correct ones', () => {
  const raw = calculateRawWPM(300, 60);
  const net = calculateWPM(250, 60);
  assert.ok(raw > net, 'raw should exceed net when mistakes were made');
});

check('accuracy is a percentage and survives a zero denominator', () => {
  assert.equal(calculateAccuracy(90, 100), 90);
  assert.ok(!Number.isNaN(calculateAccuracy(0, 0)));
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
