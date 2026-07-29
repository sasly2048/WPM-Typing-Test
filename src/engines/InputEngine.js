/**
 * @typedef {Object} InputEvent
 * @property {string} key - The normalized key pressed.
 * @property {boolean} isBackspace - True if the key is a backspace.
 * @property {boolean} isSpace - True if the key is a space.
 * @property {number} timestamp - The time the key was pressed in milliseconds.
 * @property {KeyboardEvent} originalEvent - The original keyboard event.
 */

/**
 * Handles raw keystrokes and enforces Fair Play rules.
 * Blocks pasting, dragging, dropping, and automated inputs.
 * Prevents default browser scrolling on Space/Backspace keys.
 */
export class InputEngine {
    /**
     * @param {HTMLElement} targetElement - The DOM element to attach listeners to.
     * @param {Function} onInput - Callback for normalized key events.
     * @param {Function} onFairPlayViolation - Callback for fair play violations.
     */
    constructor(targetElement, onInput, onFairPlayViolation) {
        this.targetElement = targetElement;
        this.onInput = onInput;
        this.onFairPlayViolation = onFairPlayViolation;
        this.isActive = false;

        this._handleKeyDown = this._handleKeyDown.bind(this);
        this._handlePaste = this._handlePaste.bind(this);
        this._handleDrop = this._handleDrop.bind(this);
        this._handleDragOver = this._handleDragOver.bind(this);
    }

    /**
     * Starts listening for input events.
     */
    start() {
        if (this.isActive) return;
        this.isActive = true;
        
        this.targetElement.addEventListener('keydown', this._handleKeyDown);
        this.targetElement.addEventListener('paste', this._handlePaste);
        this.targetElement.addEventListener('drop', this._handleDrop);
        this.targetElement.addEventListener('dragover', this._handleDragOver);
    }

    /**
     * Stops listening for input events.
     */
    stop() {
        if (!this.isActive) return;
        this.isActive = false;

        this.targetElement.removeEventListener('keydown', this._handleKeyDown);
        this.targetElement.removeEventListener('paste', this._handlePaste);
        this.targetElement.removeEventListener('drop', this._handleDrop);
        this.targetElement.removeEventListener('dragover', this._handleDragOver);
    }

    /**
     * Triggers the fair play violation callback.
     * @private
     * @param {Event} event - The original event that triggered the violation.
     */
    _triggerFairPlayViolation(event) {
        event.preventDefault();
        event.stopPropagation();
        if (this.onFairPlayViolation) {
            this.onFairPlayViolation("Typing sessions only accept genuine keyboard input to keep statistics fair.");
        }
    }

    /**
     * Handles keydown events, normalizes them, and filters out unwanted combinations.
     * @private
     * @param {KeyboardEvent} event
     */
    _handleKeyDown(event) {
        if (event.key === ' ' || event.key === 'Backspace') {
            event.preventDefault();
        }

        if (event.key === 'Tab' && this.targetElement.closest('.is-typing')) {
            event.preventDefault();
        }

        // Prevent Cmd+V or Ctrl+V (Paste)
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'v') {
            this._triggerFairPlayViolation(event);
            return;
        }

        // Ignore modifier keys alone
        const ignoredKeys = [
            'Control', 'Shift', 'Alt', 'Meta', 'CapsLock', 'Escape', 
            'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 
            'Home', 'End', 'Insert', 'NumLock', 'ScrollLock', 'Pause', 'ContextMenu'
        ];
        
        if (ignoredKeys.includes(event.key)) {
            return;
        }

        const normalizedEvent = {
            key: event.key,
            isBackspace: event.key === 'Backspace',
            isSpace: event.key === ' ',
            timestamp: performance.now(),
            originalEvent: event
        };

        if (this.onInput) {
            this.onInput(normalizedEvent);
        }
    }

    /**
     * @private
     * @param {ClipboardEvent} event 
     */
    _handlePaste(event) {
        this._triggerFairPlayViolation(event);
    }

    /**
     * @private
     * @param {DragEvent} event 
     */
    _handleDrop(event) {
        this._triggerFairPlayViolation(event);
    }

    /**
     * @private
     * @param {DragEvent} event 
     */
    _handleDragOver(event) {
        event.preventDefault();
    }
}
