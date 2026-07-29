/**
 * @typedef {import('../engines/RenderEngine').RenderToken} RenderToken
 * @typedef {import('../engines/InputEngine').InputEvent} InputEvent
 */

/**
 * Adapter for standard words/prose typing mode.
 * Evaluates typing accuracy on a word-by-word basis.
 */
export class WordsAdapter {
    /**
     * @param {string} text - The prose/words to be typed.
     */
    constructor(text) {
        this.originalText = text;
        this.words = text.split(' ');
        
        this.currentWordIndex = 0;
        this.typedWords = ['']; // Array of strings holding user input per word
        
        this.metrics = {
            keystrokes: 0
        };
    }

    /**
     * Processes an input event and updates the adapter state.
     * @param {InputEvent} inputEvent
     * @returns {Object} State update containing information needed for rendering.
     */
    processInput(inputEvent) {
        this.metrics.keystrokes++;
        
        let currentInput = this.typedWords[this.currentWordIndex];

        if (inputEvent.isBackspace) {
            if (currentInput.length > 0) {
                // Delete character in current word
                this.typedWords[this.currentWordIndex] = currentInput.slice(0, -1);
            } else if (this.currentWordIndex > 0) {
                // Move back to previous word
                this.currentWordIndex--;
            }
        } else if (inputEvent.isSpace) {
            // Move to next word
            if (currentInput.length > 0) { // Optional: prevent advancing on empty word
                this.currentWordIndex++;
                if (this.currentWordIndex >= this.typedWords.length) {
                    this.typedWords.push('');
                }
            }
        } else if (inputEvent.key.length === 1) {
            // Regular character
            this.typedWords[this.currentWordIndex] = currentInput + inputEvent.key;
        }

        return {
            renderState: this.getRenderState(),
            caretPosition: this.getCaretPosition()
        };
    }

    /**
     * Generates a 2D array of tokens for the RenderEngine.
     * @returns {Array<Array<RenderToken>>}
     */
    getRenderState() {
        let lineTokens = [];

        for (let i = 0; i < this.words.length; i++) {
            const targetWord = this.words[i];
            const typedWord = this.typedWords[i] !== undefined ? this.typedWords[i] : null;
            
            const maxLength = Math.max(targetWord.length, typedWord ? typedWord.length : 0);
            
            for (let j = 0; j < maxLength; j++) {
                let char = targetWord[j] || '';
                let status = 'pending';
                
                if (typedWord !== null && j < typedWord.length) {
                    if (j >= targetWord.length) {
                        status = 'extra incorrect';
                        char = typedWord[j]; // Show the extra character typed
                    } else if (typedWord[j] === targetWord[j]) {
                        status = 'correct';
                    } else {
                        status = 'incorrect';
                    }
                } else if (typedWord !== null && i < this.currentWordIndex && j >= typedWord.length) {
                     status = 'missed'; // Character was skipped
                }

                lineTokens.push({ char, status });
            }

            // Append space after the word if not the last word
            if (i < this.words.length - 1) {
                let spaceStatus = 'pending';
                if (i < this.currentWordIndex) {
                     spaceStatus = 'correct';
                }
                lineTokens.push({ char: ' ', status: spaceStatus });
            }
        }
        
        // Everything returned as a single line format for wrapping via CSS flex/wrap.
        // Or can be expanded to calculate hard line breaks based on layout logic later.
        return [lineTokens];
    }

    /**
     * Calculates current caret position based on state.
     * @returns {{lineIndex: number, charIndex: number}}
     */
    getCaretPosition() {
        let charIndex = 0;
        
        for (let i = 0; i < this.currentWordIndex; i++) {
            const targetWord = this.words[i];
            const typedWord = this.typedWords[i] || '';
            charIndex += Math.max(targetWord.length, typedWord.length) + 1; // +1 for the space
        }
        
        const currentTypedWord = this.typedWords[this.currentWordIndex] || '';
        charIndex += currentTypedWord.length;

        return { lineIndex: 0, charIndex };
    }
}
