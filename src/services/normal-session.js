/**
 * Normal-mode session.
 *
 * Owns the session state, the input engine, the stats engine, the
 * renderer, and the timer. Forwards every input event through the
 * session model, then asks the renderer / stats / timer to react.
 *
 * Wiring
 * ------
 *
 *   keyboard event
 *      |
 *      v
 *   InputEngine.normalize(event)        <-- raw -> typed
 *      |
 *      v
 *   applyInput(session, normalised)     <-- session.applyInput
 *      |
 *      v
 *   renderer + stats + audio            <-- react to the new session
 *      |
 *      v
 *   timer
 *
 * Generation token
 * ---------------
 * start() may resolve async text. If the user changes the mode mid-load,
 * a stale start() must not commit its session. The generation counter
 * makes any in-flight start() a no-op once a newer one has begun.
 */
import { applyInput, writeRange, abort as abortSession, SESSION_STATE, createSession } from './session.js';
import { createInputEngine } from './input.js';
import { createRenderer } from './renderer.js';
import { createStats } from './stats.js';
import { createTimer, TIMER_STATE } from './timer.js';

export const createNormalSession = ({
  container,        // element that holds both the spans and the caret
  caret,            // absolutely positioned caret, child of container
  typingSurface,    // the element the user actually types on. The
                    // input engine listens here so keydown events on
                    // the typing surface are captured (they would not
                    // bubble DOWN to a child element).
  onCaretScroll,    // optional, for the typing surface auto-scroll
  onSessionChange,  // callback when session state changes
  onStatsChange,    // callback for live HUD
  onSessionEnd,     // callback when session ends (final stats)
  isMuted,          // returns true when typing should be ignored
  layout = 'qwerty', // physical keyboard layout: qwerty/dvorak/colemak
  requireTrusted = true, // drop synthetic events when fair-play is on
}) => {
  let session = createSession('');
  let generation = 0;
  const stats = createStats();
  const timer = createTimer();
  const renderer = createRenderer({
    container,
    caret,
    onScroll: onCaretScroll,
  });
  // Mode flags. The practice page sets these via `setMode` and they
  // gate input behavior:
  //   stopOnError — ignore the next input event until the wrong
  //                  character is erased with backspace.
  //   freedom      — let the cursor move forward even if the typed
  //                  character is wrong (so the user can keep going
  //                  without backspacing). This is the historical
  //                  default of most typing tests.
  //   confidence   — visually hide upcoming words; reveal them one
  //                  at a time as the current word is completed. The
  //                  session state is unchanged; only the renderer is
  //                  told to mask upcoming text.
  //   easy         — auto-correct: if the user types the wrong key,
  //                  replace it with the expected key as soon as they
  //                  type the next one. The wrong keystroke is
  //                  recorded as a "soft" mistake.
  let modeFlags = { stopOnError: false, freedom: true, confidence: false, easy: false };
  const setMode = (flags) => { modeFlags = { ...modeFlags, ...flags }; };

  // Apply an input event to the current session and notify the
  // listeners. Returns the new session.
  const apply = (input) => {
    if (session.state === SESSION_STATE.ABORTED) return session;
    if (input.kind === 'tab' || input.kind === 'shortcut') {
      // Page-level handler decides what Tab means; we don't react.
      return session;
    }
    if (input.kind === 'escape') {
      return session; // page decides
    }

    // Easy mode: if the next character is wrong, replace it with
    // the expected character on the next keystroke. We detect this
    // by checking whether the LAST typed character is wrong; if so,
    // we backspace and then let the current event through. The
    // session is therefore always self-consistent from the user's
    // perspective.
    if (modeFlags.easy && input.kind === 'character' && session.cursor > 0) {
      const lastIdx = session.cursor - 1;
      const lastTyped = session.typed[lastIdx];
      const expected = session.originalText[lastIdx];
      if (lastTyped && lastTyped !== expected && lastTyped !== '') {
        // The previous keystroke was wrong; substitute now.
        const corrected = applyInput(session, { kind: 'backspace' });
        session = corrected;
      }
    }

    // Stop on error: if the previous character is wrong, ignore the
    // next input event until the user backspaces. The page is
    // expected to surface a "fix the mistake" hint.
    if (modeFlags.stopOnError && input.kind === 'character' && session.cursor > 0) {
      const lastIdx = session.cursor - 1;
      const lastTyped = session.typed[lastIdx];
      const expected = session.originalText[lastIdx];
      if (lastTyped && lastTyped !== expected && lastTyped !== '') {
        // Drop the event; the user has to backspace first.
        if (onSessionChange) onSessionChange(session);
        return session;
      }
    }

    const next = applyInput(session, input);
    const wasAt = session.cursor;
    const atNew = next.cursor;

    // If the user just moved back over a previously-typed character,
    // check if it was a mistake that now becomes a correction. The
    // session model marks cleared positions as ''; the stats engine
    // can read this through the live event stream, but the cleanest
    // place to detect "backspace over a wrong char" is here, in the
    // event handler, because we know what the typed[] state was.
    if (input.kind === 'backspace' && wasAt > 0) {
      const cleared = session.typed[wasAt - 1];
      if (cleared && cleared !== '' && cleared !== session.originalText[wasAt - 1]) {
        // The user backspaced over a wrong char. Count it as a
        // correction. The stats engine's openErrors queue would
        // double-count; we bypass it by recording the correction
        // directly. (We do this by unrolling the engine's openErrors
        // pop — see applyInput in session.js — and tracking here.)
        stats.record({ ...input, _bypassOpenErrors: true });
      } else {
        stats.record(input);
      }
    } else {
      stats.record(input);
    }

    // If the typed character at the previous cursor position
    // doesn't match the source, the session model has applied the
    // input as 'incorrect' (typed[i] = input.key !== source[i]). We
    // note that as a mistake for the key heatmap and the adaptive
    // trainer.
    if (input.kind === 'character' && wasAt < next.originalText.length) {
      const expected = next.originalText[wasAt];
      if (input.key !== expected) {
        stats.noteMistake({ key: input.key });
      }
    }

    session = next;

    // Update the renderer. We touch at most three spans:
    //   1. The character that was just typed or cleared
    //   2. The character that came before it (if backspace, the
    //      position we just erased needs a status update too)
    //   3. The caret
    // Everything else is untouched.
    if (input.kind === 'character') {
      const t = next.typed[wasAt];
      renderer.updateChar(wasAt, t === next.originalText[wasAt] ? 'correct' : 'incorrect');
    } else if (input.kind === 'backspace') {
      // The position the user just erased is now ''. Render it as
      // pending so the user sees the empty slot.
      renderer.updateChar(wasAt - 1, 'pending');
    }
    renderer.setCaret(session.cursor);

    if (onSessionChange) onSessionChange(session);
    if (onStatsChange) onStatsChange(stats.snapshot(session));

    return session;
  };

  // When the user has finished the passage naturally, end the run.
  // The completion signal is `session.state === COMPLETED`; we
  // listen for the transition.
  const input = createInputEngine({
    target: typingSurface,
    emit: (event) => apply(event),
    onShortcut: () => true, // let the page own Tab; we don't insert tabs
    layout,
    requireTrusted,
  });
  const setLayout = (id) => { if (input && input.setLayout) input.setLayout(id); };

  const observeCompletion = () => {
    if (session.state === SESSION_STATE.COMPLETED) {
      finish();
    }
  };

  const finish = () => {
    if (session.state === SESSION_STATE.ABORTED) return;
    const finalStats = stats.finish(session);
    if (onSessionEnd) onSessionEnd({ session, stats: finalStats });
  };

  // Timer expiry forces a finish even if the user is mid-passage.
  timer.onExpire(() => {
    if (session.state === SESSION_STATE.ABORTED) return;
    finish();
  });

  /**
   * Start a new session. `text` is the source string the user must
   * reproduce. The generation counter invalidates any in-flight call
   * when a newer one begins, so a rapid mode switch cannot apply
   * stale text to a fresh mode.
   */
  const start = async (text, opts = {}) => {
    const gen = ++generation;
    if (timer.isRunning()) timer.stop();
    stats.start();
    const fresh = createSession(text);
    session = fresh;

    // If the text is still being fetched and the user has already
    // switched modes, abort. await calls below will resolve in the
    // background and find the generation mismatched.
    if (gen !== generation) return;

    session = fresh;

    // Build the initial render: every character is a 'pending' span.
    // The renderer is purely visual; the session model is the source
    // of truth, and the renderer reads the original text to create
    // one span per character.
    const tokens = new Array(text.length);
    for (let i = 0; i < text.length; i++) {
      tokens[i] = { char: text[i], status: 'pending' };
    }
    renderer.build(text, tokens, { mode: opts.mode || 'normal' });
    renderer.setCaret(0);

    if (opts.timeLimit && opts.timeLimit > 0) {
      timer.start(opts.timeLimit * 1000, { mode: 'countdown' });
      timer.onTick((remainingMs) => {
        if (onStatsChange) onStatsChange({ ...stats.snapshot(session), remainingMs });
      });
    } else {
      timer.start(0, { mode: 'elapsed' });
      timer.onTick(() => {
        if (onStatsChange) onStatsChange(stats.snapshot(session));
      });
    }
  };

  /**
   * Append text to the current session (zen mode chunked refill).
   * The existing session's cursor and typed[] are preserved; the
   * new text is added at the end of the source and rendered as
   * pending spans. If the session was already at the end, it
   * transitions back to RUNNING.
   */
  const appendText = (text, tokens) => {
    if (destroyed) return;
    const combined = session.originalText + text;
    const newTyped = session.typed.slice();
    for (let i = 0; i < text.length; i++) newTyped.push(null);
    session = {
      ...session,
      originalText: combined,
      typed: newTyped,
      state: SESSION_STATE.RUNNING,
    };
    renderer.append(text, tokens);
  };

  /**
   * Abort the current session. Called on page destroy or when a
   * new start() supersedes this one.
   */
  const destroy = () => {
    generation++; // any pending start() becomes a no-op
    timer.stop();
    input.destroy();
    renderer.destroy();
    session = abortSession(session);
  };

  // Expose the input event hook so the page can listen for Escape
  // / Tab if it wants to handle them itself.
  return {
    start,
    apply,
    finish,
    destroy,
    appendText,
    setMode,
    setLayout,
    getMode: () => ({ ...modeFlags }),
    getLayout: () => layout,
    /** Read-only access for the page. */
    getSession: () => session,
    getStats: () => stats,
    getTimer: () => timer,
    getUntrustedEventCount: () => (input && input.getUntrustedCount) ? input.getUntrustedCount() : 0,
    observeCompletion,
  };
};
