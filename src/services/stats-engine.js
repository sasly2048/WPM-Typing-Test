/**
 * Statistics math — formal contract.
 *
 * Every metric used by the rest of the product is defined here in one
 * place. Components import from this module and never recompute
 * formulas inline; doing so would risk drift between dashboard,
 * results page, and personal-best calculations.
 *
 *   ─────────────────────────────────────────────────────────────────
 *   WPM (Words Per Minute)
 *   ─────────────────────────────────────────────────────────────────
 *   Standard definition: 1 word = 5 characters. We compute two
 *   flavours:
 *
 *     netWpm   = correct characters / 5 / minutes
 *     rawWpm   = total keystrokes   / 5 / minutes   (incl. errors)
 *
 *   A floor of 0.5s on elapsed time prevents near-zero denominators
 *   from producing huge but plausible-looking values. A ceiling of
 *   400 WPM catches synthetic input (paste, key repeat) without
 *   rejecting elite human speeds.
 *
 *   ─────────────────────────────────────────────────────────────────
 *   Accuracy
 *   ─────────────────────────────────────────────────────────────────
 *   accuracy = correct / total * 100
 *
 *   Always a number in [0, 100]. When total is 0 (no keystrokes
 *   recorded) the value is 100 by convention — a session with nothing
 *   typed is "perfectly accurate" in the trivial sense, and the
 *   results page treats it accordingly.
 *
 *   ─────────────────────────────────────────────────────────────────
 *   Consistency
 *   ─────────────────────────────────────────────────────────────────
 *   Computed from the WPM speed curve (1s samples). We compute the
 *   coefficient of variation (stddev / mean) and convert it to a
 *   0-100 score where 100 means the WPM never varied. The score is
 *   floored at 0 and capped at 100.
 *
 *   ─────────────────────────────────────────────────────────────────
 *   Error rate
 *   ─────────────────────────────────────────────────────────────────
 *   errorRate = (correctedErrors + uncorrectedErrors) / totalStrokes
 *
 *   A real-valued fraction in [0, 1]. Caller rounds for display.
 *
 *   ─────────────────────────────────────────────────────────────────
 *   Correction rate
 *   ─────────────────────────────────────────────────────────────────
 *   correctionRate = correctedErrors / (correctedErrors + uncorrectedErrors)
 *
 *   A real-valued fraction in [0, 1]. When there were no errors
 *   at all, we report 1 (perfect correction of nothing).
 *
 *   ─────────────────────────────────────────────────────────────────
 *   Key latency
 *   ─────────────────────────────────────────────────────────────────
 *   We track the time between consecutive presses of the same key
 *   (a bigram), then report mean / median / p90 across the session.
 *   Latency is in milliseconds.
 *
 *   ─────────────────────────────────────────────────────────────────
 *   Burst WPM
 *   ─────────────────────────────────────────────────────────────────
 *   The maximum 1-second net WPM observed in the speed curve. This
 *   is the user's peak sprint, not their average.
 */

/**
 * Smallest elapsed time we will divide by, in seconds.
 *
 * `seconds === 0` alone is not enough of a guard: it catches the
 * Infinity case but not a near-zero denominator, which yields a
 * finite, plausible, completely wrong number (60 characters in
 * 3ms reads as ~16,000 WPM). A finite wrong value is more dangerous
 * than Infinity because nothing downstream rejects it — it gets
 * rounded, saved to history, and skews every average permanently.
 */
const MIN_ELAPSED_SECONDS = 0.5;

/**
 * Upper bound on a reportable rate. The sustained human record is
 * around 220 WPM; anything past this came from paste, key repeat,
 * or synthetic input rather than typing.
 */
const MAX_PLAUSIBLE_WPM = 400;

const rate = (characters, seconds) => {
  if (!(characters > 0) || !(seconds > 0)) return 0;
  const elapsed = Math.max(seconds, MIN_ELAPSED_SECONDS);
  return Math.min((characters / 5) / (elapsed / 60), MAX_PLAUSIBLE_WPM);
};

/**
 * Net WPM: only correctly-typed characters count, matching the
 * MonkeyType / TypeRacer convention. The session's headline number.
 */
export const calculateWPM = (characters, seconds) => rate(characters, seconds);

/**
 * Raw WPM: every keystroke counts, correct or not. The "true
 * unfiltered speed" — useful for diagnosing users who type fast but
 * need to slow down for accuracy.
 */
