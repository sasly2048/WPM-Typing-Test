/**
 * Self-checks for the storage layer.
 *
 * Run with:  node src/services/storage.test.js
 *
 * The new import is supposed to:
 *   - accept well-formed data
 *   - reject unparseable JSON
 *   - reject oversized payloads
 *   - drop keys it does not own
 *   - drop payloads that fail the schema validator
 *   - report the number of accepted and rejected entries
 */

import assert from 'node:assert/strict';
import { SCHEMA_VERSION } from './storage.js';

// Run in a fresh localStorage. The build target is the browser, but
// Node 22 has a localStorage shim that works for our purposes if we
// provide a clean object.
if (typeof localStorage === 'undefined') {
  // Node 22 has a real localStorage; older versions may need a shim.
  globalThis.localStorage = {
    _d: {},
    getItem(k) { return this._d[k] ?? null; },
    setItem(k, v) { this._d[k] = String(v); },
    removeItem(k) { delete this._d[k]; },
    key(i) { return Object.keys(this._d)[i] ?? null; },
    get length() { return Object.keys(this._d).length; },
    clear() { this._d = {}; },
  };
} else {
  localStorage.clear();
}

const { get, set, remove, importData, exportData, clear, migrate } = await import('./storage.js');

const checks = [];
const check = (name, fn) => checks.push([name, fn]);

check('set + get round-trip for a valid settings object', () => {
  const ok = set('settings', { mode: 'time', duration: 60, soundEnabled: false });
  assert.equal(ok, true);
  const got = get('settings');
  assert.equal(got.mode, 'time');
  assert.equal(got.duration, 60);
  assert.equal(got.soundEnabled, false);
});

check('get returns the default for missing or invalid data', () => {
  remove('settings');
  const got = get('settings');
  assert.equal(typeof got, 'object');
  assert.ok(got.mode, 'default has a mode');
});

check('set rejects values that fail the schema', () => {
  const ok = set('settings', 'not an object');
  assert.equal(ok, false, 'rejected invalid value');
  // Storage should not have been written to.
  const got = get('settings');
  assert.notEqual(got, 'not an object');
});

check('import: a valid round-trip accepts all keys', () => {
  set('settings', { mode: 'time', duration: 30 });
  set('history', [{ wpm: 50, accuracy: 95, timestamp: Date.now() }]);
  const exported = exportData();
  clear();
  const result = importData(exported);
  assert.ok(result.accepted >= 2, 'should accept at least 2 keys');
  assert.equal(result.rejected, 0);
  assert.ok(Array.isArray(get('history')));
});

check('import: rejects unparseable JSON', () => {
  const result = importData('{ not json');
  assert.equal(result.accepted, 0);
  assert.ok(result.issues.length > 0);
});

check('import: rejects oversized payloads', () => {
  const huge = 'x'.repeat(6 * 1024 * 1024);
  const result = importData(huge);
  assert.equal(result.accepted, 0);
  assert.ok(result.issues[0].includes('5MB'));
});

check('import: drops keys that are not owned by KeyFlow', () => {
  const data = {
    'keyflow_settings': JSON.stringify({ mode: 'time' }),
    'some_other_app_data': JSON.stringify({ secret: 'value' }),
  };
  const result = importData(JSON.stringify(data));
  assert.equal(result.accepted, 1);
  assert.ok(result.issues.some((m) => m.includes('some_other_app_data')));
});

check('import: drops entries that fail validation', () => {
  const data = {
    'keyflow_settings': JSON.stringify('not an object'),
    'keyflow_history': JSON.stringify([{ wpm: 'not a number' }]),
  };
  const result = importData(JSON.stringify(data));
  assert.equal(result.accepted, 0);
  assert.ok(result.issues.some((m) => m.includes('failed validation')));
});

check('export: every key begins with the storage prefix', () => {
  set('settings', { mode: 'time' });
  set('history', []);
  const exported = JSON.parse(exportData());
  for (const key of Object.keys(exported)) {
    assert.ok(key.startsWith('keyflow_'), `${key} should start with keyflow_`);
  }
});

check('clear: removes every owned key', () => {
  set('settings', { mode: 'time' });
  set('history', []);
  const removed = clear();
  assert.ok(removed >= 2);
  assert.equal(get('settings').mode, 'paragraph', 'fell back to default');
});

check('migrate: writes a schema_version on first run', () => {
  clear();
  migrate();
  const v = get('schema_version');
  assert.equal(v, SCHEMA_VERSION);
});

check('migrate: is idempotent', () => {
  migrate();
  migrate();
  const v = get('schema_version');
  assert.equal(v, SCHEMA_VERSION);
});

let failed = 0;
for (const [name, fn] of checks) {
  try {
    await fn();
    console.log(`  ok  ${name}`);
  } catch (err) {
    failed++;
    console.error(`FAIL  ${name}\n      ${err.message}`);
  }
}
console.log(`\n${checks.length - failed}/${checks.length} passed`);
process.exit(failed ? 1 : 0);
