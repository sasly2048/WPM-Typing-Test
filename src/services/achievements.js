/**
 * Achievements.
 *
 * Evaluator-driven: every definition says what the world has to look
 * like for it to be unlocked, and the evaluator compares that
 * description against a stream of typing events plus the full history.
 * The service does not re-derive events from the timeline on every
 * page load; instead, the practice page publishes events through a
 * shared bus and the achievement rules are simple predicates over the
 * accumulated state.
 *
 * The event bus makes the dependency explicit and gives us a single
 * place to add new event types.
 */

import * as storage from './storage.js';
import { TYPING_EVENT, sessionCompletedEvent, publish, subscribe } from './typing-events.js';

/**
 * Lazy-load the achievement catalogue. The same module has to run in
 * the browser (Vite handles JSON imports) and in Node tests (which
 * need fs). We branch on the runtime so the browser never sees the
 * node: imports — Vite would externalise them otherwise.
 */
const loadDefinitions = async () => {
  if (typeof process !== 'undefined' && process.versions?.node) {
    // Node path: read the JSON file with fs.
    const { readFileSync } = await import('node:fs');
    const { fileURLToPath } = await import('node:url');
    const { dirname, resolve } = await import('node:path');
    const here = dirname(fileURLToPath(import.meta.url));
    const defs = JSON.parse(readFileSync(resolve(here, '..', 'data', 'achievements.json'), 'utf8'));
    return Array.isArray(defs) ? defs : [];
  }
  // Browser path: Vite handles the JSON import for us.
  const mod = await import('../data/achievements.json');
  return Array.isArray(mod.default) ? mod.default : (Array.isArray(mod) ? mod : []);
};

let _definitions = null;
const getDefinitions = async () => {
  if (_definitions) return _definitions;
  _definitions = await loadDefinitions();
  return _definitions;
};

const UNLOCKED_KEY = 'unlocked_achievements';

export const getUnlocked = () => storage.get(UNLOCKED_KEY) || [];

/**
 * Each rule is a function over the full event log + history. The
 * evaluator runs all rules and unlocks the ones whose predicate
 * returns true. Rules are pure — they do not read from the DOM.
 *
 * The rule definitions live next to the achievement metadata in
 * `achievements.json`. A rule with no `evaluate` function is treated
 * as the legacy "observed value >= target" comparison and is handled
 * here for backward compatibility.
 */
const observedValue = (type, history, stats) => {
  const best = (pick) => history.reduce((m, s) => Math.max(m, pick(s) || 0), 0);
  const distinct = (pick) => new Set(history.map(pick).filter(Boolean)).size;

  switch (type) {
    case 'tests_completed':
      return history.length;
    case 'code_tests_completed':
      return history.filter((s) => s.mode === 'code').length;
    case 'wpm_reached':
      return best((s) => s.wpm);
    case 'accuracy_reached':
      return best((s) => s.accuracy);
    case 'consistency_reached':
      return best((s) => s.consistency);
    case 'streak_days':
      return Math.max(stats.currentStreak || 0, stats.bestStreak || 0);
    case 'long_session':
      return best((s) => s.targetDuration || s.duration || 0);
    case 'distinct_languages':
      return distinct((s) => s.language);
    case 'all_modes_used':
      return distinct((s) => s.mode) >= 5 ? 1 : 0;
    case 'perfect_run':
      return history.some((s) => (s.accuracy || 0) >= 100 && (s.wpm || 0) >= 100 && (s.duration || 0) >= 60) ? 1 : 0;
    case 'quote_completed':
      return history.filter((s) => s.mode === 'quote').length;
    case 'zen_minutes':
      return best((s) => s.zenMinutes || 0);
    case 'adaptive_completed':
      return history.filter((s) => s.mode === 'adaptive').length;
    case 'multilingual_completed':
      // Count distinct non-English languages used.
      return distinct((s) => (s.language && s.language !== 'en') ? s.language : null);
    case 'burst_reached':
      return best((s) => s.burstWpm);
    default:
      return 0;
  }
};

const evaluateRule = (ach, history, stats) => {
  // New shape: a function on the event log. We don't have the live
  // event log in the call sites that hit the storage layer; for the
  // legacy observed-value path we fall back to the numeric comparison.
  if (typeof ach.condition?.evaluate === 'function') {
    return !!ach.condition.evaluate({ history, stats });
  }
  const value = observedValue(ach.condition?.type, history, stats);
  return value >= (ach.condition?.value ?? Infinity);
};

async function reconcile(history, stats) {
  const previous = getUnlocked();
  const unlocked = new Set(previous);
  const newlyUnlocked = [];
  const defs = await getDefinitions();

  for (const ach of defs) {
    if (unlocked.has(ach.id)) continue;
    if (evaluateRule(ach, history, stats)) {
      unlocked.add(ach.id);
      newlyUnlocked.push(ach);
    }
  }

  if (newlyUnlocked.length) storage.set(UNLOCKED_KEY, [...unlocked]);
  return { unlocked: [...unlocked], newlyUnlocked };
}

/**
 * Called after a completed session. Returns only achievements that
 * became unlocked as a result, so the results page can celebrate them.
 */
export const checkAchievements = async (session, stats) => {
  const history = storage.get('history') || [];
  const withCurrent = history.some((s) => s.timestamp === session.timestamp)
    ? history
    : [...history, session];

  return (await reconcile(withCurrent, stats)).newlyUnlocked;
};

export const getProgress = async (stats) => {
  const history = storage.get('history') || [];
  const { unlocked } = await reconcile(history, stats);
  const defs = await getDefinitions();

  return defs.map((ach) => {
    const target = ach.condition?.value ?? 0;
    const current = observedValue(ach.condition?.type, history, stats);
    return {
      ...ach,
      isUnlocked: unlocked.includes(ach.id),
      currentValue: current,
      progress: target ? Math.min(100, (current / target) * 100) : 0,
    };
  });
};

// ---------------------------------------------------------------------------
// Event publication
// ---------------------------------------------------------------------------

/**
 * Publish a session-completed event. Called by the practice page after
 * saving a session. The event bus is the single channel that any other
 * subsystem (achievements, adaptive practice, analytics) can subscribe
 * to without the practice page needing to know about them.
 *
 * Persistence: this helper also writes the session to history so the
 * achievement evaluator (which reads from history) sees it. The bus
 * is for live subscribers; history is the durable record. The two
 * are kept in sync here so callers don't have to do it themselves.
 */
export const publishSessionCompleted = (session, meta) => {
  const event = sessionCompletedEvent(session, meta);

  // Persist to history. Cap at MAX_SESSIONS to keep storage bounded.
  const MAX_SESSIONS = 500;
  const history = storage.get('history') || [];
  const stamped = {
    ...session,
    timestamp: session.timestamp ?? event.timestamp,
  };
  const withCurrent = history.some((s) => s.timestamp === stamped.timestamp)
    ? history
    : [...history, stamped];
  if (withCurrent.length > MAX_SESSIONS) withCurrent.shift();
  storage.set('history', withCurrent);

  publish(event);
  return event;
};

export const publishMilestone = (wpm, mode) => {
  publish({
    type: TYPING_EVENT.MILESTONE_REACHED,
    timestamp: Date.now(),
    kind: 'wpm',
    value: wpm,
    mode,
  });
};

export { subscribe };

// The bus has no subscribers at import time. Modules that want to
// react to events (achievement rules, the adaptive-practice trainer,
// future analytics subscribers) call subscribe() during their own
// module initialisation. This is the explicit, typed extension point.
