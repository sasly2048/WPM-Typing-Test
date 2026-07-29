import * as storage from './storage.js';

let definitionsCache = null;

/**
 * Loads achievement definitions lazily.
 * @returns {Promise<Array>}
 */
const loadDefinitions = async () => {
  if (definitionsCache) return definitionsCache;
  try {
    const res = await fetch('/src/data/achievements.json');
    definitionsCache = await res.json();
    return definitionsCache;
  } catch (e) {
    console.error('Failed to load achievements.json', e);
    return [];
  }
};

/**
 * Checks for newly unlocked achievements based on session and overall stats.
 * @param {Object} session
 * @param {Object} stats
 * @returns {Promise<Array>} Array of newly unlocked achievements
 */
export const checkAchievements = async (session, stats) => {
  const definitions = await loadDefinitions();
  const unlocked = getUnlocked();
  const newlyUnlocked = [];

  definitions.forEach(ach => {
    if (unlocked.includes(ach.id)) return;
    
    let isUnlocked = false;
    switch (ach.condition.type) {
      case 'tests_completed':
        isUnlocked = stats.totalTests >= ach.condition.value;
        break;
      case 'wpm_reached':
        isUnlocked = session.wpm >= ach.condition.value;
        break;
      case 'accuracy_reached':
        isUnlocked = session.accuracy >= ach.condition.value;
        break;
      case 'streak_days':
        isUnlocked = stats.currentStreak >= ach.condition.value;
        break;
      case 'consistency_reached':
        isUnlocked = session.consistency >= ach.condition.value;
        break;
      case 'perfect_test':
        isUnlocked = session.accuracy === 100 && session.wpm > 0;
        break;
    }

    if (isUnlocked) {
      newlyUnlocked.push(ach);
      unlocked.push(ach.id);
    }
  });

  if (newlyUnlocked.length > 0) {
    storage.set('unlocked_achievements', unlocked);
  }

  return newlyUnlocked;
};

/**
 * Gets array of unlocked achievement IDs.
 * @returns {Array<string>}
 */
export const getUnlocked = () => {
  return storage.get('unlocked_achievements') || [];
};

/**
 * Returns progress data for all achievements.
 * @param {Object} stats
 * @returns {Promise<Array>}
 */
export const getProgress = async (stats) => {
  const definitions = await loadDefinitions();
  const unlocked = getUnlocked();

  return definitions.map(ach => {
    let current = 0;
    switch (ach.condition.type) {
      case 'tests_completed': current = stats.totalTests; break;
      case 'wpm_reached': current = stats.bestWpm; break;
      case 'accuracy_reached': current = stats.avgAccuracy; break; // approximation
      case 'streak_days': current = stats.currentStreak; break;
      default: current = unlocked.includes(ach.id) ? ach.condition.value : 0;
    }
    
    return {
      ...ach,
      isUnlocked: unlocked.includes(ach.id),
      progress: Math.min(100, (current / ach.condition.value) * 100),
      currentValue: current
    };
  });
};
