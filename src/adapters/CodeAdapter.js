/**
 * @typedef {import('../engines/RenderEngine').RenderToken} RenderToken
 * @typedef {import('../engines/InputEngine').InputEvent} InputEvent
 */

/**
 * Adapter for developer code typing mode.
 *
 * The code adapter understands the structural grammar of source code:
 *   - newlines and indentation are first-class events (pressing
 *     Enter auto-indents to match the source's leading whitespace,
 *     and Tab inserts the configured indent unit);
 *   - bracket characters are tracked as a class so the metrics
 *     surface bracket-specific accuracy in addition to the overall
 *     character accuracy;
 *   - the per-character class (whitespace / letter / digit / symbol /
 *     indent) is recorded for every typed char so the analytics
 *     layer can compute symbol-accuracy and indentation-accuracy
 *     without having to re-classify.
 *
 * This is the second pillar of the "best-in-class Developer Mode"
 * goal: real structural awareness, not just a smarter text buffer.
 */

/** Bracket pairs we track. Each opening must be matched by its closing. */
const BRACKETS = {
  '(': ')',
  '[': ']',
  '{': '}',
  '<': '>',
};

/** Classify a single character into a class the analytics layer understands. */
const classifyChar = (ch) => {
  if (ch === undefined || ch === null) return 'unknown';
  if (ch === ' ' || ch === '\t') return 'whitespace';
  if (ch === '\n') return 'newline';
  if (/[A-Za-z_]/.test(ch)) return 'letter';
  if (/[0-9]/.test(ch)) return 'digit';
  if ('()[]{}<>'.includes(ch)) return 'bracket';
  return 'symbol';
};

export class CodeAdapter {
  /**
   * @param {string} code - The code snippet to type.
   * @param {Object} [opts]
   * @param {number} [opts.indentSize=4] spaces per Tab keypress
   * @param {string} [opts.indentChar=' '] what the auto-indent uses
   */
  constructor(code, opts = {}) {
    this.originalCode = code;
    this.lines = code.split('\n');
    this.indentSize = opts.indentSize ?? 4;
    this.indentChar = opts.indentChar ?? ' ';

    this.currentLineIndex = 0;
    this.typedLines = [''];

    // Per-class correctness tallies. The analytics layer reads these
    // to produce symbol-accuracy, bracket-accuracy, indent-accuracy
    // on the results page.
    this.classStats = Object.create(null);
    for (const k of ['whitespace', 'letter', 'digit', 'symbol', 'bracket', 'newline', 'indent']) {
      this.classStats[k] = { correct: 0, total: 0 };
    }
    this.bracketStats = { matched: 0, mismatched: 0 };
    this.metrics = {
      keystrokes: 0,
      autoIndents: 0,
    };
  }

  /**
   * True when the user has typed every line in the buffer to its full
   * target length. Code mode uses the same passage-completion
   * semantics as prose.
   */
  passageFinished() {
    const last = this.lines.length - 1;
    return (
      this.currentLineIndex >= last &&
      (this.typedLines[last] || '').length >= (this.lines[last] || '').length
    );
  }

  /**
   * Processes an input event for code typing.
   * @param {InputEvent} inputEvent
   * @returns {Object} State update containing information needed for rendering.
   */
  processInput(inputEvent) {
    this.metrics.keystrokes++;

    let currentInput = this.typedLines[this.currentLineIndex];

    if (inputEvent.key === 'Enter') {
      if (this.currentLineIndex < this.lines.length - 1) {
        this.currentLineIndex++;
        if (this.currentLineIndex >= this.typedLines.length) {
          this.typedLines.push('');
        }
        this._applyAutoIndent();
      }
    } else if (inputEvent.key === 'Tab') {
      inputEvent.originalEvent?.preventDefault();
      // Insert the configured indent unit. Real code editors expand
      // tabs to spaces when "Insert spaces" is on, which is the
      // default for most modern setups.
      this.typedLines[this.currentLineIndex] = currentInput + this.indentChar.repeat(this.indentSize);
    } else if (inputEvent.isBackspace) {
      if (currentInput.length > 0) {
        this.typedLines[this.currentLineIndex] = currentInput.slice(0, -1);
      } else if (this.currentLineIndex > 0) {
        this.currentLineIndex--;
      }
    } else if (inputEvent.key.length === 1) {
      const expected = this._expectedChar();
      const correct = inputEvent.key === expected;
      const cls = classifyChar(expected);
      if (this.classStats[cls]) {
        this.classStats[cls].total++;
        if (correct) this.classStats[cls].correct++;
      }
      // Track bracket pair mismatches for the bracket-accuracy metric.
      this._recordBracket(inputEvent.key, correct);
      this.typedLines[this.currentLineIndex] = currentInput + inputEvent.key;
    }

    return {
      renderState: this.getRenderState(),
      caretPosition: this.getCaretPosition()
    };
  }

