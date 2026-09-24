import { calculateWPM, calculateRawWPM } from '../services/stats-engine.js';

/**
 * Stats engine.
 *
 * One source of truth for every session-level metric the rest of the
 * product reads. The engine records every keystroke, classifies it
 * (correct / incorrect / extra / backspace / miss), and exposes the
 * aggregate counts via getDetailedStats().
 *
 *   Keystroke lifecycle
 *   ───────────────────
 *   1. The user presses a key. recordKeystroke() is called with:
 *        - char     : the key the user actually pressed
 *        - expected : the character that was expected at the cursor
 *        - correct  : true iff char === expected
 *   2. If the user pressed Backspace, the engine counts that as a
 *      correction event. Each correction may resolve a prior error;
 *      the engine tracks uncorrected vs. corrected errors and the
 *      time between a mistake and its fix.
 *   3. At finish(), the engine produces a single, immutable stats
 *      object that downstream code can serialize to history and the
 *      results page.
 *
 * The engine does not own the text or the cursor — those live in the
 * adapter. It just records what was pressed, when, and whether it
 * matched.
 */
export class StatsEngine {
  constructor() {
    this.reset();
  }

  reset() {
    this.timeline = []; // [{ timestamp, char, expected, correct, timeSinceLast, isBackspace }]
    this.pauses = [];
    this.startTime = null;
    this.endTime = null;
    this.lastKeystrokeTime = null;

    // Counts
    this.totalStrokes = 0;
    this.correctStrokes = 0;
    this.backspaceCount = 0;
    this.correctedErrors = 0;
    this.uncorrectedErrors = 0;
    this.reactionTimes = [];

    // Streak
    this.currentStreak = 0;
    this.longestStreak = 0;

    // Speed curve: per-second net WPM samples
    this.speedCurve = [];
    this.burstSpeed = 0;
    this.speedInterval = 1000;
    this.lastIntervalTime = null;
    this.strokesInInterval = 0;
    this.correctStrokesInInterval = 0;

    // Per-key mistake tally (for the heatmap)
    this.mistakesByKey = Object.create(null);

    // Open errors: a queue of { expected, mistakeTime } entries for
    // every error the user has typed but not yet corrected. When the
    // user types a Backspace that walks back over an error, we resolve
    // the oldest entry into a corrected error and time its recovery.
    this._openErrors = [];

    // Per-key latency
    this._keyLatencies = [];
    this._lastCharTime = null;
    this._lastChar = null;

    // Pause bookkeeping
    this._pauseStartedAt = null;
  }

  start() {
    this.startTime = performance.now();
    this.lastKeystrokeTime = this.startTime;
    this.lastIntervalTime = this.startTime;
  }

  /**
   * Record a single keystroke. The caller is responsible for marking
   * backspace events via the helper on the input event:
   *
   *   recordKeystroke({ char, expected, correct, isBackspace })
   */
  recordKeystroke(input) {
    // Accept both the new shape and the legacy positional args so the
    // call sites in practice/developer can be migrated at their own
    // pace without breaking the build.
    const { char, expected, correct, isBackspace = false, isExtra = false } =
      typeof input === 'object' && input !== null
        ? input
        : { char: arguments[0], expected: arguments[1], correct: arguments[2] };

    if (!this.startTime) this.start();

    const now = performance.now();
    const timeSinceLast = now - this.lastKeystrokeTime;

    // Pause detection: a >2s gap is too long to be a real rhythm break.
    // Anything 1.5-2s is borderline; we keep it as a single pause only
    // if the user did not type in that window.
    if (timeSinceLast > 2000) {
      this.pauses.push({ start: this.lastKeystrokeTime, end: now, duration: timeSinceLast });
    }

    this.totalStrokes++;

    // ----- key latency -----
    // Latency is the time between two consecutive presses of the same
    // character (bigram latency), which approximates the motor cost of
    // a single key. We track all observed latencies and report
    // average/median/p90 in the stats object.
    if (!isBackspace && typeof char === 'string' && char.length === 1) {
      if (this._lastChar !== null && this._lastChar === char) {
        const lat = now - this._lastCharTime;
        if (lat < 5000) this._keyLatencies.push(lat);
      }
      this._lastChar = char;
      this._lastCharTime = now;
    }

    // ----- backspace handling -----
    if (isBackspace) {
      this.backspaceCount++;
      // Resolve an open error if the user is walking back over a known
      // mistake. This is approximate: we don't have access to the
      // adapter's typed-text length, so we treat any open error as
      // potentially-resolved on backspace. The last open error wins,
      // since the user is correcting the most recent mistake first.
      if (this._openErrors.length > 0) {
        const open = this._openErrors.pop();
        this.correctedErrors++;
        // Recovery time: how long between the mistake and the fix.
        const recovered = now - open.mistakeTime;
        if (recovered < 60000) {
          // 60s upper bound — a "recovery" older than that is not a
          // recovery, the user moved on and came back.
          open.recoveredAt = now;
          open.recoveryMs = recovered;
        }
      }
    } else if (!correct) {
      // Mistake. Queue it as an open error.
      this._openErrors.push({
        expected: typeof expected === 'string' ? expected : null,
        char,
        mistakeTime: now,
      });
      this.currentStreak = 0;
      this.mistakesByKey[this._normaliseKey(char)] =
        (this.mistakesByKey[this._normaliseKey(char)] || 0) + 1;
    } else {
      // Correct keystroke.
      this.correctStrokes++;
      this.correctStrokesInInterval++;
      this.currentStreak++;
      if (this.currentStreak > this.longestStreak) this.longestStreak = this.currentStreak;
    }

    this.strokesInInterval++;

    if (now - this.lastIntervalTime >= this.speedInterval) {
      const intervalSec = (now - this.lastIntervalTime) / 1000;
      const wpm = calculateWPM(this.correctStrokesInInterval, intervalSec);
      this.speedCurve.push({ time: now - this.startTime, wpm });
      // Burst speed: the best 1-second net WPM observed in the run.
      // Reads as a peak on the speed curve, not an average.
      if (wpm > this.burstSpeed) this.burstSpeed = wpm;
      this.lastIntervalTime = now;
      this.strokesInInterval = 0;
      this.correctStrokesInInterval = 0;
    }

    this.timeline.push({
      timestamp: now - this.startTime,
      char,
      expected: typeof expected === 'string' ? expected : null,
      correct,
      isBackspace,
      isExtra,
      timeSinceLast,
    });

    this.lastKeystrokeTime = now;
  }

