/**
 * Rounds and formats WPM.
 * @param {number} wpm
 * @returns {string}
 */
export const formatWPM = (wpm) => {
  if (isNaN(wpm) || wpm < 0) return '0';
  return Math.round(wpm).toString();
};

/**
 * Formats accuracy as a percentage string.
 * @param {number} accuracy - Value between 0 and 1 (or 0 and 100).
 * @returns {string}
 */
export const formatAccuracy = (accuracy) => {
  if (isNaN(accuracy)) return '0%';
  const val = accuracy <= 1 ? accuracy * 100 : accuracy;
  return `${Math.round(val)}%`;
};

/**
 * Formats seconds into "M:SS" string.
 * @param {number} seconds
 * @returns {string}
 */
export const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

/**
 * Formats a date object into "MMM D, YYYY".
 * @param {Date|number|string} date
 * @returns {string}
 */
export const formatDate = (date) => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

/**
 * Formats a number with locale commas.
 * @param {number} n
 * @returns {string}
 */
export const formatNumber = (n) => {
  return new Intl.NumberFormat().format(n);
};

/**
 * Formats duration into "Xm Ys".
 * @param {number} seconds
 * @returns {string}
 */
export const formatDuration = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m}m`;
  return `${m}m ${s}s`;
};

/**
 * Returns a human-readable relative time string.
 * @param {Date|number|string} date
 * @returns {string}
 */
export const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  let interval = seconds / 31536000;
  if (interval >= 1) { const val = Math.floor(interval); return val + (val === 1 ? ' year ago' : ' years ago'); }
  interval = seconds / 2592000;
  if (interval >= 1) { const val = Math.floor(interval); return val + (val === 1 ? ' month ago' : ' months ago'); }
  interval = seconds / 86400;
  if (interval >= 1) { const val = Math.floor(interval); return val + (val === 1 ? ' day ago' : ' days ago'); }
  interval = seconds / 3600;
  if (interval >= 1) { const val = Math.floor(interval); return val + (val === 1 ? ' hour ago' : ' hours ago'); }
  interval = seconds / 60;
  if (interval >= 1) { const val = Math.floor(interval); return val + (val === 1 ? ' minute ago' : ' minutes ago'); }
  const val = Math.floor(seconds);
  return val === 1 ? '1 second ago' : val + ' seconds ago';
};
