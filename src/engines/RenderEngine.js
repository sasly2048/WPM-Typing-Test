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
                charEl.textContent = token.char === ' ' ? '\u00A0' : token.char;
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
                    charEl.textContent = token.char === ' ' ? '\u00A0' : token.char;
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
     * @param {number} lineIndex - The target line index.
     * @param {number} charIndex - The target character index.
     */
    updateCaretPosition(lineIndex, charIndex) {
        if (!this.caret) return;
        
        let targetEl;
        let isEndOfLine = false;

        if (this.charElements[lineIndex] && this.charElements[lineIndex][charIndex]) {
            targetEl = this.charElements[lineIndex][charIndex];
        } else if (this.charElements[lineIndex] && charIndex > 0) {
            // Position after the last character in the line
            targetEl = this.charElements[lineIndex][charIndex - 1];
            isEndOfLine = true;
        }

        if (targetEl) {
            const rect = targetEl.getBoundingClientRect();
            const containerRect = this.container.getBoundingClientRect();

            let left = rect.left - containerRect.left;
            if (isEndOfLine) {
                left += rect.width;
            }
            
            this.caret.style.transform = `translate(${left}px, ${rect.top - containerRect.top}px)`;
            
            this._scrollToCaret(targetEl);
        }
    }

    /**
     * Ensures the caret is visible within the scrolling container.
     * @private
     * @param {HTMLElement} targetEl 
     */
    _scrollToCaret(targetEl) {
        const containerRect = this.container.getBoundingClientRect();
        const elRect = targetEl.getBoundingClientRect();

        if (elRect.bottom > containerRect.bottom) {
            this.container.scrollTop += (elRect.bottom - containerRect.bottom);
        } else if (elRect.top < containerRect.top) {
            this.container.scrollTop -= (containerRect.top - elRect.top);
        }
    }
}
