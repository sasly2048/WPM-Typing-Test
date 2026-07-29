/**
 * @typedef {import('../engines/RenderEngine').RenderToken} RenderToken
 * @typedef {import('../engines/InputEngine').InputEvent} InputEvent
 */

/**
 * Adapter for developer code typing mode.
 * Handles newlines, indentation, and structure common in coding tests.
 */
export class CodeAdapter {
    /**
     * @param {string} code - The code snippet to type.
     */
    constructor(code) {
        this.originalCode = code;
        this.lines = code.split('\n');
        
        this.currentLineIndex = 0;
        this.typedLines = [''];
        
        this.metrics = {
            keystrokes: 0,
            autoIndents: 0
        };
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
             // Standard 4 space indentation for simplicity; could be configurable
             this.typedLines[this.currentLineIndex] = currentInput + '    ';
        } else if (inputEvent.isBackspace) {
            if (currentInput.length > 0) {
                this.typedLines[this.currentLineIndex] = currentInput.slice(0, -1);
            } else if (this.currentLineIndex > 0) {
                this.currentLineIndex--;
            }
        } else if (inputEvent.key.length === 1) {
            this.typedLines[this.currentLineIndex] = currentInput + inputEvent.key;
        }

        return {
            renderState: this.getRenderState(),
            caretPosition: this.getCaretPosition()
        };
    }

    /**
     * Analyzes the target line and automatically indents if the user proceeds to it.
     * Matches leading whitespace from the source code.
     * @private
     */
    _applyAutoIndent() {
        const targetLine = this.lines[this.currentLineIndex];
        const indentMatch = targetLine.match(/^(\s+)/);
        
        if (indentMatch) {
             const indent = indentMatch[1];
             this.typedLines[this.currentLineIndex] = indent;
             this.metrics.autoIndents++;
        }
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
            
            // Allow empty lines to render properly with at least a space
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
