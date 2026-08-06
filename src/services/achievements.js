/**
 * Achievements.
 *
 * Unlock state is derived from stored history rather than only from the
 * moment a test finishes. Previously an achievement was evaluated once, right
 * after a session, so anything already satisfied by earlier history — or by
 * importing a backup — stayed locked forever. Deriving it makes the check
 * idempotent and self-healing.
 */

import * as storage from './storage.js';
import definitions from '../data/achievements.json';

const UNLOCKED_KEY = 'unlocked_achievements';

/** @returns {Array} */
const getDefinitions = () => (Array.isArray(definitions) ? definitions : []);

/** @returns {Array<string>} unlocked achievement ids */
export const getUnlocked = () => storage.get(UNLOCKED_KEY) || [];

/**
 * Best value observed across all history for a condition type. Achievements
 * are lifetime records, so a peak in any past session counts.
 *
 * @param {string} type
 * @param {Array} history
 * @param {Object} stats
 * @returns {number}
 */
function observedValue(type, history, stats) {
  const best = (pick) => history.reduce((m, s) => Math.max(m, pick(s) || 0), 0);

  switch (type) {
    case 'tests_completed':
      return history.length;
    case 'code_tests_completed':
      return history.filter((s) => s.mode === 'code').length;
    case 'wpm_reached':
      return best((s) => s.wpm);
    case 'accuracy_reached':
      return best((s) => s.accuracy);
    case 'consistency_reached':
      return best((s) => s.consistency);
    case 'streak_days':
      return Math.max(stats.currentStreak || 0, stats.bestStreak || 0);
    default:
      return 0;
  }
}

/**
 * Reconcile unlock state against history and persist it.
 *
 * @param {Array} history
 * @param {Object} stats
 * @returns {{unlocked: Array<string>, newlyUnlocked: Array}}
 */
function reconcile(history, stats) {
  const previous = getUnlocked();
  const unlocked = new Set(previous);
  const newlyUnlocked = [];

  for (const ach of getDefinitions()) {
    if (unlocked.has(ach.id)) continue;
    const current = observedValue(ach.condition?.type, history, stats);
    if (current >= (ach.condition?.value ?? Infinity)) {
      unlocked.add(ach.id);
      newlyUnlocked.push(ach);
    }
  }

  if (newlyUnlocked.length) storage.set(UNLOCKED_KEY, [...unlocked]);
  return { unlocked: [...unlocked], newlyUnlocked };
}

/**
 * Called after a completed session. Returns only achievements that became
 * unlocked as a result, so the results page can celebrate them.
 *
 * @param {Object} session  the session just completed
 * @param {Object} stats    aggregate stats including the new session
 * @returns {Promise<Array>}
 */
export const checkAchievements = async (session, stats) => {
  const history = storage.get('history') || [];
  // Include the just-finished session even if the caller has not persisted it
  // yet, so a milestone hit on this run is credited on this run.
  const withCurrent = history.some((s) => s.timestamp === session.timestamp)
    ? history
    : [...history, session];

  return reconcile(withCurrent, stats).newlyUnlocked;
};

/**
 * Progress for every achievement, reconciling unlock state first so the page
 * reflects what the data actually supports.
 *
 * @param {Object} stats
 * @returns {Promise<Array>}
 */
export const getProgress = async (stats) => {
  const history = storage.get('history') || [];
  const { unlocked } = reconcile(history, stats);

  return getDefinitions().map((ach) => {
    const target = ach.condition?.value ?? 0;
    const current = observedValue(ach.condition?.type, history, stats);
    const isUnlocked = unlocked.includes(ach.id);

    return {
      ...ach,
      isUnlocked,
      currentValue: current,
      progress: target ? Math.min(100, (current / target) * 100) : 0,
    };
  });
};
