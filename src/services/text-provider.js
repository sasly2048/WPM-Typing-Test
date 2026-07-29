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
 */
export const DURATION_WORD_COUNTS = {
  15: 25,
  30: 50,
  60: 100,
  120: 200,
  300: 450
};

/**
 * Retrieves non-repeating text tuned for mode, difficulty, language, and duration.
 */
export const getText = async (mode, difficulty = 'medium', options = {}) => {
  switch (mode) {
    case MODES.PARAGRAPH: {
      return getParagraphText(difficulty, 'paragraph');
    }

    case MODES.TIME: {
      const duration = options.duration || 30;
      // Estimate a generous word budget for the duration (~5 chars/word,
      // assume ~60 WPM ceiling) so the concatenated paragraphs comfortably
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
      return snippet.code;
    }

    case MODES.CUSTOM:
      return options.customText || 'Custom practice text goes here.';

    default:
      return generateNonRepeatingWords(50, difficulty, 'default');
  }
};

/**
 * Retrieves grammatically-correct paragraph text. When minWordCount is given,
 * concatenates additional non-repeating paragraphs (space-separated) until
 * the combined text meets that word budget — used by Time mode so a fast
 * typist never runs out of real prose mid-session.
 */
const getParagraphText = async (difficulty, poolKeySuffix, minWordCount = 0) => {
  const paragraphs = await loadParagraphs();
  if (!paragraphs || !Array.isArray(paragraphs) || paragraphs.length === 0) {
    return generateNonRepeatingWords(Math.max(minWordCount, 50), difficulty, `${poolKeySuffix}-fallback`);
  }

  // paragraphs.json has no 'expert' tier; fall back to 'hard' for it.
  const targetDifficulty = difficulty === 'expert' ? 'hard' : difficulty;
  const filtered = paragraphs.filter((p) => p.difficulty === targetDifficulty);
  const pool = filtered.length > 0 ? filtered : paragraphs;

  const parts = [];
  let wordCount = 0;
  do {
    const item = getNonRepeatingItem(`${poolKeySuffix}-${targetDifficulty}`, pool, (p) => p.id);
    parts.push(item.text);
    wordCount += item.text.split(/\s+/).length;
  } while (wordCount < minWordCount);

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
 * words when numbers is on. Deterministic per-call (uses Math.random, so
 * content varies naturally between attempts — matching how real typing
 * tests behave rather than being reproducibly seeded).
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
