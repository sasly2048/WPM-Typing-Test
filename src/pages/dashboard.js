/**
 * Dashboard — progress over time.
 *
 * Answers, in order: how fast am I, am I improving, how consistent am I, and
 * where am I losing accuracy. Filters are stateful within the page so the
 * whole view can be scoped to a mode or window without a reload.
 */

import { html } from '../utils/dom.js';
import { getSessions, getStreakInfo, getHeatmapData } from '../services/history.js';
import { createLineChart, createHeatmap } from '../components/chart.js';

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const RANGES = [
  { id: '7',   label: '7 days',  days: 7 },
  { id: '30',  label: '30 days', days: 30 },
  { id: 'all', label: 'All',     days: null },
];

function formatDuration(seconds) {
  if (!seconds) return '0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h ? `${h}h ${m}m` : `${m}m`;
}

/** Mean WPM of the first vs last third — a trend that ignores single outliers. */
function trend(sessions) {
  if (sessions.length < 6) return null;
  const third = Math.floor(sessions.length / 3);
  const mean = (arr) => arr.reduce((s, x) => s + (x.wpm || 0), 0) / arr.length;
  const early = mean(sessions.slice(0, third));
  const late = mean(sessions.slice(-third));
  if (!early) return null;
  return { delta: late - early, pct: ((late - early) / early) * 100 };
}

