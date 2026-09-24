/**
 * Test-config URL serialization tests.
 *
 * Run: node src/utils/test-config.test.js
 */
import assert from 'node:assert/strict';
import { encode, decode, applyFromUrl, buildShareUrl } from './test-config.js';

const checks = [];
const check = (name, fn) => checks.push([name, fn]);

check('round-trips a simple config', () => {
  const cfg = { mode: 'quote', duration: 60, language: 'fr' };
  const enc = encode(cfg);
  const dec = decode(enc);
  assert.equal(dec.mode, 'quote');
  assert.equal(dec.duration, 60);
  assert.equal(dec.language, 'fr');
});

check('drops null/undefined values', () => {
  const cfg = { mode: 'words', wordCount: 50, punctuation: undefined };
  const enc = encode(cfg);
  const dec = decode(enc);
  assert.equal(dec.mode, 'words');
  assert.equal(dec.wordCount, 50);
  assert.equal('punctuation' in dec, false);
});

check('decodes a full URL with query string', () => {
  const cfg = { mode: 'zen' };
  const url = buildShareUrl('https://example.com/#/practice', cfg);
  const dec = decode(url);
  assert.equal(dec.mode, 'zen');
});

check('decodes just the c= payload', () => {
  const cfg = { mode: 'adaptive' };
  const enc = encode(cfg);
  const dec = decode(enc);
  assert.equal(dec.mode, 'adaptive');
});

check('returns null on garbage input', () => {
  assert.equal(decode('not-base64!!!'), null);
  assert.equal(decode(''), null);
  assert.equal(decode(null), null);
});

check('applyFromUrl merges over base', () => {
  const base = { mode: 'time', duration: 30, language: 'en' };
  const url = buildShareUrl('https://x/#/practice', { mode: 'quote', duration: 60 });
  const out = applyFromUrl(base, url);
  assert.equal(out.mode, 'quote');
  assert.equal(out.duration, 60);
  assert.equal(out.language, 'en'); // base preserved
});

check('applyFromUrl is a no-op on plain base', () => {
  const base = { mode: 'time' };
  const out = applyFromUrl(base, '');
  assert.deepEqual(out, base);
});

check('share URL points to /#/practice', () => {
  const url = buildShareUrl('https://example.com/app/#/practice', { mode: 'quote' });
  assert.ok(url.includes('#/practice'));
  assert.ok(url.includes('c='));
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
