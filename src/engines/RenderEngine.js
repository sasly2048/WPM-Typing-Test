/**
 * @typedef {Object} RenderToken
 * @property {string} char - The character to render.
 * @property {string} status - Status of the character (e.g., 'correct', 'incorrect', 'pending', 'extra', 'missed').
 */

/**
 * Handles DOM manipulation, caret positioning, scroll tracking, and rendering text.
 * Highly performant, limits reflows by reusing or optimally recreating DOM nodes.
 */
export class RenderEngine {
    /**
     * @param {HTMLElement} container - The main container for rendering text lines.
     * @param {HTMLElement} caret - The caret (cursor) element.
     */
    constructor(container, caret) {
        this.container = container;
        this.caret = caret;
        this.lineElements = [];
        this.charElements = []; // 2D array holding character spans
        this.lastTokens = null; // Previously rendered tokens, for diffing
    }

    /**
     * Renders a block of text based on the provided tokens.
     * On the first call (or when the underlying text/line count changes),
     * builds the DOM from scratch. On subsequent calls with the same shape,
     * diffs against the last render and only touches spans whose (char, status)
     * actually changed \u2014 keystroke-to-keystroke updates stay O(changed chars)
     * instead of O(full text), which is what keeps the caret and highlighting
     * feeling instant on long passages.
     * @param {Array<Array<RenderToken>>} lines - A 2D array of tokens representing lines and characters.
     */
    render(lines) {
        if (this._canDiff(lines)) {
            this._diffRender(lines);
        } else {
            this._fullRender(lines);
        }
        this.lastTokens = lines;
    }

    /**
     * Forces the next render() call to do a full rebuild rather than diffing
     * against stale tokens — call this whenever a new, unrelated text is
     * loaded (e.g. starting a new session) so a same-length new snippet
     * can't be misread as a same-content edit.
     */
    resetDiffState() {
        this.lastTokens = null;
    }

    /**
     * @private
     * @param {Array<Array<RenderToken>>} lines
     * @returns {boolean}
     */
    _canDiff(lines) {
        if (!this.lastTokens || this.lastTokens.length !== lines.length) return false;
        for (let i = 0; i < lines.length; i++) {
            if (this.lastTokens[i].length !== lines[i].length) return false;
        }
        return true;
    }

    /**
     * @private
     * @param {Array<Array<RenderToken>>} lines
     */
    _fullRender(lines) {
        this.container.innerHTML = '';
        this.lineElements = [];
        this.charElements = [];

        const fragment = document.createDocumentFragment();

        lines.forEach((lineTokens, lineIndex) => {
            const lineEl = document.createElement('div');
            lineEl.className = 'keyflow-line';
            lineEl.dataset.lineIndex = lineIndex;

            const charElsInLine = [];

            lineTokens.forEach((token, charIndex) => {
                const charEl = document.createElement('span');
                charEl.className = `keyflow-char ${token.status}`;
                // Use a non-breaking space for visual spacing
                // Real space, not NBSP. NBSP never offers a line-break opportunity, so
// with one span per character the browser could only break mid-word.
// Containers set `white-space: pre-wrap`, which keeps spaces visible
// while still allowing breaks at them.
charEl.textContent = token.char;
                charEl.dataset.lineIndex = lineIndex;
                charEl.dataset.charIndex = charIndex;

                lineEl.appendChild(charEl);
                charElsInLine.push(charEl);
            });

            fragment.appendChild(lineEl);
            this.lineElements.push(lineEl);
            this.charElements.push(charElsInLine);
        });

        this.container.appendChild(fragment);
    }

    /**
     * @private
     * @param {Array<Array<RenderToken>>} lines
     */
    _diffRender(lines) {
        lines.forEach((lineTokens, lineIndex) => {
            const prevLine = this.lastTokens[lineIndex];
            lineTokens.forEach((token, charIndex) => {
                const prevToken = prevLine[charIndex];
                if (prevToken.char === token.char && prevToken.status === token.status) return;

                const charEl = this.charElements[lineIndex][charIndex];
                if (!charEl) return;

                if (prevToken.status !== token.status) {
                    charEl.className = `keyflow-char ${token.status}`;
                }
                if (prevToken.char !== token.char) {
                    // Real space, not NBSP. NBSP never offers a line-break opportunity, so
// with one span per character the browser could only break mid-word.
// Containers set `white-space: pre-wrap`, which keeps spaces visible
// while still allowing breaks at them.
charEl.textContent = token.char;
                }
            });
        });
    }

