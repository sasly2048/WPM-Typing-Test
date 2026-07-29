/* src/components/developerPanel.js */
import { html } from '../utils/dom.js';
import { createLineChart, createRingChart } from './chart.js';
import { getTopWeakKeys } from '../utils/recommendationEngine.js';

/**
 * Creates a dockable developer panel on the right side of the given container.
 * The panel is collapsible, resizable (via CSS `resize: horizontal`) and updates
 * live using the diagnostics subscription.
 *
 * @param {Object} options
 * @param {HTMLElement} options.container - Root element to attach the panel to.
 * @param {Object} options.diagnostics - Instance returned by initDiagnostics().
 */
export function createDeveloperPanel({ container, diagnostics }) {
  // Panel element
  const panel = document.createElement('div');
  panel.className = 'dev-panel';
  panel.setAttribute('role', 'region');
  panel.setAttribute('aria-label', 'Developer Diagnostics');
  panel.setAttribute('tabindex', '0');

  // Styles (only injected once)
  const style = document.createElement('style');
  style.textContent = `
    .dev-panel {
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      width: 300px;
      max-width: 500px;
      min-width: 200px;
      background: var(--color-bg-secondary, rgba(20,20,20,0.95));
      color: var(--color-text-primary);
      font-family: var(--font-mono, 'JetBrains Mono', monospace);
      overflow-y: auto;
      padding: 0.75rem;
      box-shadow: -2px 0 8px rgba(0,0,0,0.3);
      resize: horizontal;
      display: flex;
      flex-direction: column;
      transition: transform 0.2s ease;
      z-index: 1000;
    }
    .dev-panel.collapsed { transform: translateX(100%); }
    .dev-panel .dev-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
    .dev-panel .dev-section { margin-bottom: 1rem; }
    .dev-panel .dev-section h3 { margin: 0 0 0.25rem; font-size: 0.9rem; font-weight: 600; }
    .dev-toggle-btn { background:none; border:none; color:inherit; cursor:pointer; }
    .dev-toggle-btn:hover { opacity:0.8; }
    .dev-panel :focus { outline: 2px solid var(--color-accent, #0ff); }
  `;
  document.head.appendChild(style);

  // Header with collapse button
  const header = html`<div class="dev-header"><strong>Developer Mode</strong><button class="dev-toggle-btn" aria-label="Collapse panel">✕</button></div>`;
  panel.appendChild(header);

  const sections = document.createElement('div');
  panel.appendChild(sections);

  const live = html`<div class="dev-section" id="dev-live"><h3>Live Performance</h3><div id="dev-live-content" aria-live="polite"></div></div>`;
  const kb = html`<div class="dev-section" id="dev-kb"><h3>Keyboard Analytics</h3><ul id="dev-weak-keys"></ul></div>`;
  const sess = html`<div class="dev-section" id="dev-sess"><h3>Session Diagnostics</h3><pre id="dev-session-json"></pre></div>`;
  const eng = html`<div class="dev-section" id="dev-eng"><h3>Engine Diagnostics</h3><pre id="dev-engine-info"></pre></div>`;
  const charts = html`<div class="dev-section" id="dev-charts"><h3>Charts</h3><div id="dev-latency-chart"></div></div>`;

  sections.append(live, kb, sess, eng, charts);

  container.appendChild(panel);

  // Collapse toggle
const toggleBtn = header.querySelector('.dev-toggle-btn');
// Initialize ARIA expanded state
toggleBtn.setAttribute('aria-expanded', 'true');

toggleBtn.addEventListener('click', () => {
  const collapsed = panel.classList.toggle('collapsed');
  toggleBtn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
});

// Escape key to collapse panel
panel.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !panel.classList.contains('collapsed')) {
    panel.classList.add('collapsed');
    toggleBtn.setAttribute('aria-expanded', 'false');
    toggleBtn.focus();
  }
});

  // Update function
  let chartRendered = false;
  function update(snapshot) {
    const { live: liveData, lastSession } = snapshot;
    // Live performance
    const liveContent = live.querySelector('#dev-live-content');
    const consistency = liveData.wpmSamples && liveData.wpmSamples.length > 1
      ? Math.round(liveData.wpmSamples.reduce((a,b)=>a+b,0)/liveData.wpmSamples.length)
      : liveData.wpm;
    liveContent.innerHTML = `WPM: ${liveData.wpm}<br>Raw WPM: ${liveData.rawWpm}<br>Acc: ${liveData.accuracy}%<br>Elapsed: ${liveData.elapsed.toFixed(1)}s<br>Consistency: ${consistency}`;
    // Weak keys (top 5)
    const weakList = kb.querySelector('#dev-weak-keys');
    const topWeak = getTopWeakKeys(5);
    weakList.innerHTML = topWeak.map(k => `<li>${k.key.toUpperCase()}: ${k.errors} errors (${k.accuracy}% acc)</li>`).join('');
    // Session diagnostics (show summary JSON with derived fields)
    sess.querySelector('#dev-session-json').textContent = lastSession ? JSON.stringify(lastSession, null, 2) : 'No completed session yet.';
    // Engine diagnostics
    const theme = document.body.dataset.theme || 'default';
    const layout = document.body.dataset.layout || 'none';
    const mode = lastSession?.mode || 'unknown';
    const difficulty = lastSession?.difficulty || 'unknown';
    const telemetryVersion = '1.0';
    eng.querySelector('#dev-engine-info').textContent = `Theme: ${theme}\nLayout: ${layout}\nMode: ${mode}\nDifficulty: ${difficulty}\nTelemetry v${telemetryVersion}`;
    // Charts – latency line chart (throttled)
    if (!chartRendered || liveData.keystrokeLog.length % 20 === 0) {
      const latData = liveData.keystrokeLog.map(k => k.elapsed);
      const chartContainer = charts.querySelector('#dev-latency-chart');
      chartContainer.innerHTML = '';
      if (latData.length > 1) {
        const chartEl = createLineChart({ data: latData, width: 260, height: 120, label: 'Latency (ms)' });
        chartContainer.appendChild(chartEl);
      }
      chartRendered = true;
    }
  }

  const unsubscribe = diagnostics.subscribe(update);

  return {
    destroy() {
      panel.remove();
      unsubscribe();
      if (style.parentNode) style.parentNode.removeChild(style);
    },
  };
}
