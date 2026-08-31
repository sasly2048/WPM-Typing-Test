/**
 * InputEngine.
 *
 * Single point of contact between the browser and the rest of the
 * app. It normalises the chaotic, browser-dependent keydown event
 * surface into a small set of `InputEvent` kinds:
 *
 *   - 'character'  : a printable key was pressed (with the printable
 *                    string already extracted from `event.key`)
 *   - 'backspace'  : the user erased one character
 *   - 'arrow'      : navigation key (left/right/home/end)
 *   - 'newline'    : Enter (passed through; adapters decide what it
 *                    means in their context)
 *   - 'tab'        : Tab (passed through; mode-specific semantics)
 *   - 'escape'     : Escape (used to cancel a session)
 *   - 'shortcut'   : a modifier + key combination the page should
 *                    handle itself (Tab restart in normal mode, etc.)
 *
 * It also handles IME composition events correctly: while the user is
 * composing (e.g. typing Japanese via an IME), keydown events are
 * ignored. The composed string is delivered once via compositionend.
 *
 * The engine does NOT decide what the input means for the session.
 * That is the adapter's job. The engine only translates DOM events
 * into a clean, type-safe shape.
 */

const PRINTABLE_RE = /^\S$/; // single visible character (no whitespace)

/**
 * Decide whether a KeyboardEvent represents a printable character.
 * Modifiers are ignored — typing 'A' (with shift) and 'a' are both
 * characters; the case comes from event.key, not from a flag.
 */
const isPrintableCharacter = (event) => {
  if (event.ctrlKey || event.metaKey || event.altKey) return false;
  const k = event.key;
  if (!k || k.length !== 1) return false;
  // Skip the function keys (F1..F12), arrow keys (already handled),
  // and other multi-char names. event.key for these is 'F1', 'ArrowUp',
  // etc. — all longer than 1 char.
  return PRINTABLE_RE.test(k) && k.charCodeAt(0) >= 32;
};

const isBackspace = (event) => event.key === 'Backspace';

const isArrow = (event) => {
  if (event.key === 'ArrowLeft')  return 'left';
  if (event.key === 'ArrowRight') return 'right';
  if (event.key === 'Home')       return 'home';
  if (event.key === 'End')        return 'end';
  return null;
};

const isNewline = (event) =>
  event.key === 'Enter' && !event.ctrlKey && !event.metaKey && !event.altKey;

const isTab = (event) => event.key === 'Tab';

const isEscape = (event) => event.key === 'Escape';

