/**
 * Content Engine - Central Modular Content Management System for KeyFlow
 * 
 * Features:
 * - Category, Difficulty, Language, and Duration-aware selection
 * - Non-repeating pool exhaustion shuffling
 * - Snippet history queue (back / forward / next)
 * - Mid-session lock (prevents shuffling mid-test)
 */

import { getNonRepeatingItem, resetPool } from './pool-shuffler.js';
import { COMMON_WORDS } from '../content/words/common.js';
import { ADVANCED_WORDS } from '../content/words/advanced.js';
import { TECHNICAL_WORDS } from '../content/words/technical.js';
import { PARAGRAPHS_15S } from '../content/paragraphs/15s.js';
import { PARAGRAPHS_30S } from '../content/paragraphs/30s.js';
import { PARAGRAPHS_60S } from '../content/paragraphs/60s.js';
import { LANGUAGE_SNIPPETS } from '../content/developer/languages.js';

export class ContentEngine {
  constructor() {
    this.historyQueue = [];
    this.historyIndex = -1;
    this.isSessionLocked = false;
  }

  /**
   * Locks the current content to prevent mid-session refreshing.
   */
  lockSession() {
    this.isSessionLocked = true;
  }

  /**
   * Unlocks session allowing new content selection.
   */
  unlockSession() {
    this.isSessionLocked = false;
  }

  /**
   * Generates or fetches the next non-repeating content snippet.
   * @param {Object} options
   * @param {string} options.mode - 'paragraph', 'time', 'words', 'code'
   * @param {number} [options.duration=30] - 15, 30, 60, 120, 300, 600
   * @param {number} [options.wordCount=50]
   * @param {string} [options.language='javascript']
   * @param {string} [options.difficulty='medium']
   * @returns {string} Text content
   */
  getNextContent(options = {}) {
    if (this.isSessionLocked) {
      console.warn("Content Engine is locked mid-session.");
      return this.getCurrentContent() || "Locked session text.";
    }

    const { mode = 'time', duration = 30, wordCount = 50, language = 'javascript', difficulty = 'medium' } = options;
    let text = "";

    if (mode === 'code') {
      const snippets = LANGUAGE_SNIPPETS[language] || LANGUAGE_SNIPPETS.javascript;
      const item = getNonRepeatingItem(`code-${language}`, snippets, s => s.id);
      text = item ? item.code : `console.log("Hello KeyFlow");`;
    } else if (mode === 'time') {
      if (duration <= 15) {
        const item = getNonRepeatingItem('p15', PARAGRAPHS_15S, p => p.id);
        text = item.text;
      } else if (duration <= 30) {
        const item = getNonRepeatingItem('p30', PARAGRAPHS_30S, p => p.id);
        text = item.text;
      } else {
        const item = getNonRepeatingItem('p60', PARAGRAPHS_60S, p => p.id);
        text = item.text;
      }
    } else if (mode === 'words') {
      const pool = difficulty === 'hard' ? ADVANCED_WORDS : (difficulty === 'expert' ? TECHNICAL_WORDS : COMMON_WORDS);
      const words = [];
      for (let i = 0; i < wordCount; i++) {
        words.push(getNonRepeatingItem(`words-${difficulty}`, pool));
      }
      text = words.join(' ');
    } else {
      const item = getNonRepeatingItem('p30', PARAGRAPHS_30S, p => p.id);
      text = item ? item.text : "The quick brown fox jumps over the lazy dog.";
    }

    // Push to history queue
    this.historyQueue.push(text);
    this.historyIndex = this.historyQueue.length - 1;
    return text;
  }

  /**
   * Returns the current active snippet in history.
   * @returns {string|null}
   */
  getCurrentContent() {
    if (this.historyIndex >= 0 && this.historyIndex < this.historyQueue.length) {
      return this.historyQueue[this.historyIndex];
    }
    return null;
  }
}

export const contentEngine = new ContentEngine();
