import * as storage from './storage.js';

const HISTORY_KEY = 'history';
const MAX_SESSIONS = 500;

/**
 * Saves a completed session result to history.
 * @param {Object} result
 */
export const saveSession = (result) => {
  const history = storage.get(HISTORY_KEY) || [];
  // Preserve the caller's timestamp when present. Overwriting it here meant
  // the stored record no longer matched the object the page kept in memory,
  // so callers could not identify their own session in history.
  history.push({
    ...result,
    timestamp: result.timestamp ?? Date.now(),
  });

  if (history.length > MAX_SESSIONS) {
    history.shift();
  }
  
  storage.set(HISTORY_KEY, history);
  updateStreak();

  // Record the personal best here rather than at each call site. Previously
  // recordPersonalBest() was exported but never invoked, so stored bests
  // stayed at 0 and the "personal best" badge could never appear.
  if (typeof result.wpm === 'number') {
    recordPersonalBest(result.mode, {
      targetDuration: result.targetDuration,
      targetWordCount: result.targetWordCount,
    }, result.wpm);
  }
};

/**
 * Retrieves history sessions.
 * @param {number} [limit]
 * @returns {Array}
 */
export const getSessions = (limit) => {
  const history = storage.get(HISTORY_KEY) || [];
  return limit ? history.slice(-limit) : history;
};

/**
 * Retrieves sessions for a specific date.
 * @param {Date} date
 * @returns {Array}
 */
export const getSessionsByDate = (date) => {
  const history = storage.get(HISTORY_KEY) || [];
  const targetDate = new Date(date).setHours(0, 0, 0, 0);
  return history.filter(s => new Date(s.timestamp).setHours(0, 0, 0, 0) === targetDate);
};

/**
 * Calculates aggregate stats.
 * @returns {Object}
 */
export const getStats = () => {
  const history = getSessions();
  const totalTests = history.length;

  if (totalTests === 0) {
    return {
      totalTests: 0, avgWpm: 0, bestWpm: 0, avgAccuracy: 0,
      totalTime: 0, currentStreak: 0, bestStreak: 0, focusIndex: null
    };
  }

  const avgWpm = history.reduce((sum, s) => sum + s.wpm, 0) / totalTests;
  const bestWpm = Math.max(...history.map(s => s.wpm));
  const avgAccuracy = history.reduce((sum, s) => sum + s.accuracy, 0) / totalTests;
  const totalTime = history.reduce((sum, s) => sum + (s.duration || 0), 0);

  const { currentStreak, bestStreak } = getStreakInfo();

  return {
    totalTests,
    avgWpm,
    bestWpm,
    avgAccuracy,
    totalTime,
    currentStreak,
    bestStreak,
    focusIndex: calculateFocusIndex(history)
  };
};

/**
 * Focus index: a 0-100 score derived from how often the typist paused
 * mid-session (a pause = a >500ms gap between keystrokes, tracked live by
 * StatsEngine). Fewer pauses per 100 keystrokes → higher score. Only
 * sessions that actually recorded pause data are counted — older sessions
 * saved before this metric existed are skipped rather than treated as
 * flawless, since we have no real data for them.
 * @param {Array} history
 * @returns {number|null} null if no session has pause data yet
 */
const calculateFocusIndex = (history) => {
  const withPauseData = history.filter(
    (s) => typeof s.pauseCount === 'number' && typeof s.totalStrokes === 'number' && s.totalStrokes > 0
  );
  if (withPauseData.length === 0) return null;

  const pausesPer100Strokes =
    withPauseData.reduce((sum, s) => sum + (s.pauseCount / s.totalStrokes) * 100, 0) / withPauseData.length;

  // Each pause-per-100-strokes costs 4 points, floor at 0.
  return Math.max(0, Math.min(100, Math.round(100 - pausesPer100Strokes * 4)));
};

/**
 * Private helper to update streak information.
 */
const updateStreak = () => {
  const streak = storage.get('streak') || { current: 0, best: 0, lastActive: null };
  const today = new Date().setHours(0, 0, 0, 0);
  
  if (!streak.lastActive) {
    streak.current = 1;
    streak.lastActive = today;
  } else {
    const todayDate = new Date();
    const lastActiveDate = new Date(streak.lastActive);
    
    const d1 = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate());
    const d2 = new Date(lastActiveDate.getFullYear(), lastActiveDate.getMonth(), lastActiveDate.getDate());
    
    const diffDays = Math.round((d1 - d2) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      streak.current++;
    } else if (diffDays > 1) {
      streak.current = 1;
    }
    streak.lastActive = today;
  }
  
  streak.best = Math.max(streak.current, streak.best);
  storage.set('streak', streak);
};

/**
 * Returns streak info.
 * @returns {Object}
 */
export const getStreakInfo = () => {
  const streak = storage.get('streak') || { current: 0, best: 0, lastActive: null };
  return { currentStreak: streak.current, bestStreak: streak.best, lastActive: streak.lastActive };
};

/**
 * Builds the storage key for a personal-best record, scoped to mode +
 * relevant config (target duration for Time, target word count for Words)
 * so a 15s sprint and a 60s test each track their own best.
 * @param {string} mode
 * @param {{targetDuration?: number, targetWordCount?: number}} [config]
 * @returns {string}
 */
export const getPersonalBestKey = (mode, config = {}) => {
  const configPart = mode === 'time' ? `-${config.targetDuration || 30}s`
    : mode === 'words' ? `-${config.targetWordCount || 50}w`
    : '';
  return `pb-${mode || 'default'}${configPart}`;
};

/**
 * Reads the stored personal-best WPM for a mode + config.
 * @param {string} mode
 * @param {Object} [config]
 * @returns {number}
 */
export const getPersonalBest = (mode, config = {}) => {
  return storage.get(getPersonalBestKey(mode, config)) || 0;
};

/**
 * Records a new personal-best WPM if it beats the stored one.
 * @param {string} mode
 * @param {Object} config
 * @param {number} wpm
 * @returns {boolean} true if this was a new personal best
 */
export const recordPersonalBest = (mode, config, wpm) => {
  const key = getPersonalBestKey(mode, config);
  const previousBest = storage.get(key) || 0;
  const isNewBest = wpm > previousBest;
  if (isNewBest) storage.set(key, wpm);
  return isNewBest;
};

/**
 * Gets data formatted for a Github-style heatmap.
 * @returns {Array<{date: string, count: number}>}
 */
export const getHeatmapData = () => {
  const history = getSessions();
  const dataMap = {};
  
  history.forEach(s => {
    const d = new Date(s.timestamp).toISOString().split('T')[0];
    dataMap[d] = (dataMap[d] || 0) + 1;
  });
  
  return Object.keys(dataMap).map(date => ({
    date,
    count: dataMap[date]
  }));
};
