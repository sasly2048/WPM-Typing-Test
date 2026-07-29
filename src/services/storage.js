import { STORAGE_PREFIX } from '../constants/config.js';
import { DEFAULT_SETTINGS } from '../constants/defaults.js';

/**
 * Retrieves and parses JSON from localStorage with prefix.
 * @param {string} key
 * @returns {*}
 */
export const get = (key) => {
  try {
    const item = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    return item ? JSON.parse(item) : null;
  } catch (e) {
    console.error('Error reading from localStorage', e);
    return null;
  }
};

/**
 * Stringifies and stores a value in localStorage with prefix.
 * @param {string} key
 * @param {*} value
 */
export const set = (key, value) => {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
  } catch (e) {
    console.error('Error writing to localStorage', e);
  }
};

/**
 * Removes an item from localStorage.
 * @param {string} key
 */
export const remove = (key) => {
  localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
};

/**
 * Retrieves user settings, falling back to defaults.
 * @returns {Object}
 */
export const getSettings = () => {
  const stored = get('settings') || {};
  return { ...DEFAULT_SETTINGS, ...stored };
};

/**
 * Saves user settings.
 * @param {Object} settings
 */
export const saveSettings = (settings) => {
  set('settings', settings);
};

/**
 * Exports all keyflow data as JSON string.
 * @returns {string}
 */
export const exportData = () => {
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith(STORAGE_PREFIX)) {
      data[key] = localStorage.getItem(key);
    }
  }
  return JSON.stringify(data);
};

/**
 * Imports data from JSON string.
 * @param {string} jsonString
 * @returns {boolean} Success status
 */
export const importData = (jsonString) => {
  try {
    const data = JSON.parse(jsonString);
    for (const [key, value] of Object.entries(data)) {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.setItem(key, value);
      }
    }
    return true;
  } catch (e) {
    console.error('Failed to import data', e);
    return false;
  }
};

/**
 * Clears all keyflow data from localStorage.
 */
export const clear = () => {
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith(STORAGE_PREFIX)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
};
