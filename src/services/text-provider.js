import { MODES } from '../constants/config.js';
import { getNonRepeatingItem } from './pool-shuffler.js';
import { LANGUAGE_SNIPPETS } from '../content/developer/languages.js';

let wordsCache = null;
let paragraphsCache = null;

const loadWords = async () => {
  if (wordsCache) return wordsCache;
  try {
    const mod = await import('../data/words-common.json');
    wordsCache = mod.default;
    return wordsCache;
  } catch (e) {
    return null;
  }
};

const loadParagraphs = async () => {
  if (paragraphsCache) return paragraphsCache;
  try {
    const mod = await import('../data/paragraphs.json');
    paragraphsCache = mod.default;
    return paragraphsCache;
  } catch (e) {
    return null;
  }
};

/**
 * Maps session duration to appropriate word counts.
 *
 * The budget covers what a fast typist (~80 WPM at the high end) would
 * reasonably type in the full duration, with some slack for a slow
 * typist not to run out before the clock. 15s tests get 25 words
 * (≈ 50 chars / 5 lines), 30s get 50, 60s get 100, 120s get 200, and
 * the long sessions grow proportionally.
 */
export const DURATION_WORD_COUNTS = {
  15: 25,
  30: 50,
  60: 100,
  120: 200,
  300: 450,
  600: 900,
};

/**
 * Word budgets for prose mode at each duration pick. Same shape as the
 * time-mode budgets but applied to whatever paragraph(s) the user has
 * chosen — the engine concatenates non-repeating passages until the
 * budget is met. Without this, prose mode ignores the duration control
 * and always served a single full passage, regardless of whether the
 * user picked 15s or 120s.
 */
export const PROSE_WORD_COUNTS = {
  15: 30,
  30: 60,
  60: 120,
  120: 240,
};

/**
 * Retrieves non-repeating text tuned for mode, difficulty, language, and duration.
 */
export const getText = async (mode, difficulty = 'medium', options = {}) => {
  switch (mode) {
    case MODES.PARAGRAPH: {
      // Prose mode also respects the duration pick. Without this, a 15s
      // "prose" test gave you the same 50+ word passage as a 120s one,
      // and the passage often ran past the visible typing area.
      const duration = options.duration || 30;
      const budget = PROSE_WORD_COUNTS[duration] || Math.ceil(duration * 2);
      return getParagraphText(difficulty, `prose-${duration}`, budget);
    }

    case MODES.TIME: {
      const duration = options.duration || 30;
      // Estimate a generous word budget for the duration (~5 chars/word,
      // assume ~80 WPM ceiling) so the concatenated paragraphs comfortably
      // outlast even a fast typist for the full session.
      const targetWordCount = DURATION_WORD_COUNTS[duration] || Math.ceil(duration * 2);
      return getParagraphText(difficulty, `time-${duration}`, targetWordCount);
    }

    case MODES.WORDS: {
      const count = options.wordCount || 50;
      const words = await generateNonRepeatingWords(count, difficulty, `words-${count}`);
      return applyWordModifiers(words, {
        punctuation: !!options.punctuation,
        numbers: !!options.numbers,
      });
    }

    case MODES.CODE: {
      const lang = options.language || localStorage.getItem('keyflow_dev_lang') || 'javascript';
      const snippets = LANGUAGE_SNIPPETS[lang] || LANGUAGE_SNIPPETS.javascript;
      const snippet = getNonRepeatingItem(`code-${lang}`, snippets, s => s.id);
      if (!snippet) return { code: '', name: '' };
      return { code: snippet.code, name: snippet.name || '' };
    }

    case MODES.CUSTOM:
      return options.customText || 'Custom practice text goes here.';

    default:
      return generateNonRepeatingWords(50, difficulty, 'default');
  }
};

/**
 * Retrieves grammatically-correct paragraph text. When minWordCount is
 * given, concatenates additional non-repeating paragraphs (space-separated)
 * until the combined text meets that word budget — used by Time mode so a
 * fast typist never runs out of real prose mid-session.
 *
 * Trimming behaviour: when the current passage would push us past the
 * budget by a wide margin AND we already have one passage in the buffer,
 * we either take a complete leading sentence from the new passage or
 * stop after the first whole passage. The result is a small, complete
 * sequence of sentences rather than a fragment that ends mid-clause.
 */
