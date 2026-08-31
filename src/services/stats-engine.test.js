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
import {
  calculateWPM, calculateRawWPM, calculateAccuracy,
  calculateErrorRate, calculateCorrectionRate, calculateConsistency,
  calculateBurstWPM, percentile, mean, characterAccuracy,
  calculateCharStats, generateWPMTimeline,
} from './stats-engine.js';

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

check('error rate: total errors / total strokes, never above 1', () => {
  assert.equal(calculateErrorRate(5, 100), 0.05);
  assert.equal(calculateErrorRate(0, 0), 0, 'no strokes = no error rate');
  assert.ok(calculateErrorRate(50, 100) <= 1);
});

check('correction rate: corrected / total errors, 1.0 when none', () => {
  assert.equal(calculateCorrectionRate(3, 1), 0.75);
  assert.equal(calculateCorrectionRate(0, 0), 1, 'no errors means perfect correction');
  assert.equal(calculateCorrectionRate(0, 5), 0);
});

check('consistency: low variance is high score, high variance is low', () => {
  const flat = [
    { time: 1, wpm: 50 }, { time: 2, wpm: 50 }, { time: 3, wpm: 50 },
  ];
  const spiky = [
    { time: 1, wpm: 10 }, { time: 2, wpm: 100 }, { time: 3, wpm: 10 },
  ];
  assert.ok(calculateConsistency(flat) > calculateConsistency(spiky));
  // No samples returns null ("n/a") so the UI can show it without
  // misleadingly reporting 100% consistency.
  assert.equal(calculateConsistency([]), null, 'no samples = null');
});

check('burst WPM: max of the speed curve, not the average', () => {
  const samples = [{ time: 1, wpm: 30 }, { time: 2, wpm: 90 }, { time: 3, wpm: 50 }];
  assert.equal(calculateBurstWPM(samples), 90);
  assert.equal(calculateBurstWPM([]), 0);
});

check('percentile: standard quartile behaviour', () => {
  const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  assert.equal(percentile(values, 50), 6, 'p50 picks the middle');
  assert.equal(percentile(values, 90), 10, 'p90 of 10 sorted values is the last');
  assert.equal(percentile([], 50), null);
});

check('percentile: 10 sorted values, p90 lands on the last item', () => {
  // This is the floor-based percentile used by reporting dashboards.
  // Index = floor(0.9 * 10) = 9, which is the last element of a
  // 10-element array. The p90 of [1..10] is therefore 10, not 9.
  const sorted = Array.from({ length: 10 }, (_, i) => i + 1);
  assert.equal(percentile(sorted, 90), 10);
});

check('mean: arithmetic mean, null on empty', () => {
  assert.equal(mean([2, 4, 6]), 4);
  assert.equal(mean([5]), 5);
  assert.equal(mean([]), null);
});

check('character accuracy: matches expected characters in order', () => {
  // Perfect match
  assert.equal(characterAccuracy('hello', 'hello'), 1);
  // One wrong char in position 2 (x vs l), rest correct: 4/5
  assert.equal(characterAccuracy('hexlo', 'hello'), 0.8);
  // One extra beyond the expected length: still 5/5 because all 5
  // expected chars matched.
  assert.equal(characterAccuracy('helloo', 'hello'), 1);
  // One missed char: only 3/5 expected chars matched (the trailing
  // 'o' sits against 'l', which counts as a mismatch).
  assert.equal(characterAccuracy('helo', 'hello'), 0.6);
});

check('character stats: correct, incorrect, extra, missed', () => {
  const s = calculateCharStats('helloo', 'hello');
  assert.equal(s.correct, 5);
  assert.equal(s.incorrect, 0);
  assert.equal(s.extra, 1);
  assert.equal(s.missed, 0);
});

check('WPM timeline: at least one sample for a non-empty session', () => {
  const keystrokes = [
    { timestamp: 1000, correct: true },
    { timestamp: 2000, correct: true },
    { timestamp: 3000, correct: true },
  ];
  const tl = generateWPMTimeline(keystrokes, 0);
  assert.ok(tl.length >= 1);
  assert.equal(tl[0].wpm, calculateWPM(1, 1));
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
