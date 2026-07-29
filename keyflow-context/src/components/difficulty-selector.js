import { createElement, on } from '../utils/dom.js';

export function createDifficultySelector({ difficulty = 'medium', onChange }) {
  const container = createElement('div', { className: 'difficulty-selector', role: 'radiogroup', 'aria-label': 'Difficulty' });

  const difficulties = [
    { id: 'easy', label: 'Easy' },
    { id: 'medium', label: 'Medium' },
    { id: 'hard', label: 'Hard' },
    { id: 'expert', label: 'Expert' }
  ];

  let currentDiff = difficulty;
  
  const render = () => {
    container.innerHTML = '';
    difficulties.forEach(diff => {
      const btn = createElement('button', {
        className: `diff-btn diff-${diff.id} ${currentDiff === diff.id ? 'active' : ''}`,
        role: 'radio',
        'aria-checked': currentDiff === diff.id,
        textContent: diff.label
      });
      on(btn, 'click', () => {
        if (currentDiff !== diff.id) {
          currentDiff = diff.id;
          render();
          if (onChange) onChange(currentDiff);
        }
      });
      container.appendChild(btn);
    });
  };
  
  render();
  
  return container;
}
