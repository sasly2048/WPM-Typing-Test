/**
 * Smallest elapsed time we will divide by, in seconds.
 *
 * `seconds === 0` alone is not enough of a guard: it catches the Infinity
 * case but not a near-zero denominator, which yields a finite, plausible,
 * completely wrong number (60 characters in 3ms reads as ~16,000 WPM). A
 * finite wrong value is more dangerous than Infinity because nothing
 * downstream rejects it — it gets rounded, saved to history, and skews every
 * average permanently.
 */
const MIN_ELAPSED_SECONDS = 0.5;

/**
 * Upper bound on a reportable rate. The sustained human record is ~220 WPM;
 * anything past this came from paste, key repeat, or synthetic input rather
 * than typing.
 */
const MAX_PLAUSIBLE_WPM = 400;

/**
 * @param {number} characters
 * @param {number} seconds
 * @returns {number}
 */
const rate = (characters, seconds) => {
  if (!(characters > 0) || !(seconds > 0)) return 0;
  const elapsed = Math.max(seconds, MIN_ELAPSED_SECONDS);
  return Math.min((characters / 5) / (elapsed / 60), MAX_PLAUSIBLE_WPM);
};

/**
 * Calculates standard WPM (correct characters only).
 * Standard word = 5 characters.
 * @param {number} characters
 * @param {number} seconds
 * @returns {number}
 */
export const calculateWPM = (characters, seconds) => rate(characters, seconds);

/**
 * Calculates raw WPM (all typed characters, including mistakes).
 * @param {number} totalCharactersTyped
 * @param {number} seconds
 * @returns {number}
 */
export const calculateRawWPM = (totalCharactersTyped, seconds) =>
  rate(totalCharactersTyped, seconds);

/**
 * Calculates accuracy percentage.
 * @param {number} correctCharacters
 * @param {number} totalCharacters
 * @returns {number}
 */
export const calculateAccuracy = (correctCharacters, totalCharacters) => {
  if (totalCharacters === 0) return 100;
  return (correctCharacters / totalCharacters) * 100;
};

/**
 * Calculates consistency (coefficient of variation of WPM samples).
 * @param {Array<{time: number, wpm: number}>} samples
 * @returns {number} 0-100 score, higher is better
 */
export const calculateConsistency = (samples) => {
  if (samples.length < 2) return 100;
  const wpms = samples.map(s => s.wpm);
  const mean = wpms.reduce((a, b) => a + b, 0) / wpms.length;
  if (mean === 0) return 0;
  const variance = wpms.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / wpms.length;
  const stdDev = Math.sqrt(variance);
  const cv = stdDev / mean;
  
  // Convert CV to a score out of 100
  let score = 100 - (cv * 100);
  return Math.max(0, Math.min(100, score));
};

/**
 * Generates a timeline of WPM over the session.
 * @param {Array<{char: string, timestamp: number, correct: boolean}>} keystrokes
 * @param {number} startTime
 * @param {number} intervalSeconds
 * @returns {Array<{time: number, wpm: number}>}
 */
export const generateWPMTimeline = (keystrokes, startTime, intervalSeconds = 1) => {
  const timeline = [];
  if (keystrokes.length === 0) return timeline;

  const endTime = keystrokes[keystrokes.length - 1].timestamp;
  const totalSeconds = (endTime - startTime) / 1000;
  
  for (let t = 1; t <= Math.ceil(totalSeconds); t += intervalSeconds) {
    const elapsedMs = t * 1000;
    const limitTime = startTime + elapsedMs;
    const strokesToConsider = keystrokes.filter(k => k.timestamp <= limitTime);
    const correctStrokes = strokesToConsider.filter(k => k.correct).length;
    
    timeline.push({
      time: t,
      wpm: calculateWPM(correctStrokes, t)
    });
  }
  return timeline;
};

/**
 * Calculates detailed character statistics.
 * @param {string} typed
 * @param {string} expected
 * @returns {Object}
 */
export const calculateCharStats = (typed, expected) => {
  let correct = 0, incorrect = 0, extra = 0, missed = 0;
  
  const minLen = Math.min(typed.length, expected.length);
  
  for (let i = 0; i < minLen; i++) {
    if (typed[i] === expected[i]) {
      correct++;
    } else {
      incorrect++;
    }
  }
  
  if (typed.length > expected.length) {
    extra = typed.length - expected.length;
  } else if (typed.length < expected.length) {
    missed = expected.length - typed.length;
  }
  
  return { correct, incorrect, extra, missed };
};
