/**
 * StatsEngine.
 *
 * One source of truth for every session-level metric. Reads the
 * session model and the live input event stream; produces the
 * stats object the results page, dashboard, and achievements
 * service consume.
 *
 * Definitions (formal contract — every metric documented here
 * matches the key on the returned object).
 *
 *   wpm                 — net words per minute. Counted as:
 *                          (correct characters / 5) / (elapsed minutes).
 *                          Backspace is NOT counted. Missed characters
 *                          are NOT counted. The session duration is
 *                          the configured test duration in time mode,
 *                          or the elapsed wall-clock in every other
 *                          mode. This is the headline number.
 *
 *   rawWpm              — characters per minute including mistakes.
 *                          (typed characters / 5) / (elapsed minutes).
 *                          Backspace is NOT counted.
 *
 *   accuracy            — correct / (correct + incorrect + extra)
 *                          multiplied by 100. Editing operations
 *                          (backspace) are excluded from the
 *                          denominator. The previous design
 *                          conflated these.
 *
 *   correct / incorrect / extra / missed
 *                        — character-level counts. Extra is a
 *                          character the user typed where the
 *                          source had no character (overshoot);
 *                          missed is a position the user passed
 *                          without typing.
 *
 *   backspaceCount      — number of backspace keys pressed. Tracked
 *                          separately so a heavy editor can be
 *                          compared to a clean typist.
 *
 *   correctedErrors     — number of backspaces that erased a
 *                          character the user had typed wrong. The
 *                          correction rate is corrected / totalErrors.
 *
 *   burstWpm            — the best 1-second net WPM observed in
 *                          the speed curve. Distinct from session
 *                          WPM, which is an average.
 *
 *   meanLatencyMs / medianLatencyMs / p90LatencyMs
 *                        — the time between consecutive presses of
 *                          the same key (bigram latency). Reported
 *                          in milliseconds.
 *
 *   stability           — 0-100 score, higher is steadier. Returns
 *                          null (NOT 100) when the session is too
 *                          short to compute a meaningful value, so
 *                          the UI can show "n/a" instead of "100%"
 *                          for sessions with one or two samples.
 *
 *   totalPauseMs        — total time spent in pauses (>2s gaps
 *                          between keystrokes). Different from idle:
 *                          pauses are intentional long stops, not
 *                          ambient idle.
 *
 *   mistakesByKey       — map of { char: count } of incorrect
 *                          presses. Used by the key heatmap and the
 *                          adaptive trainer.
 *
 * Speed curve
 * -----------
 * The curve is sampled at fixed 1-second intervals from a wall-clock
 * ticker, NOT from keystroke arrival. This means a sparse typist gets
 * the same number of samples as a fast one, and the consistency
 * score isn't biased by typing density.
 */
import { percentile, mean } from './stats-engine.js';

const MIN_ELAPSED_SECONDS = 0.5;
const SPEED_INTERVAL_MS = 1000;
const STABILITY_MIN_SAMPLES = 4;

