import { createElement, on } from '../utils/dom.js';
import { MODES, TIMER_DURATIONS, WORD_COUNTS } from '../constants/config.js';

const MODE_DEFS = [
  { id: MODES.PARAGRAPH, label: 'Paragraph', subKey: null },
  { id: MODES.TIME, label: 'Time', subKey: 'duration', subOptions: TIMER_DURATIONS },
  { id: MODES.WORDS, label: 'Words', subKey: 'wordCount', subOptions: WORD_COUNTS },
  { id: MODES.CUSTOM, label: 'Custom', subKey: null },
];

/**
 * Mode selector: switches practice mode and (where applicable) its sub-option
 * (duration for time, word count for words), plus punctuation/numbers
 * toggles for modes built from the word pool.
 *
 * @param {Object} opts
 * @param {string} [opts.activeMode]
 * @param {number} [opts.activeDuration]
 * @param {number} [opts.activeWordCount]
 * @param {boolean} [opts.punctuation]
 * @param {boolean} [opts.numbers]
 * @param {string} [opts.customText]
 * @param {Function} opts.onChange - called with { mode, duration, wordCount, punctuation, numbers, customText }
 */
export function createModeSelector({
  activeMode = MODES.PARAGRAPH,
  activeDuration = 30,
  activeWordCount = 50,
  punctuation = false,
  numbers = false,
  customText = '',
  onChange,
} = {}) {
  const container = createElement('div', { className: 'mode-selector' });

  let currentMode = activeMode;
  let currentDuration = activeDuration;
  let currentWordCount = activeWordCount;
  let currentPunctuation = punctuation;
  let currentNumbers = numbers;
  let currentCustomText = customText;

  const currentSubValue = (def) => {
    if (def.subKey === 'duration') return currentDuration;
    if (def.subKey === 'wordCount') return currentWordCount;
    return null;
  };

  const emitChange = () => {
    if (onChange) {
      onChange({
        mode: currentMode,
        duration: currentDuration,
        wordCount: currentWordCount,
        punctuation: currentPunctuation,
        numbers: currentNumbers,
        customText: currentCustomText,
      });
    }
  };

  const render = () => {
    container.innerHTML = '';

    const modeGroup = createElement('div', { className: 'mode-group', role: 'radiogroup', 'aria-label': 'Typing mode' });
    MODE_DEFS.forEach((def) => {
      const btn = createElement('button', {
        className: `mode-btn ${currentMode === def.id ? 'active' : ''}`,
        role: 'radio',
        'aria-checked': currentMode === def.id,
        textContent: def.label,
      });
      on(btn, 'click', () => {
        if (currentMode !== def.id) {
          currentMode = def.id;
          render();
          emitChange();
        }
      });
      modeGroup.appendChild(btn);
    });
    container.appendChild(modeGroup);

    const activeDef = MODE_DEFS.find((def) => def.id === currentMode);
    if (activeDef && activeDef.subOptions) {
      const subGroup = createElement('div', { className: 'sub-group', role: 'radiogroup', 'aria-label': `${currentMode} options` });
      activeDef.subOptions.forEach((sub) => {
        const btn = createElement('button', {
          className: `sub-btn ${currentSubValue(activeDef) === sub ? 'active' : ''}`,
          role: 'radio',
          'aria-checked': currentSubValue(activeDef) === sub,
          textContent: String(sub),
        });
        on(btn, 'click', () => {
          if (currentSubValue(activeDef) !== sub) {
            if (activeDef.subKey === 'duration') currentDuration = sub;
            if (activeDef.subKey === 'wordCount') currentWordCount = sub;
            render();
            emitChange();
          }
        });
        subGroup.appendChild(btn);
      });
      container.appendChild(subGroup);
    }

    if (currentMode === MODES.CUSTOM) {
      const customWrap = createElement('div', { className: 'custom-text-wrap' });
      const textarea = createElement('textarea', {
        className: 'custom-text-input',
        placeholder: 'Paste or type the text you want to practice on...',
        'aria-label': 'Custom practice text',
      });
      textarea.value = currentCustomText;
      const applyBtn = createElement('button', {
        className: 'sub-btn',
        textContent: 'Use this text',
      });
      on(applyBtn, 'click', () => {
        const value = textarea.value.trim();
        if (value) {
          currentCustomText = value;
          emitChange();
        }
      });
      customWrap.appendChild(textarea);
      customWrap.appendChild(applyBtn);
      container.appendChild(customWrap);
    }

    // Punctuation/numbers only make sense for the raw word-pool mode — Time
    // mode uses real prose paragraphs, which already read naturally.
    if (currentMode === MODES.WORDS) {
      const toggleGroup = createElement('div', { className: 'sub-group', role: 'group', 'aria-label': 'Content options' });

      const punctBtn = createElement('button', {
        className: `sub-btn ${currentPunctuation ? 'active' : ''}`,
        'aria-pressed': currentPunctuation,
        textContent: '. , ! Punctuation',
      });
      on(punctBtn, 'click', () => {
        currentPunctuation = !currentPunctuation;
        render();
        emitChange();
      });
      toggleGroup.appendChild(punctBtn);

      const numBtn = createElement('button', {
        className: `sub-btn ${currentNumbers ? 'active' : ''}`,
        'aria-pressed': currentNumbers,
        textContent: '# Numbers',
      });
      on(numBtn, 'click', () => {
        currentNumbers = !currentNumbers;
        render();
        emitChange();
      });
      toggleGroup.appendChild(numBtn);

      container.appendChild(toggleGroup);
    }
  };

  render();

  return container;
}
