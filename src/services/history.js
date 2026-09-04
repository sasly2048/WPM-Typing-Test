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
  const raw = storage.get(HISTORY_KEY);
  const history = Array.isArray(raw) ? raw : [];
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
 * Build a key for a personal-best record, scoped to mode + relevant
 * config (target duration for Time, target word count for Words) so
 * a 15s sprint and a 60s test each track their own best.
 *
 * The key is used as a field inside the `personal_bests` map (the
 * only whitelisted suffix in the storage schema). The map shape is
 *   { 'time-30s': 87, 'words-50w': 92, ... }
 * which lets us round-trip a full backup without writing arbitrary
 * keys that the storage layer would reject.
 * @param {string} mode
 * @param {{targetDuration?: number, targetWordCount?: number}} [config]
 * @returns {string}
 */
export const getPersonalBestKey = (mode, config = {}) => {
  let suffix = mode || 'default';
  if (mode === 'time' && config.targetDuration) suffix += `-${config.targetDuration}s`;
  else if (mode === 'words' && config.targetWordCount) suffix += `-${config.targetWordCount}w`;
  return suffix;
};

/**
 * Reads the stored personal-best WPM for a mode + config. Backs onto
 * the `personal_bests` map in the storage schema.
 * @param {string} mode
 * @param {Object} [config]
 * @returns {number}
 */
export const getPersonalBest = (mode, config = {}) => {
  const all = storage.get('personal_bests');
  if (!all || typeof all !== 'object') return 0;
  const v = all[getPersonalBestKey(mode, config)];
  return typeof v === 'number' ? v : 0;
};

/**
 * Records a new personal-best WPM if it beats the stored one. Reads
 * the existing map, mutates one field, writes it back. Returns true
 * when the stored value actually changed.
 * @param {string} mode
 * @param {Object} config
 * @param {number} wpm
 * @returns {boolean} true if this was a new personal best
 */
export const recordPersonalBest = (mode, config, wpm) => {
  if (typeof wpm !== 'number' || !isFinite(wpm) || wpm <= 0) return false;
  const existing = storage.get('personal_bests');
  const map = (existing && typeof existing === 'object' && !Array.isArray(existing)) ? { ...existing } : {};
  const key = getPersonalBestKey(mode, config);
  const previousBest = typeof map[key] === 'number' ? map[key] : 0;
  const isNewBest = wpm > previousBest;
  if (isNewBest) {
    map[key] = wpm;
    storage.set('personal_bests', map);
  }
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

/**
 * Aggregate per-mode stats. Returns one entry per mode the user has
 * actually used, with average and best WPM, accuracy, and total tests.
 * Used by the dashboard's per-mode breakdown card.
 * @param {Array} [history]
 * @returns {Array<{mode, tests, bestWpm, avgWpm, avgAccuracy}>}
 */
export const getModeBreakdown = (history) => {
  const sessions = history || getSessions();
  const groups = new Map();
  for (const s of sessions) {
    const m = s.mode || 'unknown';
    if (!groups.has(m)) groups.set(m, []);
    groups.get(m).push(s);
  }
  return [...groups.entries()].map(([mode, list]) => {
    const wpmList = list.map((s) => s.wpm || 0);
    const accList = list.map((s) => s.accuracy || 0);
    return {
      mode,
      tests: list.length,
      bestWpm: wpmList.length ? Math.max(...wpmList) : 0,
      avgWpm: wpmList.length ? wpmList.reduce((a, b) => a + b, 0) / wpmList.length : 0,
      avgAccuracy: accList.length ? accList.reduce((a, b) => a + b, 0) / accList.length : 0,
    };
  }).sort((a, b) => b.tests - a.tests);
};

/**
 * Per-day aggregated stats for the last N days. Used for the daily
 * activity bar chart on the dashboard.
 * @param {number} [days=30]
 * @returns {Array<{date: string, wpm: number, tests: number, accuracy: number}>}
 */
export const getDailyStats = (days = 30) => {
  const cutoff = Date.now() - days * 86400000;
  const sessions = getSessions().filter((s) => s.timestamp >= cutoff);
  const map = new Map();
  for (const s of sessions) {
    const date = new Date(s.timestamp).toISOString().split('T')[0];
    if (!map.has(date)) map.set(date, []);
    map.get(date).push(s);
  }
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
    const list = map.get(d) || [];
    const wpmList = list.map((s) => s.wpm || 0);
    out.push({
      date: d,
      tests: list.length,
      wpm: wpmList.length ? wpmList.reduce((a, b) => a + b, 0) / wpmList.length : 0,
      accuracy: list.length ? list.reduce((a, b) => a + (b.accuracy || 0), 0) / list.length : 0,
    });
  }
  return out;
};

/**
 * Personal best per mode. Reads the canonical `personal_bests` map.
 * @returns {Array<{mode, wpm, key, configLabel}>}
 */
export const getAllPersonalBests = () => {
  const all = storage.get('personal_bests');
  const map = (all && typeof all === 'object' && !Array.isArray(all)) ? all : {};
  const out = [];
  for (const [key, wpm] of Object.entries(map)) {
    if (typeof wpm !== 'number') continue;
    const [mode] = key.split('-');
    out.push({ mode, wpm, key });
  }
  return out.sort((a, b) => b.wpm - a.wpm);
};
