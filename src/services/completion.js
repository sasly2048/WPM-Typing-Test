/**
 * Completion policies.
 *
 * One of the most important invariants in a typing app: each mode has
 * exactly one completion authority, and they never leak across modes.
 *
 *   time     — the timer is the sole authority. Even if a fast typist
 *              finishes the passage, the session continues until the
 *              clock runs out. The text budget is sized to outlive
 *              even an 80 WPM typist for the full duration, so
 *              reaching the end is genuinely rare.
 *
 *   words    — the user finishes typing the requested word count.
 *              The adapter reports the end-of-passage; we exit
 *              immediately when the count is met.
 *
 *   paragraph — the user finishes the single curated passage.
 *
 *   code     — the user finishes the (single) code snippet.
 *
 *   custom   — the user finishes the user-supplied text.
 *
 * The policy is constructed once per session and queried by the
 * practice loop. The query is cheap (constant time) and the policy
 * has no internal state of its own — it inspects whatever the
 * adapter and timer report.
 */

export const COMPLETION = Object.freeze({
  TIME: 'time',
  WORDS: 'words',
  PARAGRAPH: 'paragraph',
  CODE: 'code',
  CUSTOM: 'custom',
});

/**
 * Build a completion policy for the given mode.
 *
 * @param {string} mode            one of COMPLETION values
 * @param {Object} ctx
 * @param {Object} ctx.adapter     WordsAdapter | CodeAdapter exposing
 *                                 passageFinished() / finished
 * @param {() => boolean} ctx.timerExpired   true when the session clock
 *                                 has run out (only meaningful for time)
 * @param {number}      ctx.targetWordCount the user-picked count, if any
 * @param {number}      ctx.typedWordCount  how many words the user has
 *                                 completed so far (live)
 * @returns {{ mode, isComplete(): boolean, label: string }}
 */
export const createCompletionPolicy = (mode, ctx) => {
  switch (mode) {
    case COMPLETION.TIME:
      return {
        mode,
        label: 'timer',
        isComplete: () => !!ctx.timerExpired(),
      };

    case COMPLETION.WORDS:
      return {
        mode,
        label: 'word-count',
        isComplete: () => {
          // Authoritative: the configured word count. We also fire if the
          // user has visibly completed every word in the buffer, because
          // the buffer may have been generated with slightly fewer words
          // than the user requested (it never has more, but defensive).
          const typedWords = typeof ctx.typedWordCount === 'function'
            ? ctx.typedWordCount()
            : ctx.typedWordCount;
          if (ctx.targetWordCount > 0 && typedWords >= ctx.targetWordCount) {
            return true;
          }
          return ctx.adapter?.passageFinished?.() ?? false;
        },
      };

    case COMPLETION.CODE:
    case COMPLETION.CUSTOM:
    case COMPLETION.PARAGRAPH:
    default:
      return {
        mode,
        label: 'passage',
        isComplete: () => ctx.adapter?.passageFinished?.() ?? false,
      };
  }
};