export const createStats = () => {
  const reset = () => ({
    // Counters
    typedCharacters: 0,
    correctCharacters: 0,
    incorrectCharacters: 0,
    extraCharacters: 0,
    missedCharacters: 0,
    backspaceCount: 0,
    correctedErrors: 0,
    uncorrectedErrors: 0,

    // Live mistake-by-key map (for the heatmap and the adaptive
    // trainer). Updated from the live event stream, not from a
    // snapshot.
    mistakesByKey: Object.create(null),

    // Speed curve: { timeMs, wpm } sampled at fixed intervals
    speedCurve: [],

    // Latency tracking (time between presses of the same key)
    latencies: [],

    // Pause tracking: total time the user spent in long gaps
    pauseMs: 0,
    pauseCount: 0,
    lastInputAt: null,

    // Burst: best 1-second net WPM
    burstWpm: 0,

    // Open errors (a queue of { char, at, timeMs } for each mistake
    // not yet corrected by backspace). When the user backspaces
    // back over the error, the entry is popped and counted as a
    // correction.
    openErrors: [],

    // Timing
    startedAt: 0,
    endedAt: 0,

    // For the speed-curve: per-interval counters
    intervalStartedAt: 0,
    intervalCorrect: 0,
    intervalTotal: 0,
    intervalId: 0,
  });

  let s = reset();

  const ensureStarted = () => {
    if (s.startedAt) return;
    const now = performance.now();
    s.startedAt = now;
    s.intervalStartedAt = now;
  };

  const onIntervalTick = () => {
    if (!s.startedAt || s.endedAt) return;
    const now = performance.now();
    const elapsedSec = (now - s.intervalStartedAt) / 1000;
    if (elapsedSec < 0.5) return;
    const wpm = (s.intervalCorrect / 5) / Math.max(elapsedSec, MIN_ELAPSED_SECONDS);
    s.speedCurve.push({ timeMs: now - s.startedAt, wpm });
    if (wpm > s.burstWpm) s.burstWpm = wpm;
    s.intervalStartedAt = now;
    s.intervalCorrect = 0;
    s.intervalTotal = 0;
  };

  const start = () => {
    if (s.intervalId) stop();
    s = reset();
    ensureStarted();
    s.intervalId = setInterval(onIntervalTick, SPEED_INTERVAL_MS);
  };

  const stop = () => {
    if (s.intervalId) clearInterval(s.intervalId);
    s.intervalId = 0;
    s.endedAt = s.endedAt || performance.now();
    onIntervalTick(); // one last sample
  };

  /**
   * Record a normalised input event. The event is the shape emitted
   * by the InputEngine. We do NOT accept raw KeyboardEvent — that
   * would couple us to the browser.
   */
  const record = (event) => {
    if (s.endedAt) return;
    ensureStarted();
    const now = performance.now();

    // Pause detection: any gap > 2s is a real pause, not ambient
    // idle. We count the time, not the gap.
    if (s.lastInputAt) {
      const gap = now - s.lastInputAt;
      if (gap > 2000) {
        s.pauseMs += gap;
        s.pauseCount++;
      }
    }
    s.lastInputAt = now;

    // Bigram latency: time between presses of the same key.
    if (event.kind === 'character' && typeof event.key === 'string' && event.key.length === 1) {
      if (event._prevChar === event.key && now - event._prevAt < 5000) {
        s.latencies.push(now - event._prevAt);
      }
      event._prevChar = event.key;
      event._prevAt = now;
    }

    if (event.kind === 'character') {
      s.typedCharacters++;
      s.intervalTotal++;
      // expected / correct / incorrect / extra is filled in by the
      // session-level pass after the run. The live stream only knows
      // "user pressed X at this position" — what that means is
      // session-level. We track the key the user pressed for the
      // mistakesByKey heatmap.
      // The session computes correct/incorrect/etc. from the
      // original vs. typed comparison; here we only count it as a
      // typed character.
    } else if (event.kind === 'backspace') {
      s.backspaceCount++;
      // If there is an open error at the current cursor, resolve it
      // as a correction.
      if (s.openErrors.length > 0) {
        s.openErrors.pop();
        s.correctedErrors++;
      }
    }

    s.intervalCorrect += event.kind === 'character' ? 1 : 0;
  };

  /**
   * Snapshot a "mistake" at the current cursor. Called by the
   * session when it detects that a typed character is wrong. The
   * session knows the position and expected char; we record the
   * open error and the per-key tally.
   */
  const noteMistake = ({ key }) => {
    if (typeof key !== 'string' || !key) return;
    const k = key === ' ' ? 'space' : key.toLowerCase();
    s.mistakesByKey[k] = (s.mistakesByKey[k] || 0) + 1;
    s.openErrors.push({ key, timeMs: performance.now() - (s.startedAt || 0) });
  };

  /**
   * End the session and produce the final stats object.
   * `session` is the final session model (we read the typed[]
   * to compute the per-character correct/incorrect/missed/extra).
   */
  const finish = (session) => {
    stop();
    // Walk the session once to compute the character-level
    // breakdown. This is the source of truth for accuracy and the
    // missed/extra counts.
    const total = session.originalText.length;
    let correct = 0, incorrect = 0, extra = 0, missed = 0;
    for (let i = 0; i < total; i++) {
      const t = session.typed[i];
      if (t === null) {
        if (i < session.cursor) missed++;
      } else if (t === '') {
        // erased; not counted in any of the four buckets (the
        // backspace was counted separately above).
      } else if (t === session.originalText[i]) {
        correct++;
      } else {
        incorrect++;
      }
    }

    const totalErrors = s.correctedErrors + s.uncorrectedErrors;
    const elapsedMs = (s.endedAt || performance.now()) - s.startedAt;
    const elapsedMin = elapsedMs / 60000;

    // For time mode the caller can override the elapsed time with
    // the configured test duration. The session object carries
    // `targetDuration` for that case; we honour it here.
    const useEffectiveMs = session.targetDuration && session.targetDuration > 0
      ? session.targetDuration * 1000
      : elapsedMs;
    const useEffectiveMin = useEffectiveMs / 60000;

    const wpm = (correct / 5) / Math.max(useEffectiveMin, MIN_ELAPSED_SECONDS / 60);
    const rawWpm = (s.typedCharacters / 5) / Math.max(useEffectiveMin, MIN_ELAPSED_SECONDS / 60);
    const denom = correct + incorrect + extra;
    const accuracy = denom > 0 ? (correct / denom) * 100 : 100;

    const correctionRate = totalErrors > 0 ? s.correctedErrors / totalErrors : 1;
    const errorRate = denom > 0 ? (incorrect + extra) / denom : 0;

    // Stability: requires enough samples for a meaningful value.
    // Below the threshold we report null so the UI can show "n/a"
    // instead of misleading "100%".
    const stability = s.speedCurve.length >= STABILITY_MIN_SAMPLES
      ? computeStability(s.speedCurve)
      : null;

    return {
      wpm: Math.round(wpm),
      rawWpm: Math.round(rawWpm),
      accuracy: Math.round(accuracy * 100) / 100,
      correct,
      incorrect,
      extra,
      missed,
      errors: incorrect + extra,
      errorRate: Math.round(errorRate * 1000) / 1000,
      correctionRate: Math.round(correctionRate * 1000) / 1000,
      backspaceCount: s.backspaceCount,
      correctedErrors: s.correctedErrors,
      uncorrectedErrors: s.uncorrectedErrors,
      burstWpm: Math.round(s.burstWpm),
      stability,
      meanLatencyMs: Math.round(mean(s.latencies) || 0) || null,
      medianLatencyMs: Math.round(percentile(s.latencies, 50) || 0) || null,
      p90LatencyMs: Math.round(percentile(s.latencies, 90) || 0) || null,
      totalPauseMs: Math.round(s.pauseMs),
      pauseCount: s.pauseCount,
      totalTimeMs: Math.round(elapsedMs),
      effectiveTimeMs: Math.round(useEffectiveMs),
      totalStrokes: s.typedCharacters,
      mistakesByKey: { ...s.mistakesByKey },
      speedCurve: s.speedCurve.slice(),
    };
  };

  /** Live snapshot for the HUD. Cheap to compute every frame. */
  const snapshot = (session) => {
    const now = s.endedAt || performance.now();
    const elapsedMs = now - (s.startedAt || now);
    const elapsedMin = Math.max(elapsedMs, 0) / 60000;
    const correctSoFar = countCorrectSoFar(session);
    const wpm = elapsedMin > 0 ? Math.round((correctSoFar / 5) / elapsedMin) : 0;
    const denom = correctSoFar + countIncorrectSoFar(session);
    const acc = denom > 0 ? Math.round((correctSoFar / denom) * 100) : 100;
    const progress = session.originalText.length > 0
      ? Math.round((session.cursor / session.originalText.length) * 100)
      : 0;
    return { wpm, acc, progress, cursor: session.cursor };
  };

  return { start, stop, record, noteMistake, finish, snapshot };
};

function countCorrectSoFar(session) {
  let n = 0;
  const upto = session.cursor;
  for (let i = 0; i < upto; i++) {
    if (session.typed[i] === session.originalText[i]) n++;
  }
  return n;
}

function countIncorrectSoFar(session) {
  let n = 0;
  const upto = session.cursor;
  for (let i = 0; i < upto; i++) {
    const t = session.typed[i];
    if (t === null || t === '') continue;
    if (t !== session.originalText[i]) n++;
  }
  return n;
}

function computeStability(samples) {
  if (samples.length < 2) return null;
  const wpms = samples.map((s) => s.wpm);
  const mean = wpms.reduce((a, b) => a + b, 0) / wpms.length;
  if (mean === 0) return 0;
  const variance = wpms.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / wpms.length;
  const stdDev = Math.sqrt(variance);
  const cv = stdDev / mean;
  return Math.max(0, Math.min(100, Math.round(100 - cv * 100)));
}