    /**
     * Granularly updates the status of a specific character to minimize DOM repaints.
     * @param {number} lineIndex - The line index.
     * @param {number} charIndex - The character index.
     * @param {string} status - The new status class (e.g., 'correct', 'incorrect', 'pending').
     */
    updateCharStatus(lineIndex, charIndex, status) {
        if (this.charElements[lineIndex] && this.charElements[lineIndex][charIndex]) {
            const el = this.charElements[lineIndex][charIndex];
            el.classList.remove('correct', 'incorrect', 'extra', 'missed', 'pending');
            if (status) {
                el.classList.add(...status.split(' '));
            }
        }
    }

    /**
     * Moves the absolute positioned caret to the current typing position.
     *
     * Vertical alignment uses the *line* element (keyflow-line), not
     * the character — the line's top edge is a stable anchor regardless
     * of which character is the caret target, so the caret never drifts
     * a pixel or two between keystrokes as different characters have
     * slightly different glyph metrics.
     *
     * @param {number} lineIndex - The target line index.
     * @param {number} charIndex - The target character index.
     */
    updateCaretPosition(lineIndex, charIndex) {
        if (!this.caret) return;

        const lineEl = this.lineElements[lineIndex];
        const chars = this.charElements[lineIndex];
        if (!lineEl || !chars) return;

        let targetEl;
        let isEndOfLine = false;
        if (chars[charIndex]) {
            targetEl = chars[charIndex];
        } else if (charIndex > 0 && chars[charIndex - 1]) {
            targetEl = chars[charIndex - 1];
            isEndOfLine = true;
        }
        if (!targetEl) return;

        const containerRect = this.container.getBoundingClientRect();
        const lineRect = lineEl.getBoundingClientRect();
        const targetRect = targetEl.getBoundingClientRect();

        const left = (targetRect.left - containerRect.left) + (isEndOfLine ? targetRect.width : 0);
        // Anchor the caret to the line's top edge. Combined with a
        // caret height set to the full line-height, this gives a
        // pixel-perfect alignment that does not depend on the
        // current character's glyph metrics.
        const top = lineRect.top - containerRect.top;

        this.caret.style.transform = `translate(${left}px, ${top}px)`;
        this.caret.style.height = `${lineRect.height}px`;

        this._scrollToCaret(targetEl);
    }

    /**
     * Ensures the caret is visible within the scrolling container.
     *
     * Walks up from the target to find the first scrollable ancestor
     * and keeps the caret line in view there. The text surface itself
     * has a max-height in CSS, so this matters once a session runs long
     * enough to wrap the text past the visible area — without it the
     * user types off-screen and loses track of where they are.
     *
     * @private
     * @param {HTMLElement} targetEl
     */
    _scrollToCaret(targetEl) {
        // Find the scrollable ancestor. The text container sits inside
        // .practice__surface which has the overflow:auto; the immediate
        // parent is .typing-surface which is a positioning context for
        // the caret, so it is intentionally not scrollable. We walk up
        // until we find an element that actually overflows.
        let scroller = this.container.parentElement;
        while (scroller && scroller !== document.body) {
            const style = getComputedStyle(scroller);
            if (style.overflowY === 'auto' || style.overflowY === 'scroll') break;
            scroller = scroller.parentElement;
        }
        if (!scroller || scroller === document.body) return;

        // Place the caret ~25% from the top of the visible window, so the
        // user can read what they just typed AND see what's coming up.
        const scrollerRect = scroller.getBoundingClientRect();
        const elRect = targetEl.getBoundingClientRect();
        const targetLine = scrollerRect.top + scrollerRect.height * 0.25;
        const delta = elRect.top - targetLine;

        scroller.scrollBy({ top: delta, behavior: 'auto' });
    }
}
