import { STORAGE_PREFIX } from '../constants/config.js';
import { DEFAULT_SETTINGS } from '../constants/defaults.js';

/**
 * Schema-aware storage layer.
 *
 * Every key under STORAGE_PREFIX is owned by a module. The schema
 * declares the shape of each owner so the import path can validate
 * payloads before merging them in. Unrecognised keys are dropped on
 * import (rather than blindly writing whatever the file says), and
 * well-known keys with bad payloads are dropped with a warning.
 *
 * Adding a new persisted collection:
 *   1. Add it to SCHEMA below with its validator.
 *   2. Use the read / write helpers (get / set) — never poke
 *      localStorage directly.
 *   3. The export + import paths pick it up automatically.
 */

const MAX_PAYLOAD_BYTES = 5 * 1024 * 1024; // 5MB ceiling on imported data

const isString = (v) => typeof v === 'string';
const isNumber = (v) => typeof v === 'number' && Number.isFinite(v);
const isBoolean = (v) => typeof v === 'boolean';
const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isArray = (v) => Array.isArray(v);
const isStringArray = (v) => isArray(v) && v.every(isString);
const isNumberArray = (v) => isArray(v) && v.every(isNumber);

const validateSession = (v) => {
  if (!isObject(v)) return false;
  if (v.wpm != null && !isNumber(v.wpm)) return false;
  if (v.accuracy != null && !isNumber(v.accuracy)) return false;
  if (v.timestamp != null && !isNumber(v.timestamp)) return false;
  if (v.consistency != null && !isNumber(v.consistency)) return false;
  if (v.burstWpm != null && !isNumber(v.burstWpm)) return false;
  if (v.rawWpm != null && !isNumber(v.rawWpm)) return false;
  // Accept arbitrary additional fields (mistakesByKey, mode, etc.) as
  // long as the basic numeric fields are valid. We don't want to
  // reject future feature additions just because the validator wasn't
  // updated.
  return true;
};

const validateHistory = (v) => {
  if (!isArray(v)) return false;
  if (v.length > 5000) return false; // sanity cap
  return v.every(validateSession);
};

const validatePersonalBest = (v) => isObject(v) || isNumber(v);

const validateUnlockedAchievements = (v) => isStringArray(v);

const validateSettings = (v) => isObject(v) && Object.entries(v).every(
  ([k, val]) => {
    if (typeof k !== 'string') return false;
    // Whitelist: every value type we know how to handle. Anything
    // unknown is dropped from the merged settings.
    if (isBoolean(val) || isString(val) || isNumber(val)) return true;
    if (isArray(val)) return val.every(isString) || val.every(isNumber);
    return false;
  }
);

const validateProfile = (v) => isObject(v) && (
  typeof v.displayName !== 'undefined' ? isString(v.displayName) : true
) && (
  typeof v.bio !== 'undefined' ? isString(v.bio) && v.bio.length <= 500 : true
) && (
  typeof v.location !== 'undefined' ? isString(v.location) && v.location.length <= 80 : true
) && (
  typeof v.website !== 'undefined' ? isString(v.website) && v.website.length <= 200 : true
);

const validateTheme = (v) => isString(v);
const validateDevAccent = (v) => isString(v);
const validateAppearance = (v) => v === 'light' || v === 'dark' || v === 'system';

/**
 * Schema registry. Exposed (instead of being a module-local constant)
 * so tests and migration scripts can inspect and extend it.
 */
export const SCHEMA = {
  settings: { validate: validateSettings, default: () => ({ ...DEFAULT_SETTINGS }) },
  history: { validate: validateHistory, default: () => [] },
  // The personal best is stored as a record map; older versions were a
  // bare number. Accept either.
  personal_bests: { validate: validatePersonalBest, default: () => ({}) },
  unlocked_achievements: { validate: validateUnlockedAchievements, default: () => [] },
  theme: { validate: validateTheme, default: () => 'paper' },
  dev_accent: { validate: validateDevAccent, default: () => 'phosphor' },
  appearance: { validate: validateAppearance, default: () => 'system' },
  profile: { validate: validateProfile, default: () => ({}) },
  // Schema migration marker. Bumped when the on-disk shape changes in
  // a breaking way. Older values are migrated in `migrate()` below.
  schema_version: { validate: isNumber, default: () => 1 },
};

const keyName = (suffix) => `${STORAGE_PREFIX}${suffix}`;

export const SCHEMA_VERSION = 1;

/**
 * Get a value from localStorage with validation. Returns the default
 * if the value is missing or invalid. Never throws.
 */
