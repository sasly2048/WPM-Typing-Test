/**
 * Renderer.
 *
 * Renders the session as a series of character spans inside a single
 * container, and positions the caret relative to the same container.
 *
 * One coordinate system
 * ---------------------
 * The caret lives inside the same element that the characters live
 * inside. We measure and position against the same getBoundingClientRect
 * call so the two can never disagree about where a character is.
 * The previous design had the caret in one container and the chars
 * in another; this is the cause of the cursor drift the audit
 * flagged.
 *
 * O(1) updates
 * -----------
 * On a keystroke, the only thing that can change is the character at
 * the cursor, the character before it, the caret position, and the
 * word-bucket class. We update those and nothing else. The previous
 * diff loop iterated the entire text; with character-level tokens
 * we touch at most 2 spans per keystroke.
 *
 * Recalculation
 * -------------
 * ResizeObserver + document.fonts.ready + window.resize re-measure
 * the caret. Without this, the caret drifts on:
 *   - browser resize / mobile rotation
 *   - font load completion
 *   - theme change that swaps font-family
 *   - container width change (responsive)
 */

const FONT_READY = (typeof document !== 'undefined' && document.fonts && document.fonts.ready)
  ? document.fonts.ready
  : Promise.resolve();

/**
 * Build the renderer. The owner passes the target element that
 * already contains the caret (so the caret is positioned in the same
 * container the spans live in — this is the "one coordinate system"
 * fix from the audit).
 */