  /**
   * Track open/close bracket pairs. The adapter maintains a small
   * stack of expected closers; if the user types a closer that
   * does not match the top of the stack, that's a mismatched pair.
   * This is the foundation for the "bracket accuracy" metric.
   */
  _recordBracket(key, correct) {
    if (BRACKETS[key]) {
      // Opening bracket: push its closer onto the stack.
      this._bracketStack = this._bracketStack || [];
      this._bracketStack.push(BRACKETS[key]);
    } else if (Object.values(BRACKETS).includes(key)) {
      // Closing bracket: pop and compare.
      this._bracketStack = this._bracketStack || [];
      const expected = this._bracketStack.pop();
      if (expected === key && correct) this.bracketStats.matched++;
      else this.bracketStats.mismatched++;
    }
  }

  /**
   * Auto-indent: when the user presses Enter to move to the next
   * line, the adapter copies the leading whitespace from the source
   * line so the user doesn't have to manually indent.
   * @private
   */
  _applyAutoIndent() {
    const targetLine = this.lines[this.currentLineIndex];
    if (!targetLine) return;
    const indentMatch = targetLine.match(/^(\s+)/);
    if (indentMatch) {
      const indent = indentMatch[1];
      this.typedLines[this.currentLineIndex] = indent;
      this.metrics.autoIndents++;
      this.classStats.indent.total++;
      this.classStats.indent.correct++;
    }
  }

  /**
   * The character the user is expected to type at the current caret
   * position. Returns ' ' (space) when the line is complete so the
   * is-correct check below can never index out of bounds.
   * @private
   */
  _expectedChar() {
    const target = this.lines[this.currentLineIndex] || '';
    const typed = this.typedLines[this.currentLineIndex] || '';
    return target[typed.length] || ' ';
  }

  /**
   * Generates a 2D array of tokens for the RenderEngine.
   * @returns {Array<Array<RenderToken>>}
   */
  getRenderState() {
    let tokens = [];

    for (let i = 0; i < this.lines.length; i++) {
      const targetLine = this.lines[i];
      const typedLine = this.typedLines[i] !== undefined ? this.typedLines[i] : null;
      let lineTokens = [];

      const maxLength = Math.max(targetLine.length, typedLine ? typedLine.length : 0);

      if (maxLength === 0) {
        lineTokens.push({ char: ' ', status: 'pending empty-line' });
      }

      for (let j = 0; j < maxLength; j++) {
        let char = targetLine[j] || '';
        let status = 'pending';

        if (typedLine !== null && j < typedLine.length) {
          if (j >= targetLine.length) {
            status = 'extra incorrect';
            char = typedLine[j];
          } else if (typedLine[j] === targetLine[j]) {
            status = 'correct';
          } else {
            status = 'incorrect';
          }
        } else if (typedLine !== null && i < this.currentLineIndex && j >= typedLine.length) {
          status = 'missed';
        }

        lineTokens.push({ char, status });
      }
      tokens.push(lineTokens);
    }

    return tokens;
  }

  /**
   * Calculates current caret position based on state.
   * @returns {{lineIndex: number, charIndex: number}}
   */
  getCaretPosition() {
    const currentTypedLine = this.typedLines[this.currentLineIndex] || '';
    return {
      lineIndex: this.currentLineIndex,
      charIndex: currentTypedLine.length
    };
  }
}

export { classifyChar, BRACKETS };
