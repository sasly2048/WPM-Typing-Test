import { $, createElement, html } from '../utils/dom.js';
import { getSessions, getStats } from '../services/history.js';

const styles = `
.dashboard-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem 5rem;
  color: var(--color-text-primary);
}

.dashboard-header {
  margin-bottom: 3rem;
}

.dashboard-title {
  font-size: 2.5rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  background: linear-gradient(135deg, var(--color-text-primary) 0%, var(--color-accent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 0.5rem;
}

.dashboard-subtitle {
  color: var(--color-text-secondary);
  font-size: 1.1rem;
}

.dashboard-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.25rem;
  margin-bottom: 2.5rem;
}

.stat-card-elevated {
  background: var(--surface-2);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.875rem;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  transition: transform 0.2s var(--ease-apple), border-color 0.2s;
}

.stat-card-elevated:hover {
  transform: translateY(-4px);
  border-color: rgba(240, 169, 104, 0.3);
}

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--color-text-secondary);
  font-size: 0.85rem;
  font-weight: 600;
}

.stat-value {
  font-size: 2.25rem;
  font-weight: 900;
  color: var(--color-text-primary);
  line-height: 1.1;
}

.stat-subtext {
  font-size: 0.8rem;
  color: var(--color-success);
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.insights-row {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 1.5rem;
  margin-bottom: 2.5rem;
}

@media (max-width: 900px) {
  .insights-row { grid-template-columns: 1fr; }
}

.focus-score-card {
  background: var(--surface-2);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.875rem;
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.gauge-circle {
  width: 130px;
  height: 130px;
  border-radius: 50%;
  background: conic-gradient(var(--color-accent) 0% 85%, rgba(255,255,255,0.05) 85% 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 1.25rem 0;
}

.gauge-inner {
  width: 106px;
  height: 106px;
  border-radius: 50%;
  background: var(--surface-2);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.gauge-val {
  font-size: 2rem;
  font-weight: 900;
  color: var(--color-accent);
}

.weak-keys-card {
  background: var(--surface-2);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.875rem;
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.weak-keys-list {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.weak-key-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.85rem;
  background: rgba(255, 59, 48, 0.1);
  border: 1px solid rgba(255, 59, 48, 0.3);
  border-radius: 0.5rem;
  color: var(--color-error);
  font-family: var(--font-mono);
  font-weight: 700;
}

.empty-dashboard-card {
  background: var(--surface-2);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1rem;
  padding: 4rem 2rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}
`;

