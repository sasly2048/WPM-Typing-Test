/**
 * Self-checks for the multilingual prose dataset and the language
 * path through the text provider.
 *
 * Run with:  node src/data/multilingual-paragraphs.test.js
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(readFileSync(resolve(here, 'multilingual-paragraphs.json'), 'utf8'));

const checks = [];
const check = (name, fn) => checks.push([name, fn]);

// Allowed languages: only those a user can type on a standard QWERTY
// (or US-International) keyboard without switching to a non-Latin IME
// or installing a special layout. Languages that require dead keys
// for their accented characters are fine on US-International.
const ALLOWED = new Set([
  'en', // English
  'fr', // French
  'de', // German
  'it', // Italian
  'pt', // Portuguese
  'sv', // Swedish
  'pl', // Polish (with Polish layout, or US-Intl for most)
  'cs', // Czech
  'tr', // Turkish
  'ro', // Romanian
]);

const difficultyBuckets = { easy: 0, medium: 0, hard: 0 };
const langBuckets = {};
const byLangDifficulty = {};

for (const p of data) {
  if (!ALLOWED.has(p.language)) {
    throw new Error(`language ${p.language} is not on the QWERTY-friendly list`);
  }
  difficultyBuckets[p.difficulty] = (difficultyBuckets[p.difficulty] || 0) + 1;
  langBuckets[p.language] = (langBuckets[p.language] || 0) + 1;
  byLangDifficulty[p.language] = byLangDifficulty[p.language] || {};
  byLangDifficulty[p.language][p.difficulty] = (byLangDifficulty[p.language][p.difficulty] || 0) + 1;
}

check('each language has at least 10 paragraphs', () => {
  for (const [lang, count] of Object.entries(langBuckets)) {
    assert.ok(count >= 10, `language ${lang} has only ${count} paragraphs`);
  }
});

check('each language has at least 2 paragraphs at every difficulty', () => {
  for (const lang of Object.keys(byLangDifficulty)) {
    for (const d of ['easy', 'medium', 'hard']) {
      assert.ok(
        (byLangDifficulty[lang][d] || 0) >= 2,
        `${lang} has only ${byLangDifficulty[lang][d] || 0} at ${d}`,
      );
    }
  }
});

check('every paragraph has the required fields', () => {
  for (const p of data) {
    assert.ok(p.id, 'missing id');
    assert.ok(p.text && p.text.length > 30, 'too-short text');
    assert.ok(p.source, 'missing source');
    assert.ok(p.difficulty, 'missing difficulty');
    assert.ok(p.category, 'missing category');
    assert.ok(p.language, 'missing language');
    assert.ok(['easy', 'medium', 'hard'].includes(p.difficulty), `bad difficulty: ${p.difficulty}`);
    assert.ok(p.name, 'missing name (program/section title)');
  }
});

check('no language outside the QWERTY-friendly set', () => {
  for (const p of data) {
    assert.ok(ALLOWED.has(p.language), `${p.language} not in QWERTY set`);
  }
});

check('distribution across categories is reasonable', () => {
  const cats = {};
  for (const p of data) cats[p.category] = (cats[p.category] || 0) + 1;
  // No single category should eat the whole dataset.
  const total = data.length;
  for (const c of Object.keys(cats)) {
    assert.ok(cats[c] < total * 0.4, `category ${c} has ${cats[c]}/${total}`);
  }
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
console.log(`Distribution: ${JSON.stringify({ langs: langBuckets, difficulty: difficultyBuckets })}`);
process.exit(failed ? 1 : 0);
