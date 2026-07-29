import { $, createElement, html, on } from '../utils/dom.js';
import { fireConfetti } from '../components/confetti.js';
import { createLineChart, createBarChart, createRingChart } from '../components/chart.js';
import { getSessions, recordPersonalBest } from '../services/history.js';

const styles = `
.results-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 4rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  animation: fadeIn 0.5s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.results-hero {
  display: flex;
  justify-content: space-around;
  align-items: center;
  background: var(--color-bg-secondary);
  padding: 3rem;
  border-radius: 24px;
  border: 1px solid var(--color-border);
  box-shadow: 0 20px 40px -20px rgba(0,0,0,0.1);
}
.hero-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}
.hero-stat .label {
  font-size: 1.1rem;
  color: var(--color-text-secondary);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.hero-stat .value {
  font-size: 5rem;
  font-weight: 800;
  color: var(--color-accent);
  line-height: 1;
}

.results-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}
@media (max-width: 768px) {
  .results-details { grid-template-columns: 1fr; }
}
.chart-container, .breakdown-container {
  background: var(--color-bg-secondary);
  padding: 2rem;
  border-radius: 16px;
  border: 1px solid var(--color-border);
}
.chart-container h3, .breakdown-container h3 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  color: var(--color-text-primary);
}

.char-breakdown {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.breakdown-item {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.breakdown-label {
  width: 100px;
  color: var(--color-text-secondary);
}
.breakdown-bar-bg {
  flex: 1;
  height: 8px;
  background: var(--color-bg-tertiary);
  border-radius: 4px;
  overflow: hidden;
}
.breakdown-bar-fill {
  height: 100%;
  border-radius: 4px;
}
.fill-correct { background: var(--color-success); }
.fill-incorrect { background: var(--color-error); }
.fill-extra { background: var(--color-warning); }
.fill-missed { background: var(--color-text-muted); }
.breakdown-val {
  width: 40px;
  text-align: right;
  font-weight: 600;
}

.results-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
}
.pb-indicator {
  position: absolute;
  top: -15px;
  background: var(--color-accent);
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: bold;
  animation: bounce 1s infinite alternate;
}
@keyframes bounce { from { transform: translateY(0); } to { transform: translateY(-5px); } }
`;

let styleElement;

/** Helper: compute simple rating based on WPM and accuracy */
function computeRating(wpm, acc) {
  if (wpm >= 120 && acc >= 95) return 'S';
  if (wpm >= 100 && acc >= 92) return 'A';
  if (wpm >= 80 && acc >= 85) return 'B';
  return 'C';
}