  _normaliseKey(key) {
    if (key === ' ') return 'space';
    if (key === 'Enter') return 'enter';
    if (key === 'Backspace') return 'backspace';
    if (key === 'Tab') return 'tab';
    if (typeof key !== 'string') return '';
    if (key.length === 1) return key.toLowerCase();
    return key.toLowerCase();
  }

  finish() {
    if (this.endTime == null) this.endTime = performance.now();
    if (this.strokesInInterval > 0 && this.lastIntervalTime) {
      const now = this.endTime;
      const intervalSec = (now - this.lastIntervalTime) / 1000;
      const wpm = calculateWPM(this.correctStrokesInInterval, intervalSec);
      this.speedCurve.push({ time: now - this.startTime, wpm });
      if (wpm > this.burstSpeed) this.burstSpeed = wpm;
    }
    // Anything still open in the error queue is an uncorrected error
    // by the time the session ends.
    this.uncorrectedErrors = this._openErrors.length;
  }

  /**
   * Percentile of an array. Returns null on empty input.
   * @param {number[]} values
   * @param {number} p  0..100
   */
  static _percentile(values, p) {
    if (!values.length) return null;
    const sorted = values.slice().sort((a, b) => a - b);
    const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
    return sorted[idx];
  }

  /**
   * Mean of an array. Null on empty.
   */
  static _mean(values) {
    if (!values.length) return null;
    return values.reduce((s, v) => s + v, 0) / values.length;
  }

  getDetailedStats() {
    const totalTimeMs = (this.endTime || performance.now()) - this.startTime;
    const totalTimeSec = totalTimeMs / 1000;

    const wpm = calculateWPM(this.correctStrokes, totalTimeSec);
    const rawWpm = calculateRawWPM(this.totalStrokes, totalTimeSec);
    // Character (final-state) accuracy, to match stats.js so the two engines'
    // numbers can be averaged together in history without a denominator
    // mismatch. stats.js computes correct / (correct + incorrect + extra) from
    // the final typed positions, where a corrected error does not count
    // against accuracy. The keystroke-model equivalent is the correct chars
    // that stuck over those plus the errors left uncorrected at finish.
    // (Was correctStrokes / totalStrokes -- a keystroke denominator that made
    // code-mode accuracy systematically lower than prose in the shared avg.)
    const finalDenom = this.correctStrokes + this.uncorrectedErrors;
    const accuracy = finalDenom > 0
      ? (this.correctStrokes / finalDenom) * 100
      : 100;

    const totalMistakes = this.correctedErrors + this.uncorrectedErrors;
    const errorRate = this.totalStrokes > 0 ? totalMistakes / this.totalStrokes : 0;
    const correctionRate = totalMistakes > 0 ? this.correctedErrors / totalMistakes : 1;

    // Per-character key latency: median + p90.
    const medianLatency = StatsEngine._percentile(this._keyLatencies, 50);
    const p90Latency = StatsEngine._percentile(this._keyLatencies, 90);
    const meanLatency = StatsEngine._mean(this._keyLatencies);

    // Total pause time.
    const totalPauseMs = this.pauses.reduce((s, p) => s + p.duration, 0);
    const pauseCount = this.pauses.length;

    return {
      wpm: Math.round(wpm),
      rawWpm: Math.round(rawWpm),
      accuracy: Math.round(accuracy * 100) / 100,
      errors: totalMistakes,
      uncorrectedErrors: this.uncorrectedErrors,
      correctedErrors: this.correctedErrors,
      errorRate: Math.round(errorRate * 1000) / 1000,
      correctionRate: Math.round(correctionRate * 1000) / 1000,
      backspaceCount: this.backspaceCount,
      longestStreak: this.longestStreak,
      burstWpm: Math.round(this.burstSpeed),
      meanLatencyMs: meanLatency ? Math.round(meanLatency) : null,
      medianLatencyMs: medianLatency ? Math.round(medianLatency) : null,
      p90LatencyMs: p90Latency ? Math.round(p90Latency) : null,
      totalPauseMs: Math.round(totalPauseMs),
      pauseCount,
      totalTimeMs: Math.round(totalTimeMs),
      timeline: this.timeline,
      pauses: this.pauses,
      speedCurve: this.speedCurve,
      totalStrokes: this.totalStrokes,
      correctStrokes: this.correctStrokes,
      mistakesByKey: { ...this.mistakesByKey }
    };
  }
}
