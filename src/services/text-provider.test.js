/**
 * Self-check for paragraph assembly.
 *
 * Run with:  node src/services/text-provider.test.js
 *
 * getNonRepeatingItem returns null for an empty pool. The previous loop
 * dereferenced `item.text` unguarded, so an empty pool threw a TypeError and
 * killed the whole session load — the user saw a blank practice screen with
 * no explanation. An item with empty text was survivable but degraded: the
 * loop ran once per missing word (450 iterations for a 300s test) building an
 * array of empty strings.
 *
 * This exercises the assembly logic directly rather than through getText,
 * which needs the JSON bundles a browser build provides.
 */

import assert from 'node:assert/strict';
import { getNonRepeatingItem } from './pool-shuffler.js';

const MAX_PARAGRAPHS = 40;

/** Mirrors the bounded loop in text-provider.js getParagraphText(). */
function assemble(pool, minWordCount, poolKey = 'test') {
  const parts = [];
  let wordCount = 0;

  for (let i = 0; i < MAX_PARAGRAPHS; i++) {
    const item = getNonRepeatingItem(poolKey, pool, (p) => p.id);
    const text = item?.text;
    if (typeof text !== 'string' || !text.trim()) break;

    parts.push(text);
    wordCount += text.trim().split(/\s+/).length;
    if (wordCount >= minWordCount) break;
  }

  return { text: parts.join(' '), parts: parts.length, wordCount };
}

const checks = [];
const check = (name, fn) => checks.push([name, fn]);

const para = (id, words) => ({ id, text: Array.from({ length: words }, () => 'word').join(' ') });

check('an empty pool does not throw', () => {
  // getNonRepeatingItem returns null here; the old code threw a TypeError.
  const r = assemble([], 100, 'empty-pool');
  assert.equal(r.parts, 0);
  assert.equal(r.text, '');
});

check('items with empty text terminate immediately', () => {
  const r = assemble([{ id: 'a', text: '' }, { id: 'b', text: '   ' }], 450, 'blank');
  assert.equal(r.parts, 0, 'should stop rather than accumulate blanks');
});

check('a short request uses a single paragraph', () => {
  const r = assemble([para('a', 60), para('b', 60)], 50, 'short');
  assert.equal(r.parts, 1);
  assert.ok(r.wordCount >= 50);
});

check('a long request concatenates until the budget is met', () => {
  const pool = Array.from({ length: 12 }, (_, i) => para(`p${i}`, 40));
  const r = assemble(pool, 450, 'long');
  assert.ok(r.wordCount >= 450, `expected >= 450 words, got ${r.wordCount}`);
  assert.ok(r.parts > 1, 'expected multiple paragraphs');
});

check('assembly is bounded even when the budget cannot be met', () => {
  // Tiny paragraphs against a huge budget: must stop at the cap, not spin.
  const r = assemble([para('a', 1), para('b', 1)], 100000, 'bounded');
  assert.ok(r.parts <= MAX_PARAGRAPHS, `expected <= ${MAX_PARAGRAPHS} parts, got ${r.parts}`);
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
