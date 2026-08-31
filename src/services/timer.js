/**
 * TimerEngine.
 *
 * A small, authoritative timer with one job: track a deadline
 * derived from performance.now() and notify callers when it is
 * reached. The deadline is wall-clock, not tick-based, so a
 * backgrounded tab cannot stretch the test.
 *
 * States
 * ------
 *   IDLE      : no deadline, no callbacks
 *   RUNNING   : deadline set, rAF loop ticking
 *   PAUSED    : deadline frozen, no rAF
 *   EXPIRED   : deadline reached, callback fired, no rAF
 *   STOPPED   : tear-down; no further callbacks
 *
 * Callers can also poll getRemaining() at any time.
 *
 * Modes
 * -----
 *   mode: 'countdown' (default)  - counts down, expires at 0
 *   mode: 'elapsed'              - counts up, never expires; useful for
 *                                  tests that run until the passage is
 *                                  done and want a wall-clock reading.
 *
 * A mode that uses elapsed time is still served by the same engine;
 * it just never reports an expiry. The practice page uses countdown
 * exclusively for time mode.
 */

export const TIMER_STATE = Object.freeze({
  IDLE: 'idle',
  RUNNING: 'running',
  PAUSED: 'paused',
  EXPIRED: 'expired',
  STOPPED: 'stopped',
});

export const createTimer = () => {
  let state = TIMER_STATE.IDLE;
  let mode = 'countdown';
  let durationMs = 0;
  let startedAt = 0;
  let remainingAtPause = 0;
  let tickHandle = 0;
  const onTick = new Set();
  const onExpire = new Set();
  let lastTickValue = -1;

  const tick = () => {
    if (state !== TIMER_STATE.RUNNING) return;
    const remaining = getRemaining();
    const whole = Math.max(0, Math.ceil(remaining / 1000));
    if (whole !== lastTickValue) {
      lastTickValue = whole;
      for (const fn of onTick) {
        try { fn(remaining); } catch (e) { /* never let a callback break the timer */ }
      }
    }
    if (mode === 'countdown' && remaining <= 0) {
      state = TIMER_STATE.EXPIRED;
      if (tickHandle) { clearInterval(tickHandle); tickHandle = 0; }
      for (const fn of onExpire) {
        try { fn(); } catch (e) {}
      }
      return;
    }
  };

  function getRemaining() {
    if (state === TIMER_STATE.IDLE || state === TIMER_STATE.STOPPED) return durationMs;
    if (state === TIMER_STATE.PAUSED) return remainingAtPause;
    if (state === TIMER_STATE.EXPIRED) return 0;
    return Math.max(0, durationMs - (performance.now() - startedAt));
  }

  return {
    /** Start a new countdown. Resets any previous run. */
    start(duration, opts = {}) {
      durationMs = Math.max(0, duration);
      mode = opts.mode || 'countdown';
      state = TIMER_STATE.RUNNING;
      startedAt = performance.now();
      lastTickValue = -1;
      if (tickHandle) clearInterval(tickHandle);
      tickHandle = setInterval(tick, 100);
      return getRemaining();
    },

    pause() {
      if (state !== TIMER_STATE.RUNNING) return;
      remainingAtPause = getRemaining();
      state = TIMER_STATE.PAUSED;
      if (tickHandle) { clearInterval(tickHandle); tickHandle = 0; }
    },

    resume() {
      if (state !== TIMER_STATE.PAUSED) return;
      // Adjust the start time so the remaining time at pause
      // continues to count down. durationMs - remainingAtPause is
      // the new "already-elapsed" delta.
      startedAt = performance.now() - (durationMs - remainingAtPause);
      state = TIMER_STATE.RUNNING;
      tickHandle = setInterval(tick, 100);
    },

    stop() {
      if (tickHandle) { clearInterval(tickHandle); }
      tickHandle = 0;
      // Idling: pause without losing subscriptions. Re-start will resume
      // the same onTick/onExpire callbacks. Use destroy() when you want
      // to permanently tear down the timer (it also clears subscriptions).
      state = TIMER_STATE.IDLE;
    },

    /** Force-expire immediately. Used by mode completion paths that
     *  don't need to wait for the next tick. */
    expire() {
      if (tickHandle) { clearInterval(tickHandle); }
      tickHandle = 0;
      state = TIMER_STATE.EXPIRED;
      for (const fn of onExpire) {
        try { fn(); } catch (e) {}
      }
    },

    isRunning() { return state === TIMER_STATE.RUNNING; },
    isExpired() { return state === TIMER_STATE.EXPIRED; },
    getRemaining,
    getState() { return state; },
    getDuration() { return durationMs; },

    onTick(fn) { onTick.add(fn); return () => onTick.delete(fn); },
    onExpire(fn) { onExpire.add(fn); return () => onExpire.delete(fn); },
  };
};
