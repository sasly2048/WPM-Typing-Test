/**
 * Profile service tests.
 *
 * Run: node src/services/profile.test.js
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

import * as storage from './storage.js';
import { getProfile, saveProfile, DEFAULT_PROFILE } from './profile.js';

const checks = [];
const check = (name, fn) => checks.push([name, fn]);

const reset = () => storage.remove('profile');

check('returns defaults when nothing is stored', () => {
  reset();
  const p = getProfile();
  assert.deepEqual(p, DEFAULT_PROFILE);
});

check('round-trips a full profile', () => {
  reset();
  saveProfile({
    displayName: 'Ada',
    bio: 'A line.',
    location: 'London',
    website: 'https://example.com',
    social: { twitter: 'ada', github: 'ada-lovelace', mastodon: '', linkedin: '' },
  });
  const p = getProfile();
  assert.equal(p.displayName, 'Ada');
  assert.equal(p.bio, 'A line.');
  assert.equal(p.location, 'London');
  assert.equal(p.website, 'https://example.com');
  assert.equal(p.social.twitter, 'ada');
  assert.equal(p.social.github, 'ada-lovelace');
});

check('clamps oversized fields', () => {
  reset();
  saveProfile({
    displayName: 'x'.repeat(200),
    bio: 'y'.repeat(2000),
    location: 'z'.repeat(500),
    website: 'w'.repeat(1000),
    social: { twitter: 'a'.repeat(200), github: '', mastodon: '', linkedin: '' },
  });
  const p = getProfile();
  assert.equal(p.displayName.length, 60);
  assert.equal(p.bio.length, 500);
  assert.equal(p.location.length, 80);
  assert.equal(p.website.length, 200);
  assert.equal(p.social.twitter.length, 60);
});

check('handles missing social keys', () => {
  reset();
  saveProfile({ displayName: 'NoSocials' });
  const p = getProfile();
  assert.equal(p.displayName, 'NoSocials');
  assert.equal(p.social.twitter, '');
  assert.equal(p.social.github, '');
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
