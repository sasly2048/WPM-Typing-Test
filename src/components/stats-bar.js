import { createElement, html } from '../utils/dom.js';

export function createStatsBar() {
  const container = createElement('div', { className: 'stats-bar' });
  
  container.innerHTML = html`
    <div class="stat-card" aria-label="Words Per Minute">
      <div class="stat-label">WPM</div>
      <div class="stat-value" id="stat-wpm">0</div>
    </div>
    <div class="stat-card" aria-label="Accuracy">
      <div class="stat-label">ACC</div>
      <div class="stat-value" id="stat-acc">100%</div>
    </div>
    <div class="stat-card" aria-label="Characters">
      <div class="stat-label">CHARS</div>
      <div class="stat-value" id="stat-chars">0/0/0/0</div>
    </div>
    <div class="stat-card" aria-label="Time">
      <div class="stat-label">TIME</div>
      <div class="stat-value" id="stat-time">0s</div>
    </div>
  `;
  
  const update = ({ wpm, accuracy, chars, time }) => {
    if (wpm !== undefined) container.querySelector('#stat-wpm').textContent = Math.round(wpm);
    if (accuracy !== undefined) container.querySelector('#stat-acc').textContent = `${accuracy.toFixed(1)}%`;
    if (chars !== undefined) {
      // chars format: correct/incorrect/extra/missed
      const { correct = 0, incorrect = 0, extra = 0, missed = 0 } = chars;
      container.querySelector('#stat-chars').textContent = `${correct}/${incorrect}/${extra}/${missed}`;
    }
    if (time !== undefined) container.querySelector('#stat-time').textContent = `${time}s`;
  };
  
  return { el: container, update };
}
