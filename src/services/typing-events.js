/**
 * Typing Event model.
 *
 * The achievement evaluator, the dashboard analytics, and the
 * "weak-key" trainer all want the same kind of input: an immutable
 * record of one completed typing session, with everything they need
 * to make their decisions in one shape. A previous version of the
 * achievements service reconstructed this by walking the history
 * array on every page load, which was wasteful and made adding new
 * achievement kinds (especially ones that depend on multiple fields
 * that may not exist on older sessions) brittle.
 *
 * This module is the canonical event shape. The achievement rules
 * read from this; the rest of the app only has to emit it.
 *
 *   SESSION_COMPLETED
 *     a full typing session has finished
 *     payload: { mode, difficulty, duration, wordCount, wpm, rawWpm,
 *                accuracy, errors, longestStreak, totalStrokes,
 *                mistakesByKey, language, timestamp }
 *
 *   MILESTONE_REACHED
 *     user crossed a wpm threshold in a single run
 *     payload: { kind: 'wpm', value: 60, mode }
 *
 *   STREAK_DAY_COMPLETED
 *     a calendar day with at least one completed session
 *     payload: { day, count }
 *
 *   KEY_PRACTICED
 *     a single key was attempted enough times to count
 *     payload: { key, count }
 */

export const TYPING_EVENT = Object.freeze({
  SESSION_COMPLETED: 'session-completed',
  MILESTONE_REACHED: 'milestone-reached',
  STREAK_DAY_COMPLETED: 'streak-day-completed',
  KEY_PRACTICED: 'key-practiced',
});

/**
 * Create a SESSION_COMPLETED event from the result of a run and the
 * caller-known mode metadata.
 */
export const sessionCompletedEvent = (session, meta) => ({
  type: TYPING_EVENT.SESSION_COMPLETED,
  timestamp: session.timestamp || Date.now(),
  mode: session.mode,
  difficulty: session.difficulty,
  duration: session.targetDuration || session.duration,
  wordCount: session.targetWordCount,
  wpm: session.wpm,
  rawWpm: session.rawWpm,
  accuracy: session.accuracy,
  errors: session.errors,
  correctedErrors: session.correctedErrors,
  uncorrectedErrors: session.uncorrectedErrors,
  backspaceCount: session.backspaceCount,
  longestStreak: session.longestStreak,
  totalStrokes: session.totalStrokes,
  mistakesByKey: session.mistakesByKey || {},
  language: session.language || null,
  ...meta,
});

/**
 * Create a MILESTONE_REACHED event.
 */
export const milestoneReachedEvent = (wpm, mode) => ({
  type: TYPING_EVENT.MILESTONE_REACHED,
  timestamp: Date.now(),
  kind: 'wpm',
  value: wpm,
  mode,
});

/**
 * Generic event-listener registry with delivery to one consumer. The
 * achievement system subscribes once and receives every event the
 * rest of the app publishes.
 */
export const createEventBus = () => {
  const subscribers = new Set();
  return {
    publish(event) {
      for (const sub of subscribers) {
        try { sub(event); } catch (e) { /* never let a subscriber break another */ }
      }
    },
    subscribe(fn) {
      subscribers.add(fn);
      return () => subscribers.delete(fn);
    },
  };
};

// Shared bus instance. Every module that imports TYPING_EVENT gets
// the same bus, so the practice page, achievements, and the adaptive
// trainer are all reading from the same event stream.
import { createEventBus as _createBus } from './typing-events.js';
const _bus = _createBus();
export const publish = (event) => _bus.publish(event);
export const subscribe = (fn) => _bus.subscribe(fn);
