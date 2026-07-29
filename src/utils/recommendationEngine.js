/* Recommendation Engine for Weak Keys and Adaptive Practice */

/**
 * Retrieve recent sessions from localStorage.
 * @param {number} maxCount Maximum number of sessions to consider (default 50).
 * @returns {Array<Object>} Array of session objects.
 */
export function getRecentSessions(maxCount = 50) {
  try {
    const raw = localStorage.getItem('keyflow_sessions');
    const all = raw ? JSON.parse(raw) : [];
    // Take the most recent up to maxCount
    return all.slice(-maxCount);
  } catch (e) {
    console.warn('Failed to parse session history', e);
    return [];
  }
}

/**
 * Compute weak key statistics from an array of sessions.
 * Recent sessions are weighted more heavily (newer sessions get higher weight).
 * @param {Array<Object>} sessions
 * @returns {Array<Object>} Array of {key, errors, total, accuracy, trend}
 */
export function computeWeakKeyStatsFromSessions(sessions) {
  const keyMap = {};
  // Iterate from oldest to newest to apply weighting (newer higher weight)
  const totalSessions = sessions.length;
  sessions.forEach((session, idx) => {
    const weight = Math.pow(2, -(totalSessions - idx - 1)); // newest weight ~1, older smaller
    const log = session.keystrokeLog || [];
    log.forEach(entry => {
      const expected = entry.expected ? entry.expected.toLowerCase() : null;
      if (!expected) return;
      if (!keyMap[expected]) {
        keyMap[expected] = { errors: 0, total: 0, weightedErrors: 0, weightedTotal: 0 };
      }
      const stat = keyMap[expected];
      stat.total += 1;
      stat.weightedTotal += weight;
      if (!entry.correct) {
        stat.errors += 1;
        stat.weightedErrors += weight;
      }
    });
  });

  // Convert to array with accuracy and optional trend placeholder
  const result = Object.entries(keyMap).map(([key, data]) => {
    const accuracy = data.weightedTotal > 0 ? (1 - data.weightedErrors / data.weightedTotal) * 100 : 100;
    return {
      key,
      errors: Math.round(data.weightedErrors),
      total: Math.round(data.weightedTotal),
      accuracy: Math.round(accuracy * 100) / 100,
      trend: [] // placeholder for future extensions
    };
  });

  // Sort by errors descending
  result.sort((a, b) => b.errors - a.errors);
  return result;
}

/**
 * Get top N weak keys from recent session history.
 * @param {number} count Number of keys to return (default 5).
 * @returns {Array<Object>} Top weak key stats.
 */
export function getTopWeakKeys(count = 5) {
  const sessions = getRecentSessions();
  const stats = computeWeakKeyStatsFromSessions(sessions);
  return stats.slice(0, count);
}

/**
 * Generate practice text focused on the given weak keys.
 * The generated text gradually increases difficulty: isolated characters, then simple words.
 * @param {Array<string>} weakKeys Array of single-character strings.
 * @returns {string} Practice text.
 */
export function generatePracticeText(weakKeys) {
  const fragments = [];
  const commonSuffixes = ['a', 'e', 'i', 'o', 'u', 's', 't', 'r', 'n', 'l'];
  weakKeys.forEach(key => {
    // Isolated characters (repeat 10 times)
    fragments.push(Array(10).fill(key).join(' '));
    // Simple words containing the key
    const suffix = commonSuffixes[Math.floor(Math.random() * commonSuffixes.length)];
    const prefix = commonSuffixes[Math.floor(Math.random() * commonSuffixes.length)];
    fragments.push(`${key}${suffix}`);
    fragments.push(`${prefix}${key}`);
    // Mixed snippet
    fragments.push(`${prefix}${key}${suffix}`);
  });
  // Join with spaces and ensure a reasonable length
  return fragments.join(' ');
}

/**
 * Compute weak key stats for a single session (used for comparison after practice).
 * @param {Object} session Session object containing keystrokeLog.
 * @returns {Array<Object>} Array of stats per key.
 */
export function computeSessionWeakKeyStats(session) {
  if (!session) return [];
  const log = session.keystrokeLog || [];
  const keyMap = {};
  log.forEach(entry => {
    const expected = entry.expected ? entry.expected.toLowerCase() : null;
    if (!expected) return;
    if (!keyMap[expected]) keyMap[expected] = { errors: 0, total: 0 };
    const stat = keyMap[expected];
    stat.total += 1;
    if (!entry.correct) stat.errors += 1;
  });
  const result = Object.entries(keyMap).map(([key, data]) => ({
    key,
    errors: data.errors,
    total: data.total,
    accuracy: data.total > 0 ? Math.round((1 - data.errors / data.total) * 10000) / 100 : 100
  }));
  result.sort((a, b) => b.errors - a.errors);
  return result;
}
