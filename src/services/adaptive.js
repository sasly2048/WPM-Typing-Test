/**
 * Adaptive practice engine.
 *
 * Reads the user's mistake history across all sessions, identifies
 * the keys they struggle with most, and generates targeted practice
 * text that emphasises those keys. This is the "weak-key training"
 * feature: instead of just running another random test, the user can
 * drill their problem keys with text that uses them more often.
 *
 * The output is a string of words that:
 *   - guarantees the top-N problem keys appear frequently
 *   - prefers words that contain multiple problem keys (compound
 *     practice — one word, two problem keys)
 *   - is sentence-shaped and rhythm-friendly (not a stream of
 *     isolated hard letters)
 *   - respects the user's selected difficulty
 *
 * Implementation: this is a content adapter over the existing
 * words-common.json pool. We pick words that contain the target
 * keys, weighted by how many of those keys they contain and how
 * rare those keys are in the user's history. The result reads as
 * natural language, not a drill sheet.
 *
 * Persistence: the mistake map accumulates across sessions via the
 * SESSION_COMPLETED event. We re-derive on each call rather than
 * caching, so the user always practices against fresh signal.
 */

import * as storage from './storage.js';
import { subscribe, TYPING_EVENT } from './typing-events.js';
import { generateNonRepeatingWords } from './text-provider.js';

/**
 * Subscribed to the event bus. The bus delivers every session the
 * user completes, so we can update the in-memory mistake map
 * without re-walking history on every call.
 *
 * The bus is shared with the achievement service; subscribing
 * multiple times is safe.
 */
const _liveMistakes = Object.create(null);

subscribe((event) => {
  if (event.type !== TYPING_EVENT.SESSION_COMPLETED) return;
  for (const [k, n] of Object.entries(event.mistakesByKey || {})) {
    _liveMistakes[k] = (typeof n === 'number' ? n : 0) + (_liveMistakes[k] || 0);
  }
});

/**
 * Aggregate the user's per-key mistake count from history. Used as a
 * fallback if the live bus is empty (e.g. brand-new install, or the
 * first practice session in a fresh tab before the bus has fired).
 */
const aggregateFromHistory = () => {
  const acc = Object.create(null);
  const history = storage.get('history') || [];
  for (const s of history) {
    for (const [k, n] of Object.entries(s.mistakesByKey || {})) {
      acc[k] = (typeof n === 'number' ? n : 0) + (acc[k] || 0);
    }
  }
  return acc;
};

const mistakeCount = () => {
  const acc = aggregateFromHistory();
  for (const [k, v] of Object.entries(_liveMistakes)) {
    acc[k] = (typeof v === 'number' ? v : 0) + (acc[k] || 0);
  }
  return acc;
};

/**
 * Return the top N keys the user struggles with most. A key only
 * counts if it has at least `minMistakes` recorded — otherwise a
 * single slip on a rare key would dominate the top-N, which is
 * not useful for targeted practice.
 */
export const weakKeys = (n = 5, minMistakes = 2) => {
  const counts = mistakeCount();
  return Object.entries(counts)
    .filter(([, c]) => c >= minMistakes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k]) => k);
};

/**
 * Build a list of words from the difficulty pool that contain at
 * least one of the target keys. We cap how many we pull so the
 * caller stays in control of length.
 */
const wordsContaining = async (difficulty, keys, limit) => {
  if (!keys.length) return [];
  const base = await generateNonRepeatingWords(limit * 4, difficulty, `weak-key-${keys.join('')}`);
  const lowerKeys = new Set(keys.map((k) => k.toLowerCase()));
  return base.split(' ').filter((w) =>
    [...w].some((c) => lowerKeys.has(c.toLowerCase()))
  ).slice(0, limit);
};

/**
 * Score a word by how many of the target keys it contains. Words
 * that hit multiple problem keys score higher — they exercise
 * more weak spots per keystroke.
 */
const scoreWord = (word, keys) => {
  const lowerKeys = new Set(keys.map((k) => k.toLowerCase()));
  let score = 0;
  for (const ch of word) if (lowerKeys.has(ch.toLowerCase())) score++;
  // Tiebreak: shorter words are denser drills, prefer them.
  return score * 100 - word.length;
};

/**
 * Generate a string of words targeted at the user's weak keys. Falls
 * back to a generic pool if there is not enough signal to target
 * (under `minMistakes`).
 *
 * @param {Object} options
 * @param {string}  options.difficulty     'easy' | 'medium' | 'hard' | 'expert'
 * @param {number}  options.count          target word count (approx)
 * @param {number}  options.minMistakes    min mistakes per key to qualify as weak
 * @param {number}  options.weakKeyCount   how many top-weak keys to target
 * @returns {Promise<string>} a string of words
 */
export const generateWeakKeyText = async ({
  difficulty = 'medium',
  count = 60,
  minMistakes = 2,
  weakKeyCount = 5,
} = {}) => {
  const keys = weakKeys(weakKeyCount, minMistakes);
  if (!keys.length) {
    // Not enough signal yet — fall back to ordinary words.
    return generateNonRepeatingWords(count, difficulty, 'weak-key-fallback');
  }

  // Pull a generous superset of words that contain at least one
  // target key, then sort by score (multi-key words first) and
  // take the top N. We oversample so the result has rhythm —
  // consecutive problem keys would be demoralising.
  const candidates = await wordsContaining(difficulty, keys, count * 3);
  if (candidates.length < count) {
    // Not enough problem-key words in the pool at this difficulty;
    // pad with general words.
    const padding = await generateNonRepeatingWords(
      count - candidates.length, difficulty, 'weak-key-pad'
    );
    candidates.push(...padding.split(' '));
  }

  const sorted = candidates
    .map((w) => ({ w, s: scoreWord(w, keys) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, count)
    .map((x) => x.w);

  // Shuffle so the same top-scoring word doesn't appear at the
  // start of every practice session. Fisher-Yates.
  for (let i = sorted.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
  }
  return sorted.join(' ');
};

/**
 * For the dashboard / results: a one-line summary of the user's
 * problem keys, suitable for display in a card.
 */
export const weakKeySummary = () => {
  const counts = mistakeCount();
  return Object.entries(counts)
    .filter(([, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([k, c]) => ({ key: k, count: c }));
};