const getParagraphText = async (difficulty, poolKeySuffix, minWordCount = 0) => {
  const paragraphs = await loadParagraphs();
  const fallback = 'The quick brown fox jumps over the lazy dog.';
  if (!paragraphs || !Array.isArray(paragraphs) || paragraphs.length === 0) {
    return generateNonRepeatingWords(Math.max(minWordCount, 50), difficulty, `${poolKeySuffix}-fallback`);
  }

  // paragraphs.json has no 'expert' tier; fall back to 'hard' for it.
  const targetDifficulty = difficulty === 'expert' ? 'hard' : difficulty;
  const filtered = paragraphs.filter((p) => p.difficulty === targetDifficulty);
  const pool = filtered.length > 0 ? filtered : paragraphs;

  const parts = [];
  let wordCount = 0;

  const MAX_PARAGRAPHS = 40;

  for (let i = 0; i < MAX_PARAGRAPHS; i++) {
    const item = getNonRepeatingItem(`${poolKeySuffix}-${targetDifficulty}`, pool, (p) => p.id);
    const text = item?.text;
    if (typeof text !== 'string' || !text.trim()) break;

    // First passage: take it whole regardless of how much it overshoots.
    // Short sessions explicitly opt into seeing one full passage rather
    // than a fragment, which is the whole point of prose mode.
    if (parts.length === 0) {
      parts.push(text);
      wordCount += text.trim().split(/\s+/).length;
      if (minWordCount <= 0) break;
      if (wordCount >= minWordCount) break;
      continue;
    }

    // We already have one full passage. Decide how to use this one:
    //   - if the first passage alone covers the budget with slack, take
    //     one more COMPLETE sentence from the start of this passage,
    //     then stop. We want a clean two-sentence join, not a fragment.
    //   - otherwise, take this passage whole (we need the words).
    const need = Math.max(0, minWordCount - wordCount);
    if (wordCount + 6 >= minWordCount) {
      // Only a handful of words short — pull the first complete sentence.
      const sentenceMatch = text.match(/^[^.]*\.\s*/);
      if (sentenceMatch) {
        const sentence = sentenceMatch[0].trim();
        parts.push(sentence);
        wordCount += sentence.split(/\s+/).length;
      }
      break;
    }

    // Add this passage whole and keep looking for more if needed.
    parts.push(text);
    wordCount += text.trim().split(/\s+/).length;
    if (wordCount >= minWordCount) break;
  }

  if (!parts.length) {
    return generateNonRepeatingWords(Math.max(minWordCount, 50), difficulty, `${poolKeySuffix}-empty`);
  }

  return parts.join(' ');
};

/**
 * Generates a non-repeating sequence of words from the dictionary.
 */
export const generateNonRepeatingWords = async (count, difficulty, poolKeySuffix = 'default') => {
  const wordsData = await loadWords();
  const fallback = 'the quick brown fox jumps over the lazy dog '.repeat(15).trim().split(' ');
  const pool = (wordsData && wordsData[difficulty]) ? wordsData[difficulty] : fallback;

  const result = [];
  for (let i = 0; i < count; i++) {
    const word = getNonRepeatingItem(`words-${difficulty}-${poolKeySuffix}`, pool);
    result.push(word || 'flow');
  }
  return result.join(' ');
};

const PUNCTUATION_END = ['.', ',', '!', '?'];

/**
 * Applies Monkeytype-style punctuation/numbers modifiers to a raw word-pool
 * string: sentence capitalization + trailing punctuation on ~1 in 6 words
 * when punctuation is on, and standalone numbers spliced in on ~1 in 10
 * words when numbers is on.
 */
const applyWordModifiers = (text, { punctuation = false, numbers = false } = {}) => {
  if (!punctuation && !numbers) return text;

  const words = text.split(' ');
  let capitalizeNext = punctuation;

  const withMods = words.map((word) => {
    let w = word;

    if (capitalizeNext) {
      w = w.charAt(0).toUpperCase() + w.slice(1);
      capitalizeNext = false;
    }

    if (numbers && Math.random() < 0.1) {
      w = String(Math.floor(Math.random() * 999) + 1);
    }

    if (punctuation && Math.random() < 0.16) {
      const mark = PUNCTUATION_END[Math.floor(Math.random() * PUNCTUATION_END.length)];
      w += mark;
      if (mark === '.' || mark === '!' || mark === '?') capitalizeNext = true;
    }

    return w;
  });

  return withMods.join(' ');
};
