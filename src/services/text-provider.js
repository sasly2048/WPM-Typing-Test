import { MODES } from '../constants/config.js';
import { getNonRepeatingItem } from './pool-shuffler.js';
import { LANGUAGE_SNIPPETS } from '../content/developer/languages.js';

let wordsCache = null;
let paragraphsCache = null;
let multilingualCache = null;
let quotesCache = null;

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

const loadMultilingual = async () => {
  if (multilingualCache) return multilingualCache;
  try {
    const mod = await import('../data/multilingual-paragraphs.json', { with: { type: 'json' } });
    multilingualCache = mod.default ?? mod;
    return multilingualCache;
  } catch (e) {
    return null;
  }
};

const loadQuotes = async () => {
  if (quotesCache) return quotesCache;
  try {
    const mod = await import('../content/quotes/quotes.json', { with: { type: 'json' } });
    quotesCache = mod.default ?? mod;
    return Array.isArray(quotesCache) ? quotesCache : [];
  } catch (e) {
    return [];
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
  180: 300,
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
  180: 360,
  300: 600,
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
      return getParagraphText(difficulty, `prose-${duration}`, budget, options.language || 'en');
    }

    case MODES.TIME: {
      const duration = options.duration || 30;
      // Estimate a generous word budget for the duration (~5 chars/word,
      // assume ~80 WPM ceiling) so the concatenated paragraphs comfortably
      // outlast even a fast typist for the full session.
      const targetWordCount = DURATION_WORD_COUNTS[duration] || Math.ceil(duration * 2);
      return getParagraphText(difficulty, `time-${duration}`, targetWordCount, options.language || 'en');
    }

    case MODES.WORDS: {
      const count = options.wordCount || 50;
      const words = await generateNonRepeatingWords(count, difficulty, `words-${count}`);
      return applyWordModifiers(words, {
        punctuation: !!options.punctuation,
        numbers: !!options.numbers,
      });
    }

    case MODES.QUOTE: {
      // Pick a quote whose length matches the duration. Short quotes
      // for short durations, long for long.
      const quotes = await loadQuotes();
      if (!quotes.length) {
        return 'The future depends on what you do today. — Mahatma Gandhi';
      }
      const duration = options.duration || 30;
      const targetLen = duration <= 30 ? 'short' : duration <= 90 ? 'medium' : 'long';
      // 30% chance to break out of the length bucket (variety), otherwise stay in.
      const pool = Math.random() < 0.7
        ? quotes.filter((q) => q.length === targetLen)
        : quotes;
      const source = pool.length ? pool : quotes;
      const quote = getNonRepeatingItem(`quote-${targetLen}`, source, (q) => q.id);
      return { code: quote.text, name: quote.source || 'Unknown', quoteId: quote.id };
    }

    case MODES.ZEN: {
      // Endless mode: generate a long stream of words with a "—"  burst every
      // 10-12 words so the test has rhythm without end conditions.
      const target = options.zenTarget || 400;
      const words = await generateNonRepeatingWords(target, difficulty, `zen-${target}`);
      return { code: words, name: 'Zen Mode', zen: true };
    }

    case MODES.ADAPTIVE: {
      // Weak-key drill. The adaptive engine produces text biased
      // toward the user's worst keys.
      try {
        const { generateWeakKeyText } = await import('./adaptive.js');
        const text = await generateWeakKeyText({
          difficulty,
          count: options.count || 60,
          minMistakes: 2,
          weakKeyCount: 5,
        });
        return { code: text, name: 'Weak-key Drill' };
      } catch (e) {
        return generateNonRepeatingWords(60, difficulty, 'adaptive-fallback');
      }
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
 * The optional `language` argument restricts the pool to paragraphs in
 * that language. 'en' (default) uses paragraphs.json. Other languages
 * (fr, de, it, pt, sv, pl, cs, tr, ro) use multilingual-paragraphs.json.
 * If the requested language has no qualifying paragraph at the chosen
 * difficulty, we fall back to English rather than serving nothing.
 *
 * Trimming behaviour: when the current passage would push us past the
 * budget by a wide margin AND we already have one passage in the buffer,
 * we either take a complete leading sentence from the new passage or
 * stop after the first whole passage. The result is a small, complete
 * sequence of sentences rather than a fragment that ends mid-clause.
 */
const getParagraphText = async (difficulty, poolKeySuffix, minWordCount = 0, language = 'en') => {
  let paragraphs;
  if (language === 'en') {
    paragraphs = await loadParagraphs();
  } else {
    const ml = await loadMultilingual();
    if (ml && Array.isArray(ml)) {
      paragraphs = ml.filter((p) => p.language === language);
      // If no paragraphs at this language, fall back to English so
      // the user always has something to type rather than an empty
      // typing area.
      if (paragraphs.length === 0) {
        paragraphs = await loadParagraphs();
      }
    } else {
      paragraphs = await loadParagraphs();
    }
  }

  const fallback = language === 'fr' ? 'Le café est l\'une des boissons les plus consommées au monde.'
    : language === 'de' ? 'Kaffee ist eines der meistgetrunkenen Getränke der Welt.'
    : language === 'it' ? 'Il caffè è una delle bevande più consumate al mondo.'
    : language === 'pt' ? 'O café é uma das bebidas mais consumidas no mundo.'
    : language === 'sv' ? 'Kaffe är en av de mest konsumerade dryckerna i världen.'
    : language === 'pl' ? 'Kawa jest jednym z najczęściej pitych napojów na świecie.'
    : language === 'cs' ? 'Káva je jedním z nejpopulárnějších nápojů na světě.'
    : language === 'tr' ? 'Kahve, dünyada en çok tüketilen içeceklerden biridir.'
    : language === 'ro' ? 'Cafeaua este una dintre cele mai consumate băuturi din lume.'
    : 'The quick brown fox jumps over the lazy dog.';

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