export const createRenderer = ({ container, caret, onScroll }) => {
  if (!container || !caret) {
    throw new TypeError('createRenderer requires container and caret elements');
  }

  // Cache of character spans, indexed by absolute cursor position
  // (0..originalText.length-1). On full rebuilds the cache is wiped
  // and re-populated. We keep this in addition to lastTokens so we
  // can update individual spans in O(1) when only one char changes.
  const spans = new Array(container.dataset.sourceLength ? Number(container.dataset.sourceLength) : 0).fill(null);
  let lastText = '';
  let lastMode = '';

  // Pending RAF id for the next paint. Cancelled on every new
  // session so we never paint stale data.
  let pendingRaf = 0;
  let destroyed = false;
  const cleanups = [];

  // ResizeObserver: re-measure the caret position. We observe the
  // typing surface, not the body, so devicePixelRatio changes and
  // font-size media queries (which resize the container) all
  // trigger a remeasure.
  let resizeObs = null;
  if (typeof ResizeObserver !== 'undefined') {
    resizeObs = new ResizeObserver(() => {
      // Don't bother re-measuring if the cursor hasn't moved
      // (re-paint) — the caret stays where it is until the
      // session's next keystroke. We only force an update if the
      // user has typed at least one character; otherwise the caret
      // position is just whatever the most recent keystroke put
      // there, and the next keystroke will set it again.
      if (lastText) scheduleRepaint();
    });
    resizeObs.observe(container);
    cleanups.push(() => { try { resizeObs.disconnect(); } catch (e) {} });
  }

  // Window resize as a fallback (some browsers don't fire RO on
  // body changes).
  const onResize = () => scheduleRepaint();
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', onResize);
    cleanups.push(() => window.removeEventListener('resize', onResize));
  }

  // Font load completion: web fonts swap the metrics the moment
  // they load, so the caret must reposition.
  FONT_READY.then(() => scheduleRepaint()).catch(() => {});

  // Expose a way to re-pin the caret to a specific char index
  // (used by mode adapters to align the caret to the visual line
  // start after a wrap).
  let pinnedChar = 0;
  let sourceText = '';
  let sourceMode = 'prose';

  /**
   * Tokens: each character is { char: 'a', status: 'pending' | 'correct'
   * | 'incorrect' | 'extra' | 'missed' }. The renderer does NOT compute
   * the status; that's the caller's job (the session model already
   * knows what's typed vs. expected). The renderer just paints the
   * given tokens at the given character index.
   */
  const build = (text, tokens, opts = {}) => {
    if (destroyed) return;
    sourceText = text;
    sourceMode = opts.mode || 'prose';
    lastText = text;
    lastMode = sourceMode;
    spans.length = text.length;
    container.dataset.sourceLength = String(text.length);
    container.innerHTML = '';
    for (let i = 0; i < text.length; i++) {
      const t = tokens[i] || { char: text[i], status: 'pending' };
      const span = document.createElement('span');
      span.className = `kf-char kf-char--${t.status}`;
      span.dataset.index = String(i);
      // Preserve the source char exactly. For whitespace we still
      // render a real space so flex/inline layouts work, but we
      // toggle a class for visually empty space (e.g. leading
      // indentation) so the renderer can colour it differently.
      if (t.char === ' ') span.classList.add('kf-char--space');
      else if (t.char === '\t') span.classList.add('kf-char--tab');
      span.textContent = t.char === ' ' ? '\u00A0' : t.char;
      container.appendChild(span);
      spans[i] = span;
    }
    scheduleRepaint();
  };

  /**
   * Update one character's status without re-rendering the whole
   * document. O(1).
   */
  const updateChar = (index, status) => {
    const span = spans[index];
    if (!span) return;
    span.className = span.className
      .replace(/kf-char--\w+/, '')
      .trim() + ` kf-char--${status}`;
  };

  /**
   * Compute and apply the caret position from a character index.
   * The caret lives in the same container as the spans, so the
   * coordinate system is unambiguous.
   */
  const setCaret = (charIndex) => {
    if (destroyed) return;
    pinnedChar = charIndex;
    const i = Math.max(0, Math.min(charIndex, sourceText.length));
    const containerRect = container.getBoundingClientRect();

    // Find a target span to anchor against. We prefer the span
    // BEFORE the cursor (where the caret sits, at the right edge),
    // falling back to the first span when the cursor is at 0.
    let anchor = null;
    let isAfterLast = false;
    if (i === 0) {
      anchor = spans[0];
    } else if (i >= sourceText.length) {
      anchor = spans[sourceText.length - 1];
      isAfterLast = true;
    } else {
      anchor = spans[i - 1];
    }
    if (!anchor) return;

    const r = anchor.getBoundingClientRect();
    const left = r.left - containerRect.left + (isAfterLast ? r.width : 0);
    const top = r.top - containerRect.top;
    const height = r.height;
    caret.style.transform = `translate(${left}px, ${top}px)`;
    caret.style.height = `${height}px`;
    caret.style.width = '2px';

    if (onScroll) onScroll({ charIndex: i, top, height, containerRect });
  };

  /**
   * Re-paint the caret from the most recent pinnedChar. Used after
   * resize / font load.
   */
  const repaint = () => setCaret(pinnedChar);

  /**
   * Defer repaint through rAF so a flurry of resize events only
   * triggers one paint.
   */
  const scheduleRepaint = () => {
    if (destroyed) return;
    if (pendingRaf) return;
    pendingRaf = requestAnimationFrame(() => {
      pendingRaf = 0;
      repaint();
    });
  };

  /**
   * Wipe the container for a new session. Always paired with a
   * build() to repopulate.
   */
  const clear = () => {
    if (destroyed) return;
    spans.length = 0;
    container.innerHTML = '';
    container.dataset.sourceLength = '0';
  };

  /**
   * Append characters to the existing render. Used by zen mode to
   * extend the source as the user approaches the end. The new
   * characters are appended as pending spans; the existing
   * coordinate system and the caret position are preserved.
   */
  const append = (text, tokens) => {
    if (destroyed) return;
    const startIdx = spans.length;
    const newSpans = new Array(text.length);
    for (let i = 0; i < text.length; i++) {
      const t = tokens[i] || { char: text[i], status: 'pending' };
      const span = document.createElement('span');
      span.className = `kf-char kf-char--${t.status}`;
      span.dataset.index = String(startIdx + i);
      if (t.char === ' ') span.classList.add('kf-char--space');
      else if (t.char === '\t') span.classList.add('kf-char--tab');
      span.textContent = t.char === ' ' ? '\u00A0' : t.char;
      container.appendChild(span);
      newSpans[i] = span;
    }
    // Splice the new spans into the existing span cache.
    for (let i = 0; i < newSpans.length; i++) spans.push(newSpans[i]);
    sourceText = sourceText + text;
    container.dataset.sourceLength = String(spans.length);
    scheduleRepaint();
  };

  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    if (pendingRaf) cancelAnimationFrame(pendingRaf);
    pendingRaf = 0;
    for (const fn of cleanups) { try { fn(); } catch (e) {} }
    cleanups.length = 0;
  };

  return {
    build,
    append,
    updateChar,
    setCaret,
    scheduleRepaint,
    clear,
    destroy,
    /** Read-only accessors used by tests and by mode adapters. */
    getSpan: (i) => spans[i],
    getContainer: () => container,
    getCaret: () => caret,
    isDestroyed: () => destroyed,
  };
};
