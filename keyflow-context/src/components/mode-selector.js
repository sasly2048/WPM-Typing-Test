import { createElement, on } from '../utils/dom.js';
import { MODES, TIMER_DURATIONS, WORD_COUNTS } from '../constants/config.js';

const MODE_DEFS = [
  { id: MODES.PARAGRAPH, label: 'Paragraph', subKey: null },
  { id: MODES.TIME, label: 'Time', subKey: 'duration', subOptions: TIMER_DURATIONS },
  { id: MODES.WORDS, label: 'Words', subKey: 'wordCount', subOptions: WORD_COUNTS },
];

/**
 * Mode selector: switches practice mode and (where applicable) its sub-option
 * (duration for time, word count for words).
 *
 * @param {Object} opts
 * @param {string} [opts.activeMode]
 * @param {number} [opts.activeDuration]
 * @param {number} [opts.activeWordCount]
 * @param {Function} opts.onChange - called with { mode, duration, wordCount }
 */
export function createModeSelector({
  activeMode = MODES.PARAGRAPH,
  activeDuration = 30,
  activeWordCount = 50,
  onChange,
} = {}) {
  const container = createElement('div', { className: 'mode-selector' });

  let currentMode = activeMode;
  let currentDuration = activeDuration;
  let currentWordCount = activeWordCount;

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
  };

  render();

  return container;
}