export const get = (suffix) => {
  try {
    const raw = localStorage.getItem(keyName(suffix));
    if (raw == null) {
      const def = SCHEMA[suffix];
      return def ? def.default() : null;
    }
    const parsed = JSON.parse(raw);
    const def = SCHEMA[suffix];
    if (def && !def.validate(parsed)) {
      // Don't trust corrupt data — fall back to default.
      return def.default();
    }
    return parsed;
  } catch (e) {
    // Corrupt JSON, schema drift, quota error — fall back gracefully.
    return SCHEMA[suffix]?.default() ?? null;
  }
};

/**
 * Write a value to localStorage, with schema validation. A failed
 * validation never throws — the write is skipped and the function
 * returns false so the caller can react.
 */
export const set = (suffix, value) => {
  const def = SCHEMA[suffix];
  if (def && !def.validate(value)) {
    return false;
  }
  try {
    localStorage.setItem(keyName(suffix), JSON.stringify(value));
    return true;
  } catch (e) {
    return false;
  }
};

export const remove = (suffix) => {
  try { localStorage.removeItem(keyName(suffix)); } catch (e) {}
};

/**
 * User settings, merged with defaults. Stored under 'settings'.
 */
export const getSettings = () => {
  const stored = get('settings') || {};
  return { ...DEFAULT_SETTINGS, ...stored };
};

export const saveSettings = (settings) => set('settings', settings);

/**
 * Export every owned key as a JSON string. The output is a flat
 * dictionary of localStorage keys -> JSON string values, suitable for
 * round-tripping through `importData`.
 */
export const exportData = () => {
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(STORAGE_PREFIX)) {
      data[key] = localStorage.getItem(key);
    }
  }
  return JSON.stringify(data);
};

/**
 * Result of an import: the number of keys accepted, the number
 * rejected, and a list of issues for the user.
 */
export const importData = (jsonString) => {
  if (typeof jsonString !== 'string') {
    return { accepted: 0, rejected: 0, issues: ['Import is not a string'] };
  }
  if (jsonString.length > MAX_PAYLOAD_BYTES) {
    return { accepted: 0, rejected: 0, issues: ['Import exceeds 5MB limit'] };
  }

  let data;
  try { data = JSON.parse(jsonString); }
  catch (e) {
    return { accepted: 0, rejected: 0, issues: ['Import is not valid JSON'] };
  }

  if (!isObject(data)) {
    return { accepted: 0, rejected: 0, issues: ['Import root must be an object'] };
  }

  const issues = [];
  let accepted = 0;
  let rejected = 0;

  for (const [key, value] of Object.entries(data)) {
    if (typeof key !== 'string') {
      rejected++;
      issues.push(`non-string key skipped`);
      continue;
    }
    if (!key.startsWith(STORAGE_PREFIX)) {
      rejected++;
      issues.push(`unowned key ${key} skipped`);
      continue;
    }
    const suffix = key.slice(STORAGE_PREFIX.length);
    const def = SCHEMA[suffix];
    if (!def) {
      // We don't know what this key holds. Skip rather than write
      // unknown data; future schema additions should add a validator
      // before they write.
      rejected++;
      issues.push(`unknown key ${key} skipped`);
      continue;
    }
    // The value in the import is itself a JSON string (the export
    // format stringifies the inner payload separately). Parse it
    // before validating, otherwise the validator sees a string.
    let parsed;
    if (typeof value === 'string') {
      try { parsed = JSON.parse(value); }
      catch (e) { rejected++; issues.push(`${key} has unparseable JSON`); continue; }
    } else {
      // The import may have been re-saved without the inner stringify.
      parsed = value;
    }
    if (!def.validate(parsed)) {
      rejected++;
      issues.push(`${key} failed validation`);
      continue;
    }
    try {
      localStorage.setItem(key, JSON.stringify(parsed));
      accepted++;
    } catch (e) {
      rejected++;
      issues.push(`${key} could not be written`);
    }
  }

  // Bump schema version after a successful import.
  if (accepted > 0) {
    set('schema_version', SCHEMA_VERSION);
  }

  return { accepted, rejected, issues };
};

/**
 * Clear every keyflow-owned entry. Returns the count of keys removed.
 */
export const clear = () => {
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(STORAGE_PREFIX)) keysToRemove.push(key);
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key));
  return keysToRemove.length;
};

/**
 * Schema migration. Called once on app boot; advances the on-disk
 * shape from older versions to the current one. Returns the version
 * that existed before migration, or SCHEMA_VERSION if no migration
 * was needed.
 */
export const migrate = () => {
  const onDisk = get('schema_version') ?? 0;
  if (onDisk >= SCHEMA_VERSION) return onDisk;

  // No migrations defined yet — when we add a breaking shape change,
  // add a case here. Each case should call set() with the migrated
  // payload and bump the version counter.
  if (onDisk < 1) {
    // v0 -> v1: nothing to migrate; the first version wrote the same
    // shape we use today. We only introduced the marker now.
  }

  set('schema_version', SCHEMA_VERSION);
  return onDisk;
};