const isPaste = (event) =>
  (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'v';
const isCopy = (event) =>
  (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'c';
const isCut = (event) =>
  (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'x';

const isSelectAll = (event) =>
  (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a';

/**
 * Build the InputEngine. The `emit` callback receives one InputEvent
 * per normalised input. The owner is responsible for passing that
 * event to the session or the adapter.
 */
export const createInputEngine = ({ target, emit, onShortcut }) => {
  if (!target || typeof emit !== 'function') {
    throw new TypeError('createInputEngine requires a target element and emit callback');
  }
  let composing = false;
  const cleanups = [];
  let suppressed = false; // when true, ignore keydown (used during async work)

  const fire = (kind, payload = {}) => {
    if (suppressed) return;
    emit({
      kind,
      timestamp: performance.now(),
      ...payload,
    });
  };

  const onKeyDown = (event) => {
    // During IME composition the keydowns are not real input — ignore.
    if (composing || event.isComposing) return;
    // Modifiers on their own are not input.
    if (event.key === 'Control' || event.key === 'Meta' || event.key === 'Alt' || event.key === 'Shift') return;
    // Dead keys: special-cased via the composition API on most browsers.
    if (event.key === 'Dead') return;

    // First, mode-agnostic shortcuts. The page decides what Tab
    // means (Normal mode: restart, Developer mode: indent) so we
    // forward Tab as a generic "shortcut" event; pages that want
    // native Tab handling opt out by listening for the raw event
    // themselves before this fires.
    if (isTab(event)) {
      // The page may want to handle Tab itself (e.g. insert a tab
      // character in code mode). The default behaviour on most
      // platforms is to move focus; we want to prevent that.
      event.preventDefault();
      if (onShortcut) {
        const handled = onShortcut({ kind: 'tab', event });
        if (handled === true) return;
      }
      fire('tab', { event });
      return;
    }

    if (isEscape(event)) { fire('escape', { event }); return; }
    if (isNewline(event)) { fire('newline', { event }); return; }

    // Modifier + key combos are not character input; pass them as
    // shortcuts so the page can decide whether to use them.
    if (isPaste(event) || isCopy(event) || isCut(event) || isSelectAll(event)) {
      fire('shortcut', { kind: event.key.toLowerCase(), event });
      event.preventDefault();
      return;
    }

    // Navigation
    const dir = isArrow(event);
    if (dir) {
      // Block default arrow-key scrolling in the typing surface.
      event.preventDefault();
      fire('arrow', { direction: dir, event });
      return;
    }

    if (isBackspace(event)) {
      event.preventDefault();
      fire('backspace', { event });
      return;
    }

    if (isPrintableCharacter(event)) {
      // Letters, digits, punctuation, single-byte space. We always
      // send the printable string (event.key) to the adapter so the
      // session sees the same character the user intended.
      event.preventDefault();
      fire('character', { key: event.key, event });
      return;
    }

    // Anything else: a navigation or browser shortcut we don't care
    // about. Don't preventDefault — let the browser handle it.
  };

  const onCompositionStart = () => { composing = true; };
  const onCompositionEnd = (event) => {
    composing = false;
    // Deliver the composed string as one character event per
    // printable character in the composition. This is how Japanese
    // and CJK input works: the user types a phonetic reading, the
    // IME converts it, and the final string arrives on
    // compositionend.
    const text = event.data || '';
    for (const ch of text) {
      if (PRINTABLE_RE.test(ch) && ch.charCodeAt(0) >= 32) {
        fire('character', { key: ch, event, ime: true });
      } else if (ch === '\n' || ch === '\r') {
        fire('newline', { event, ime: true });
      } else if (ch === ' ') {
        fire('character', { key: ' ', event, ime: true });
      }
    }
  };

  const onBlur = () => { /* no-op; the session decides what to do on focus loss */ };
  const onContextMenu = (event) => event.preventDefault();
  const onCopy = (event) => event.preventDefault();
  const onCut = (event) => event.preventDefault();
  const onPaste = (event) => event.preventDefault();
  const onDrop = (event) => event.preventDefault();

  target.addEventListener('keydown', onKeyDown);
  target.addEventListener('compositionstart', onCompositionStart);
  target.addEventListener('compositionend', onCompositionEnd);
  target.addEventListener('blur', onBlur);
  target.addEventListener('contextmenu', onContextMenu);
  target.addEventListener('copy', onCopy);
  target.addEventListener('cut', onCut);
  target.addEventListener('paste', onPaste);
  target.addEventListener('drop', onDrop);
  cleanups.push(
    () => target.removeEventListener('keydown', onKeyDown),
    () => target.removeEventListener('compositionstart', onCompositionStart),
    () => target.removeEventListener('compositionend', onCompositionEnd),
    () => target.removeEventListener('blur', onBlur),
    () => target.removeEventListener('contextmenu', onContextMenu),
    () => target.removeEventListener('copy', onCopy),
    () => target.removeEventListener('cut', onCut),
    () => target.removeEventListener('paste', onPaste),
    () => target.removeEventListener('drop', onDrop),
  );

  return {
    /** Suspend event emission. Useful while a save/load is in flight
     *  so the user cannot type into a half-rendered session. */
    suppress() { suppressed = true; },
    unsuppress() { suppressed = false; },
    /** Tear down. Called from the page's destroy() so listeners
     *  never outlive the page. */
    destroy() {
      for (const fn of cleanups) { try { fn(); } catch (e) {} }
      cleanups.length = 0;
    },
  };
};