export function render(container) {
  // Attach styles
  styleElement = document.createElement('style');
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);

  // Load session data
  const rawData = sessionStorage.getItem('lastSession');
  const session = rawData ? JSON.parse(rawData) : {};

  const netWpm = session.wpm || 0;
  const rawWpm = session.rawWpm || netWpm;
  const accuracy = session.accuracy !== undefined ? session.accuracy : 0;
  const consistency = session.consistency !== undefined ? session.consistency : '—';
  const timeSec = session.duration !== undefined ? session.duration : (session.time || 0);
  const timeLabel = typeof timeSec === 'number' ? `${Math.round(timeSec)}s` : timeSec;
  const errors = session.errors !== undefined ? session.errors : 0;
  const rating = session.rating || computeRating(netWpm, accuracy);

  // Personal best handling — keyed per mode + relevant config, so a 15s
  // sprint and a 60s test each track their own best instead of colliding.
  const isPersonalBest = recordPersonalBest(session.mode || 'default', {
    targetDuration: session.targetDuration,
    targetWordCount: session.targetWordCount,
  }, netWpm);

  // Session is already persisted by practice.js's endSession() before navigating
  // here — do not save again, or every completed test gets double-counted.

  const totalChars = session.chars ? (session.chars.correct + session.chars.incorrect + session.chars.extra + session.chars.missed) : 0;
  const chars = session.chars || { correct: 0, incorrect: 0, extra: 0, missed: 0 };

  container.innerHTML = html`
    <main id="main-content" class="results-page">
      <div class="results-hero" role="status" aria-live="polite" aria-atomic="true">
        ${isPersonalBest ? '<div class="pb-indicator">⭐ New Personal Best!</div>' : ''}
        <div class="hero-stat"><span class="label">WPM</span><span class="value" id="wpm-counter">0</span></div>
        <div class="hero-stat"><span class="label">Accuracy</span><span class="value" id="acc-counter">0%</span></div>
        <div class="hero-stat"><span class="label">Consistency</span><span class="value" id="consistency-counter">${consistency}%</span></div>
      </div>

      <div class="summary-section" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-top: 2rem;">
        <div class="hero-stat"><span class="label">Net WPM</span><span class="value" id="net-wpm-counter">${netWpm}</span></div>
        <div class="hero-stat"><span class="label">Raw WPM</span><span class="value" id="raw-wpm-counter">${rawWpm}</span></div>
        <div class="hero-stat"><span class="label">Time</span><span class="value" id="time-counter">${timeLabel}</span></div>
        <div class="hero-stat"><span class="label">Errors</span><span class="value" id="errors-counter">${errors}</span></div>
        <div class="hero-stat"><span class="label">Rating</span><span class="value" id="rating-counter">${rating}</span></div>
      </div>

      <div class="results-details" style="margin-top: 3rem;">
          <div class="chart-container" id="wpm-chart-container">
            <h3>WPM Over Time</h3>
            <div class="chart-placeholder" style="height:200px; display:flex; align-items:center; justify-content:center; color: var(--color-text-muted);">Loading…</div>
          </div>
          <div class="chart-container" id="accuracy-chart-container">
            <h3>Accuracy Over Time</h3>
            <div class="chart-placeholder" style="height:200px; display:flex; align-items:center; justify-content:center; color: var(--color-text-muted);">Loading…</div>
          </div>
        <div class="breakdown-container">
          <h3>Character Breakdown</h3>
          <div class="char-breakdown">
            <div class="breakdown-item"><span class="breakdown-label">Correct</span><div class="breakdown-bar-bg"><div class="breakdown-bar-fill fill-correct" style="width: ${(chars.correct/totalChars)*100}%"></div></div><span class="breakdown-val">${chars.correct}</span></div>
            <div class="breakdown-item"><span class="breakdown-label">Incorrect</span><div class="breakdown-bar-bg"><div class="breakdown-bar-fill fill-incorrect" style="width: ${(chars.incorrect/totalChars)*100}%"></div></div><span class="breakdown-val">${chars.incorrect}</span></div>
            <div class="breakdown-item"><span class="breakdown-label">Extra</span><div class="breakdown-bar-bg"><div class="breakdown-bar-fill fill-extra" style="width: ${(chars.extra/totalChars)*100}%"></div></div><span class="breakdown-val">${chars.extra}</span></div>
            <div class="breakdown-item"><span class="breakdown-label">Missed</span><div class="breakdown-bar-bg"><div class="breakdown-bar-fill fill-missed" style="width: ${(chars.missed/totalChars)*100}%"></div></div><span class="breakdown-val">${chars.missed}</span></div>
          </div>
        </div>
      </div>

      <div class="analysis-section" style="margin-top: 3rem;">
        <h3>Error Analysis</h3>
        <p style="color: var(--color-text-secondary);" id="error-analysis-text">Analyzing...</p>
      </div>

      <div class="progress-section" style="margin-top: 3rem;">
        <h3>Progress</h3>
        <p style="color: var(--color-text-secondary);" id="progress-text">Loading progress...</p>
      </div>

      <div class="next-step-section" style="margin-top: 3rem; text-align: center;">
        <h3>What Next?</h3>
        <div class="results-actions" style="justify-content: center;">
          <button class="btn btn-secondary" id="btn-retry">↻ Retry</button>
          <button class="btn btn-secondary" id="btn-practice-weak">Practice Weak Keys</button>
          <a href="#/typing" class="btn btn-primary">Next Test →</a>
          <button class="btn btn-secondary" id="btn-share">📤 Share</button>
        </div>
      </div>
    </main>
  `;

  // Counter animation helper
  const animateCounter = (selector, target, formatter) => {
    const el = container.querySelector(selector);
    if (!el) return;
    let start = null;
    const duration = 800;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const value = Math.round(target * ease);
      el.textContent = formatter(value);
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = formatter(target);
    };
    requestAnimationFrame(step);
  };

  animateCounter('#wpm-counter', netWpm, (v) => v);
  animateCounter('#acc-counter', accuracy, (v) => `${v}%`);
  if (typeof consistency === 'number') {
    animateCounter('#consistency-counter', consistency, (v) => `${v}%`);
  }

  // Charts and analysis, deferred slightly so the counter animation starts first
  setTimeout(() => {
    const history = getSessions();

    if (history.length > 1) {
      const wpmData = history.map(s => s.wpm);
      const chart = createLineChart({ data: wpmData, label: 'WPM', width: 400, height: 200 });
      const containerEl = container.querySelector('#wpm-chart-container');
      if (containerEl) {
        const placeholder = containerEl.querySelector('.chart-placeholder');
        if (placeholder) placeholder.remove();
        containerEl.appendChild(chart);
      }

      const accuracyContainer = container.querySelector('#accuracy-chart-container');
      if (accuracyContainer) {
        const placeholder = accuracyContainer.querySelector('.chart-placeholder');
        if (placeholder) placeholder.remove();
        const accData = history.map(s => s.accuracy);
        const accChart = createLineChart({ data: accData, label: 'Accuracy', width: 400, height: 200 });
        accuracyContainer.appendChild(accChart);
      }
    } else {
      const wpmPlaceholder = container.querySelector('#wpm-chart-container .chart-placeholder');
      if (wpmPlaceholder) wpmPlaceholder.textContent = 'Not enough data for chart.';
      const accPlaceholder = container.querySelector('#accuracy-chart-container .chart-placeholder');
      if (accPlaceholder) accPlaceholder.textContent = 'Not enough data for chart.';
    }

    // Error analysis text
    const errorEl = container.querySelector('#error-analysis-text');
    if (errorEl) {
      const parts = [];
      if (chars.incorrect) parts.push(`${chars.incorrect} incorrect keystrokes`);
      if (chars.extra) parts.push(`${chars.extra} extra characters`);
      if (chars.missed) parts.push(`${chars.missed} missed characters`);
      errorEl.textContent = parts.length ? parts.join(', ') + '.' : 'Great job! No notable errors.';
    }

    // Progress comparison
    const progressEl = container.querySelector('#progress-text');
    if (progressEl) {
      if (history.length > 1) {
        const last = history[history.length - 2];
        const diffWpm = netWpm - last.wpm;
        const diffAcc = accuracy - last.accuracy;
        progressEl.textContent = `WPM ${diffWpm >= 0 ? '+' : ''}${diffWpm}, Accuracy ${diffAcc >= 0 ? '+' : ''}${diffAcc.toFixed(1)}% compared to previous session.`;
      } else {
        progressEl.textContent = 'This is your first recorded session.';
      }
    }
  }, 120);

  // Action listeners
  container.querySelector('#btn-retry').addEventListener('click', () => {
    window.location.hash = '#/typing?retry=true';
  });
  const practiceWeakBtn = container.querySelector('#btn-practice-weak');
  if (practiceWeakBtn) {
    practiceWeakBtn.addEventListener('click', () => {
      window.location.hash = '#/typing?mode=weak-keys';
    });
  }
  container.querySelector('#btn-share').addEventListener('click', () => {
    const text = `KeyFlow - ${netWpm} WPM | ${accuracy}% Acc\nhttps://keyflow.app`;
    navigator.clipboard.writeText(text).then(() => {
      const btn = container.querySelector('#btn-share');
      const original = btn.textContent;
      btn.textContent = '✓ Copied!';
      setTimeout(() => btn.textContent = original, 2000);
    });
  });
}

export function destroy() {
  if (styleElement && styleElement.parentNode) styleElement.parentNode.removeChild(styleElement);
}
