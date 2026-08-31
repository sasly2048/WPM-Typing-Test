/**
 * Session state.
 *
 * The single source of truth for what the user is typing, where their
 * cursor is, and which characters they got wrong. Everything else — the
 * renderer, the statistics engine, the audio, the timer — reads from
 * this and never mutates it independently.
 *
 * Model
 * -----
 *   originalText  : the exact string the user is supposed to type, in
 *                   source order. Whitespace, newlines, tabs — all
 *                   preserved. This is the canonical reference.
 *
 *   typed[]       : per-character array, length === originalText.length.
 *                   - null     = not yet typed
 *                   - string   = the character the user has typed here
 *                   - ''       = user has explicitly erased at this
 *                                position (the backspace path). '' is
 *                                distinct from null so a delete-and-
 *                                retype sequence is recorded correctly
 *                                for correction-rate metrics.
 *
 *   cursor        : integer index in [0, originalText.length]. Always
 *                   points to the position the next keystroke would
 *                   overwrite. The cursor is *between* characters; index
 *                   N means the next char will be at position N.
 *
 *   input         : a snapshot of the raw key event that produced the
 *                   last mutation, kept so the renderer and the audio
 *                   layer can react to a single keystroke without
 *                   diffing the whole document.
 *
 * Why character-level (and not "word index + char-in-word")
 * -------------------------------------------------------
 * The previous design modelled the passage as an array of words and
 * tracked "current word + current char in word". That works for plain
 * ASCII prose but breaks for:
 *
 *   - custom text with double spaces, tabs, or trailing whitespace
 *   - code mode with newlines, indentation, and copy-paste
 *   - wrapped prose where "word N" and the visible row N are not
 *     the same thing
 *   - any IME / composition input
 *
 * A single absolute cursor over the source string sidesteps all of
 * those, and makes the "backspace across a space" / "delete inside an
 * earlier word" cases that were the source of several cursor bugs
 * disappear entirely.
 *
 * State machine
 * -------------
 *   READY          -> user has not yet typed anything this session
 *   RUNNING        -> user is mid-typing
 *   COMPLETED      -> every position has a non-null typed value
 *   ABORTED        -> destroyed / replaced; further input is ignored
 *
 * Transitions:
 *   READY    -> RUNNING     on first real keystroke
 *   RUNNING  -> RUNNING     on every subsequent keystroke
 *   RUNNING  -> COMPLETED   when cursor === originalText.length
 *                          AND every typed[] is non-null
 *   any      -> ABORTED     on destroy() / replaceSession()
 */

export const SESSION_STATE = Object.freeze({
  READY: 'ready',
  RUNNING: 'running',
  COMPLETED: 'completed',
  ABORTED: 'aborted',
});

export const createSession = (text) => {
  if (typeof text !== 'string') {
    throw new TypeError('createSession requires a string');
  }
  return {
    originalText: text,
    typed: new Array(text.length).fill(null),
    cursor: 0,
    state: SESSION_STATE.READY,
    lastInput: null,
  };
};

/**
 * Apply one keystroke. Returns a NEW state object (the session is
 * never mutated in place); the caller decides whether to commit it.
 * The input event is normalised first so the session model is the
 * only thing that knows about Backspace, Enter, etc.
 *
 * @param {object} session  the current state
 * @param {object} input    { kind, key, code, ctrl, alt, meta, shift,
 *                            isComposing }
 * @returns {object}        new state
 */
