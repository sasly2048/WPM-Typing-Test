// src/utils/diagnostics.js
let instance = null;

/** Initialize or retrieve the singleton diagnostics instance. */
export function initDiagnostics() {
  if (!instance) instance = createDiagnostics();
  return instance;
}

function createDiagnostics() {
  // Internal mutable state
  const state = {
    correctChars: 0,
    totalChars: 0,
    startTime: null,
    keystrokeLog: [], // {typed, expected, correct, timestamp, elapsed}
    wpmSamples: [], // {time, wpm}
    lastSession: null,
  };

  // Subscription management
  const subscribers = new Set();
  let dirty = false;

  function scheduleNotify() {
    if (dirty) return; // already scheduled
    dirty = true;
    requestAnimationFrame(() => {
      dirty = false;
      const snapshot = getSnapshot();
      subscribers.forEach((cb) => {
        try {
          cb(snapshot);
        } catch (e) {
          console.warn('Diagnostics subscriber error', e);
        }
      });
    });
  }

  /** Record a single keystroke.
   *  data: {typed, expected, correct, timestamp, elapsed}
   */
  function recordChar(data) {
    if (!state.startTime) state.startTime = Date.now();
    state.totalChars++;
    if (data.correct) state.correctChars++;
    state.keystrokeLog.push({
      typed: data.typed,
      expected: data.expected,
      correct: data.correct,
      timestamp: data.timestamp,
      elapsed: data.elapsed,
    });
    scheduleNotify();
  }

  /** Record a WPM sample for the current session. */
  function recordWpmSample(sample) {
    state.wpmSamples.push(sample);
    scheduleNotify();
  }

  /** Called when a typing session ends.
   *  sessionData may contain additional metadata (mode, difficulty, etc.).
   */
  function recordSessionEnd(sessionData = {}) {
    const live = getSnapshot().live;
    state.lastSession = { ...sessionData, ...live };
    // Reset live counters for the next session
    state.correctChars = 0;
    state.totalChars = 0;
    state.startTime = null;
    state.keystrokeLog = [];
    state.wpmSamples = [];
    scheduleNotify();
  }

  /** Produce a snapshot of the current live telemetry and the last completed session. */
  function getSnapshot() {
    const elapsed = state.startTime ? (Date.now() - state.startTime) / 1000 : 0;
    const wpm = elapsed > 0 ? Math.round((state.correctChars / 5) / (elapsed / 60)) : 0;
    const rawWpm = elapsed > 0 ? Math.round((state.totalChars / 5) / (elapsed / 60)) : 0;
    const accuracy = state.totalChars > 0 ? Math.round((state.correctChars / state.totalChars) * 100) : 100;

    // Derived metrics
    const delays = state.keystrokeLog.map((k) => k.elapsed);
    const avgReactionTime = delays.length ? Math.round(delays.reduce((a, b) => a + b, 0) / delays.length) : 0;
    const pauseThreshold = 1000; // ms
    const pauseCount = delays.filter((d) => d > pauseThreshold).length;

    // Longest correct streak
    let longestStreak = 0,
      cur = 0;
    for (const k of state.keystrokeLog) {
      if (k.correct) cur++;
      else {
        if (cur > longestStreak) longestStreak = cur;
        cur = 0;
      }
    }
    if (cur > longestStreak) longestStreak = cur;

    const incorrectChars = state.totalChars - state.correctChars;
    const correctedChars = 0; // placeholder for future implementation
    const backspaces = 0; // placeholder for future implementation

    return {
      live: {
        wpm,
        rawWpm,
        accuracy,
        elapsed,
        totalChars: state.totalChars,
        correctChars: state.correctChars,
        incorrectChars,
        correctedChars,
        backspaces,
        longestStreak,
        avgReactionTime,
        pauseCount,
        keystrokeLog: state.keystrokeLog.slice(),
        wpmSamples: state.wpmSamples.slice(),
      },
      lastSession: state.lastSession,
    };
  }

  /** Subscribe to snapshot updates. Returns an unsubscribe function. */
  function subscribe(cb) {
    if (typeof cb === 'function') {
      subscribers.add(cb);
      // Immediate initial call
      cb(getSnapshot());
    }
    return () => subscribers.delete(cb);
  }

  return {
    recordChar,
    recordWpmSample,
    recordSessionEnd,
    getSnapshot,
    subscribe,
  };
}