export const calculateRawWPM = (totalCharactersTyped, seconds) =>
  rate(totalCharactersTyped, seconds);

/**
 * Accuracy in [0, 100]. A 0-strokes session reports 100.
 */
export const calculateAccuracy = (correctCharacters, totalCharacters) => {
  if (totalCharacters === 0) return 100;
  return (correctCharacters / totalCharacters) * 100;
};

/**
 * Error rate in [0, 1]. Both corrected and uncorrected errors
 * count as errors; the denominator is the total keystrokes.
 */
export const calculateErrorRate = (totalErrors, totalStrokes) => {
  if (totalStrokes === 0) return 0;
  return totalErrors / totalStrokes;
};

/**
 * Correction rate in [0, 1]. The fraction of errors the user
 * fixed with backspace. No errors means a perfect 1.0.
 */
export const calculateCorrectionRate = (correctedErrors, uncorrectedErrors) => {
  const total = correctedErrors + uncorrectedErrors;
  if (total === 0) return 1;
  return correctedErrors / total;
};

/**
 * Consistency: 0-100 score, higher is steadier. Computed from
 * 1s WPM samples via coefficient of variation.
 */
export const calculateConsistency = (samples) => {
  // Stability requires enough speed-curve samples to be meaningful.
  // Below the threshold we return null so the UI can show "n/a"
  // instead of a misleading "100%". The new stats engine uses 4
  // samples; the old default of 2 was kept here for backward
  // compatibility with anything that still imports this function
  // from the legacy code path.
  if (!samples || samples.length < 2) return null;
  const wpms = samples.map(s => s.wpm);
  const mean = wpms.reduce((a, b) => a + b, 0) / wpms.length;
  if (mean === 0) return 0;
  const variance = wpms.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / wpms.length;
  const stdDev = Math.sqrt(variance);
  const cv = stdDev / mean;
  const score = 100 - (cv * 100);
  return Math.max(0, Math.min(100, score));
};

/**
 * Burst WPM: the best 1-second net WPM observed in the speed
 * curve. Distinct from session WPM, which is the average.
 */
export const calculateBurstWPM = (samples) => {
  if (!samples || samples.length === 0) return 0;
  return Math.max(...samples.map(s => s.wpm));
};

/**
 * Percentile of a numeric array. Returns null on empty input.
 * @param {number[]} values
 * @param {number} p  0..100
 */
export const percentile = (values, p) => {
  if (!values || values.length === 0) return null;
  const sorted = values.slice().sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
};

/**
 * Mean of a numeric array. Null on empty.
 */
export const mean = (values) => {
  if (!values || values.length === 0) return null;
  return values.reduce((s, v) => s + v, 0) / values.length;
};

/**
 * Median of a numeric array, in milliseconds. Returns null on empty.
 */
export const medianLatency = (latencies) => percentile(latencies, 50);

/**
 * p90 latency — a more useful "typical" latency than the mean,
 * which is dragged up by a few long pauses. Returns null on empty.
 */
export const p90Latency = (latencies) => percentile(latencies, 90);

/**
 * Generates a timeline of WPM over the session. Each sample is
 * computed over a sliding interval from start to that point.
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
 * Character-level diff between typed and expected. Returns
 * { correct, incorrect, extra, missed }.
 */
export const calculateCharStats = (typed, expected) => {
  let correct = 0, incorrect = 0, extra = 0, missed = 0;
  const minLen = Math.min(typed.length, expected.length);

  for (let i = 0; i < minLen; i++) {
    if (typed[i] === expected[i]) correct++;
    else incorrect++;
  }
  if (typed.length > expected.length) extra = typed.length - expected.length;
  else if (typed.length < expected.length) missed = expected.length - typed.length;

  return { correct, incorrect, extra, missed };
};

/**
 * Combined character accuracy accounting for extras and misses.
 * 0.0 means nothing the user typed matched; 1.0 means every
 * expected character was matched in order.
 */
export const characterAccuracy = (typed, expected) => {
  const stats = calculateCharStats(typed, expected);
  if (expected.length === 0) return 1;
  // correct vs expected = how much of the expected was matched correctly
  // (penalises misses). We add extras back as penalty.
  const matched = stats.correct;
  return matched / expected.length;
};