export const applyInput = (session, input) => {
  if (session.state === SESSION_STATE.ABORTED) return session;
  if (session.state === SESSION_STATE.COMPLETED) return session;

  const next = {
    originalText: session.originalText,
    typed: session.typed.slice(),
    cursor: session.cursor,
    state: session.state,
    lastInput: input,
  };

  if (input.kind === 'character') {
    // Skip the event if it happens past the end of the source. The
    // input engine is responsible for dropping these at the edge;
    // applying them here would silently corrupt statistics.
    if (next.cursor >= next.originalText.length) return session;
    // Block writes that the user has already touched but later
    // backspaced over. typed[] is null OR ''; '' means "user erased
    // here" so we restore it.
    next.typed[next.cursor] = input.key;
    next.cursor = Math.min(next.cursor + 1, next.originalText.length);
  } else if (input.kind === 'backspace') {
    if (next.cursor === 0) {
      // Nothing to delete. We still record the keystroke so the
      // backspace counter increments, but the session is unchanged.
      next.lastInput = input;
      return next;
    }
    next.cursor -= 1;
    // Mark the cleared position as '' (user-erased) so re-typing
    // is distinct from untouched.
    next.typed[next.cursor] = '';
  } else if (input.kind === 'arrow') {
    if (input.direction === 'left')  next.cursor = Math.max(0, next.cursor - 1);
    if (input.direction === 'right') next.cursor = Math.min(next.originalText.length, next.cursor + 1);
    if (input.direction === 'home')  next.cursor = 0;
    if (input.direction === 'end')   next.cursor = next.originalText.length;
  }
  // The "newline" / "tab" / "indent" kinds are mode-specific and
  // handled by the adapter, not the core session.

  next.state = next.cursor === next.originalText.length &&
    next.typed.every((c) => c !== null)
    ? SESSION_STATE.COMPLETED
    : SESSION_STATE.RUNNING;

  return next;
};

/**
 * Mark a range of positions as written in bulk. Used for
 * auto-indent and the practice page's "press Enter to next line" code
 * mode semantics. The range is half-open: [start, end).
 */
export const writeRange = (session, start, end, value) => {
  if (session.state === SESSION_STATE.ABORTED) return session;
  if (end > session.originalText.length) end = session.originalText.length;
  if (start >= end) return session;

  const next = {
    originalText: session.originalText,
    typed: session.typed.slice(),
    cursor: end,
    state: session.state,
    lastInput: session.lastInput,
  };
  for (let i = start; i < end; i++) next.typed[i] = value ?? session.originalText[i];
  next.state = next.cursor === next.originalText.length &&
    next.typed.every((c) => c !== null)
    ? SESSION_STATE.COMPLETED
    : SESSION_STATE.RUNNING;
  return next;
};

/**
 * Abort a session. After abort, applyInput is a no-op. Used by the
 * page destroy path and by the generation-token guard when a newer
 * session has replaced this one.
 */
export const abort = (session) => ({
  ...session,
  state: SESSION_STATE.ABORTED,
});

/**
 * Derived metrics the renderer / stats engine reads. Each is a pure
 * function so it can run on every frame without mutating the
 * session. Critically, these metrics distinguish character input
 * (what we want to count) from editing operations (what we want to
 * count separately).
 */
export const computeMetrics = (session) => {
  const total = session.originalText.length;
  let correct = 0;
  let incorrect = 0;
  let missed = 0;
  let backspaces = 0;
  let corrections = 0;

  // A "correction" is a backspace that erases a previously typed
  // (incorrect) character. To detect this we look at the previous
  // position's history. We approximate "previously typed and now
  // cleared" by counting positions that are '' (user-erased), but
  // we only count it once per cleared position. The full record of
  // (mistake -> backspace -> correct) is also tracked in the
  // stats engine through the live keystroke stream.
  for (let i = 0; i < total; i++) {
    const t = session.typed[i];
    if (t === null) {
      // Not yet typed. The position is "missed" only if the cursor
      // has already passed it (i.e. the user is past this point).
      if (i < session.cursor) missed++;
    } else if (t === '') {
      backspaces++;
    } else if (t === session.originalText[i]) {
      correct++;
    } else {
      incorrect++;
    }
  }

  // The backspace counter above double-counts. We want each erased
  // position once.
  // (Already correct: '' marks each erased position exactly once.)
  // corrections is the number of mistakes that were followed by a
  // backspace. We derive it from the stats engine via the live
  // stream, not from the snapshot; the snapshot only knows the
  // current state. We expose 0 here as a default and let the stats
  // engine maintain its own running count.
  return {
    total,
    correct,
    incorrect,
    missed,
    backspaces,
    corrections,
    cursor: session.cursor,
    state: session.state,
  };
};