export function render(container) {
  let range = 'all';
  let mode = 'all';

  const allSessions = getSessions() || [];

  if (!allSessions.length) {
    container.innerHTML = html`
      <div class="page">
        <header class="page-header">
          <div>
            <h1 class="page-header__title">Dashboard</h1>
            <p class="page-header__desc">Your typing progress over time.</p>
          </div>
        </header>
        <div class="empty-state">
          <i class="empty-state__icon" data-lucide="line-chart"></i>
          <h2 class="empty-state__title">No sessions recorded</h2>
          <p class="empty-state__desc">
            Complete a typing test and your speed, accuracy and consistency will be tracked here.
          </p>
          <a href="#/practice" class="btn btn-primary">Start your first test</a>
        </div>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  const modes = ['all', ...new Set(allSessions.map((s) => s.mode).filter(Boolean))];

  container.innerHTML = html`
    <div class="page dashboard">
      <header class="page-header">
        <div>
          <h1 class="page-header__title">Dashboard</h1>
          <p class="page-header__desc">Your typing progress over time.</p>
        </div>
        <div class="page-header__actions">
          <div class="segmented" role="tablist" aria-label="Time range">
            ${RANGES.map((r) => `
              <button class="segmented__item ${r.id === range ? 'active' : ''}"
                      role="tab" data-range="${r.id}"
                      aria-selected="${r.id === range}">${r.label}</button>
            `).join('')}
          </div>
        </div>
      </header>

      <div class="dashboard__filters">
        <div class="segmented" role="tablist" aria-label="Mode filter">
          ${modes.map((m) => `
            <button class="segmented__item ${m === mode ? 'active' : ''}"
                    role="tab" data-mode="${esc(m)}"
                    aria-selected="${m === mode}">${esc(m === 'all' ? 'All modes' : m)}</button>
          `).join('')}
        </div>
      </div>

      <div class="stat-grid" id="dash-stats"></div>

      <section class="section">
        <div class="chart-card">
          <div class="chart-card__header">
            <h2 class="card__title">Speed over time</h2>
            <div class="chart-legend">
              <span class="chart-legend__item">
                <span class="chart-legend__swatch" style="background:var(--color-chart-wpm)"></span> WPM
              </span>
            </div>
          </div>
          <div id="dash-wpm-chart"></div>
        </div>
      </section>

      <div class="grid grid--2">
        <section class="chart-card">
          <div class="chart-card__header">
            <h2 class="card__title">Accuracy</h2>
            <div class="chart-legend">
              <span class="chart-legend__item">
                <span class="chart-legend__swatch" style="background:var(--color-chart-accuracy)"></span> %
              </span>
            </div>
          </div>
          <div id="dash-acc-chart"></div>
        </section>

        <section class="chart-card">
          <div class="chart-card__header">
            <h2 class="card__title">Consistency</h2>
            <div class="chart-legend">
              <span class="chart-legend__item">
                <span class="chart-legend__swatch" style="background:var(--color-chart-consistency)"></span> %
              </span>
            </div>
          </div>
          <div id="dash-cons-chart"></div>
        </section>
      </div>

      <section class="section">
        <div class="chart-card">
          <div class="chart-card__header">
            <h2 class="card__title">Activity</h2>
            <span style="font-size:var(--text-xs);color:var(--color-text-tertiary)">Last 26 weeks</span>
          </div>
          <div id="dash-heatmap"></div>
        </div>
      </section>

      <section class="section">
        <h2 class="section__label">Recent sessions</h2>
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>When</th><th>Mode</th>
                <th class="num">WPM</th><th class="num">Accuracy</th>
                <th class="num">Consistency</th><th class="num">Errors</th>
              </tr>
            </thead>
            <tbody id="dash-rows"></tbody>
          </table>
        </div>
      </section>
    </div>
  `;

  /* ── rendering ───────────────────────────────────────────────────────── */

  function filtered() {
    const days = RANGES.find((r) => r.id === range)?.days;
    const cutoff = days ? Date.now() - days * 86400000 : 0;
    return allSessions.filter(
      (s) => (!cutoff || s.timestamp >= cutoff) && (mode === 'all' || s.mode === mode)
    );
  }

  function paint() {
    const sessions = filtered();
    const statsEl = container.querySelector('#dash-stats');

    if (!sessions.length) {
      statsEl.innerHTML = '';
      ['#dash-wpm-chart', '#dash-acc-chart', '#dash-cons-chart'].forEach((sel) => {
        container.querySelector(sel).innerHTML =
          '<div class="chart-empty">No sessions match this filter.</div>';
      });
      container.querySelector('#dash-rows').innerHTML =
        '<tr><td colspan="6" class="table__empty">No sessions match this filter.</td></tr>';
      return;
    }

    const best = Math.max(...sessions.map((s) => s.wpm || 0));
    const avg = sessions.reduce((sum, s) => sum + (s.wpm || 0), 0) / sessions.length;
    const avgAcc = sessions.reduce((sum, s) => sum + (s.accuracy || 0), 0) / sessions.length;
    const totalTime = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const streak = getStreakInfo();
    const t = trend(sessions);

    statsEl.innerHTML = `
      <div class="stat-card">
        <div class="stat">
          <span class="stat__label">Best</span>
          <span class="stat__value">${Math.round(best)}<span class="stat__unit">wpm</span></span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat">
          <span class="stat__label">Average</span>
          <span class="stat__value">${Math.round(avg)}<span class="stat__unit">wpm</span></span>
          ${t ? `<span class="stat__delta stat__delta--${t.delta >= 0 ? 'up' : 'down'}">${t.delta >= 0 ? '▲' : '▼'} ${Math.abs(t.pct).toFixed(1)}% vs earlier</span>` : ''}
        </div>
      </div>
      <div class="stat-card">
        <div class="stat">
          <span class="stat__label">Accuracy</span>
          <span class="stat__value">${avgAcc.toFixed(1)}<span class="stat__unit">%</span></span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat">
          <span class="stat__label">Tests</span>
          <span class="stat__value">${sessions.length}</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat">
          <span class="stat__label">Time practised</span>
          <span class="stat__value">${formatDuration(totalTime)}</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat">
          <span class="stat__label">Streak</span>
          <span class="stat__value">${streak.currentStreak}<span class="stat__unit">days</span></span>
        </div>
      </div>
    `;

    const label = (s) =>
      new Date(s.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

    const charts = [
      ['#dash-wpm-chart',  sessions.map((s) => Math.round(s.wpm || 0)),           'WPM',         'var(--color-chart-wpm)'],
      ['#dash-acc-chart',  sessions.map((s) => Math.round(s.accuracy || 0)),      'Accuracy',    'var(--color-chart-accuracy)'],
      ['#dash-cons-chart', sessions.map((s) => Math.round(s.consistency ?? 100)), 'Consistency', 'var(--color-chart-consistency)'],
    ];

    for (const [sel, data, name, color] of charts) {
      const host = container.querySelector(sel);
      host.innerHTML = '';
      host.appendChild(createLineChart({ data, label: name, color, xLabels: sessions.map(label) }));
    }

    container.querySelector('#dash-rows').innerHTML = sessions
      .slice(-15).reverse()
      .map((s) => `
        <tr>
          <td>${new Date(s.timestamp).toLocaleString(undefined, {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
          })}</td>
          <td>${esc(s.language || s.mode || '—')}</td>
          <td class="num">${Math.round(s.wpm || 0)}</td>
          <td class="num">${(s.accuracy || 0).toFixed(1)}%</td>
          <td class="num">${s.consistency != null ? `${s.consistency}%` : '—'}</td>
          <td class="num">${s.errors ?? 0}</td>
        </tr>
      `).join('');
  }

  container.querySelector('#dash-heatmap').appendChild(
    createHeatmap({ days: getHeatmapData() })
  );

  const wireFilter = (attr, set) => {
    container.querySelectorAll(`[${attr}]`).forEach((btn) => {
      btn.addEventListener('click', () => {
        set(btn.dataset[attr === 'data-range' ? 'range' : 'mode']);
        container.querySelectorAll(`[${attr}]`).forEach((b) => {
          const on = b === btn;
          b.classList.toggle('active', on);
          b.setAttribute('aria-selected', String(on));
        });
        paint();
      });
    });
  };

  wireFilter('data-range', (v) => { range = v; });
  wireFilter('data-mode', (v) => { mode = v; });

  paint();
  if (window.lucide) window.lucide.createIcons();
}

export function destroy() {}