export function render(container) {
  const styleEl = document.createElement('style');
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);

  const stats = getStats();
  const sessions = getSessions();
  const hasSessions = sessions && sessions.length > 0;

  if (!hasSessions) {
    container.innerHTML = html`
      <div class="dashboard-page">
        <header class="dashboard-header">
          <h1 class="dashboard-title">Performance Insights</h1>
          <p class="dashboard-subtitle">Real-time metrics, pause timelines, and character heatmaps.</p>
        </header>

        <div class="empty-dashboard-card">
          <i aria-hidden="true" data-lucide="bar-chart-3" size="48" style="color: var(--color-accent)"></i>
          <h2 style="font-size: 1.5rem; font-weight: 800; margin: 0;">No Practice History Yet</h2>
          <p style="color: #9a9a9a; max-width: 480px; margin: 0 auto 1rem;">Complete your first typing session in Practice or Developer Workspace to unlock your analytics and keyboard heatmaps.</p>
          <a href="#/practice" class="btn btn-ember" style="padding: 0.85rem 2rem; font-size: 1rem;">Start Practice Session</a>
        </div>
      </div>
    `;
  } else {
    container.innerHTML = html`
      <div class="dashboard-page">
        <header class="dashboard-header">
          <h1 class="dashboard-title">Performance Insights</h1>
          <p class="dashboard-subtitle">Deep analytics, finger heatmaps, and focus score tracking.</p>
        </header>

        <section class="dashboard-overview">
          <div class="stat-card-elevated">
            <div class="stat-header">
              <span>Average WPM</span>
              <i aria-hidden="true" data-lucide="zap" size="18" style="color: var(--color-accent)"></i>
            </div>
            <div class="stat-value">${Math.round(stats.avgWpm || 0)}</div>
            <div class="stat-subtext"><i aria-hidden="true" data-lucide="activity" size="14"></i> Across ${stats.totalTests} sessions</div>
          </div>

          <div class="stat-card-elevated">
            <div class="stat-header">
              <span>Personal Best</span>
              <i aria-hidden="true" data-lucide="trophy" size="18" style="color: var(--color-success)"></i>
            </div>
            <div class="stat-value">${Math.round(stats.bestWpm || 0)}</div>
            <div class="stat-subtext">Peak speed reached</div>
          </div>

          <div class="stat-card-elevated">
            <div class="stat-header">
              <span>Accuracy Index</span>
              <i aria-hidden="true" data-lucide="target" size="18" style="color: var(--color-info)"></i>
            </div>
            <div class="stat-value">${(stats.avgAccuracy || 0).toFixed(1)}%</div>
            <div class="stat-subtext">Precision rating</div>
          </div>

          <div class="stat-card-elevated">
            <div class="stat-header">
              <span>Total Practice</span>
              <i aria-hidden="true" data-lucide="clock" size="18" style="color: var(--color-accent)"></i>
            </div>
            <div class="stat-value">${Math.round((stats.totalTime || 0) / 60)}m</div>
            <div class="stat-subtext">${stats.totalTests} total sessions</div>
          </div>

          <div class="stat-card-elevated">
            <div class="stat-header">
              <span>Day Streak</span>
              <i aria-hidden="true" data-lucide="flame" size="18" style="color: var(--color-error)"></i>
            </div>
            <div class="stat-value">${stats.currentStreak || 0}</div>
            <div class="stat-subtext">Best: ${stats.bestStreak || 0} days</div>
          </div>
        </section>

        <section class="insights-row">
          <div class="focus-score-card">
            <h3 style="font-size: 1.1rem; font-weight: 700;">Focus Index</h3>
            <div class="gauge-circle">
              <div class="gauge-inner">
                <span class="gauge-val">${stats.focusIndex === null ? '—' : stats.focusIndex}</span>
                <span style="font-size: 0.75rem; color: #9a9a9a;">/ 100</span>
              </div>
            </div>
            <p style="font-size: 0.85rem; color: #9a9a9a;">${stats.focusIndex === null ? 'Complete a test to start tracking pause-free execution.' : 'Derived from mid-session pause frequency across your recent tests.'}</p>
          </div>

          <div class="weak-keys-card">
            <h3 style="font-size: 1.1rem; font-weight: 700; display: flex; align-items: center; gap: 0.5rem;">
              <i aria-hidden="true" data-lucide="code-2" style="color: var(--color-accent)" size="18"></i> Target Practice Recommendations
            </h3>
            <p style="font-size: 0.85rem; color: #9a9a9a;">Practice special syntax characters in Developer Workspace to increase overall code speed:</p>
            <div class="weak-keys-list">
              <div class="weak-key-badge"><span>{ }</span> <span>Brackets</span></div>
              <div class="weak-key-badge"><span>( )</span> <span>Params</span></div>
              <div class="weak-key-badge"><span>=&gt;</span> <span>Arrows</span></div>
              <div class="weak-key-badge"><span>;</span> <span>Semicolons</span></div>
            </div>
            <a href="#/developer" class="btn btn-ember" style="margin-top: auto; padding: 0.6rem 1.25rem; font-size: 0.85rem; align-self: flex-start;">Open Developer Workspace</a>
          </div>
        </section>
      </div>
    `;
  }

  setTimeout(() => {
    if (window.lucide) window.lucide.createIcons();
  }, 20);

  container.dataset.destroy = () => {
    if (styleEl && styleEl.parentNode) styleEl.parentNode.removeChild(styleEl);
  };
}

export function destroy(container) {
  if (container.dataset.destroy) container.dataset.destroy();
}
