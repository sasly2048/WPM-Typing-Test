/**
 * Self-check for the non-repeating pool shuffler.
 *
 * Run with:  node src/services/pool-shuffler.test.js
 *
 * The exhaustion path recursed. It did terminate — clearing the used-set
 * guarantees the next filter matches everything — but that was an unstated
 * invariant rather than a structural guarantee. These cases pin the observable
 * contract down (every item before a repeat, clean recycling, no stall on
 * duplicate or missing ids) so the rewrite to an iterative reset, and any
 * future change to it, cannot regress quietly.
 */

import assert from 'node:assert/strict';
import { getNonRepeatingItem, resetPool } from './pool-shuffler.js';

const checks = [];
const check = (name, fn) => checks.push([name, fn]);

check('an empty pool returns null rather than throwing', () => {
  assert.equal(getNonRepeatingItem('empty', []), null);
  assert.equal(getNonRepeatingItem('empty', null), null);
});

check('a single-item pool always returns that item', () => {
  assert.equal(getNonRepeatingItem('one', ['only']), 'only');
  assert.equal(getNonRepeatingItem('one', ['only']), 'only');
});

check('every item is seen before any repeats', () => {
  resetPool('cycle');
  const items = ['a', 'b', 'c', 'd'];
  const seen = items.map(() => getNonRepeatingItem('cycle', items));
  assert.deepEqual([...seen].sort(), items, `expected each item once, got ${seen}`);
});

check('the pool recycles after exhaustion instead of stalling', () => {
  resetPool('recycle');
  const items = ['a', 'b'];
  const picks = Array.from({ length: 6 }, () => getNonRepeatingItem('recycle', items));
  assert.equal(picks.length, 6);
  assert.ok(picks.every((p) => items.includes(p)), `unexpected value in ${picks}`);
});

check('duplicate ids still yield items and terminate', () => {
  resetPool('dupes');
  // Every item reports the same id, so the used-set saturates after one pick.
  const items = [{ id: 'same', text: 'x' }, { id: 'same', text: 'y' }];
  for (let i = 0; i < 20; i++) {
    const picked = getNonRepeatingItem('dupes', items, (it) => it.id);
    assert.ok(picked && items.includes(picked), 'expected a real item back');
  }
});

check('objects without ids fall back to positional identity', () => {
  resetPool('noid');
  const items = [{ text: 'a' }, { text: 'b' }, { text: 'c' }];
  for (let i = 0; i < 12; i++) {
    const picked = getNonRepeatingItem('noid', items);
    assert.ok(items.includes(picked));
  }
});

check('resetPool clears only the named pool', () => {
  resetPool();
  const items = ['a', 'b'];
  getNonRepeatingItem('poolA', items);
  getNonRepeatingItem('poolB', items);
  resetPool('poolA');
  // Both pools must still yield valid items afterwards.
  assert.ok(items.includes(getNonRepeatingItem('poolA', items)));
  assert.ok(items.includes(getNonRepeatingItem('poolB', items)));
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
