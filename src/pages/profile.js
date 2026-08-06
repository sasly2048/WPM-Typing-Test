/**
 * Profile — identity plus a lifetime summary.
 *
 * Works signed-out: a guest still has local history worth showing, so this
 * page never gates the statistics behind an account.
 */

import { html } from '../utils/dom.js';
import { getStats, getSessions, getStreakInfo } from '../services/history.js';
import { getCurrentUser, signOut } from '../services/auth.js';
import { createLineChart } from '../components/chart.js';

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function formatDuration(seconds) {
  if (!seconds) return '0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h ? `${h}h ${m}m` : `${m}m`;
}

/** Speed band, so a number has a reference point. */
function tier(wpm) {
  if (wpm >= 120) return { label: 'Elite',        hint: 'Top-tier professional speed.' };
  if (wpm >= 90)  return { label: 'Advanced',     hint: 'Well above professional average.' };
  if (wpm >= 65)  return { label: 'Proficient',   hint: 'Comfortably above average.' };
  if (wpm >= 45)  return { label: 'Intermediate', hint: 'Around the typical office pace.' };
  if (wpm > 0)    return { label: 'Developing',   hint: 'Building fundamentals.' };
  return { label: 'Unranked', hint: 'Complete a test to get ranked.' };
}

export function render(container) {
  const user = getCurrentUser();
  const stats = getStats();
  const sessions = getSessions() || [];
  const streak = getStreakInfo();
  const t = tier(stats.bestWpm);

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Guest';
  const initial = displayName.charAt(0).toUpperCase();

  container.innerHTML = html`
    <div class="page page--narrow profile">
      <header class="profile__header card">
        <div class="profile__avatar" aria-hidden="true">${esc(initial)}</div>
        <div class="profile__identity">
          <h1 class="profile__name">${esc(displayName)}</h1>
          <p class="profile__email">${esc(user?.email || 'Playing as a guest — progress is saved to this browser only.')}</p>
          <div class="profile__tags">
            <span class="badge badge--accent">${esc(t.label)}</span>
            <span class="badge">${stats.totalTests} tests</span>
            ${streak.currentStreak > 0 ? `<span class="badge">${streak.currentStreak}-day streak</span>` : ''}
          </div>
        </div>
        <div class="profile__actions">
          ${user
            ? '<button class="btn btn-secondary" id="profile-signout"><i data-lucide="log-out"></i> Sign out</button>'
            : '<a href="#/auth" class="btn btn-primary">Sign in to sync</a>'}
        </div>
      </header>

      <p class="profile__tier-hint">${esc(t.hint)}</p>

      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat">
            <span class="stat__label">Best speed</span>
            <span class="stat__value">${Math.round(stats.bestWpm)}<span class="stat__unit">wpm</span></span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat">
            <span class="stat__label">Average speed</span>
            <span class="stat__value">${Math.round(stats.avgWpm)}<span class="stat__unit">wpm</span></span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat">
            <span class="stat__label">Accuracy</span>
            <span class="stat__value">${stats.avgAccuracy.toFixed(1)}<span class="stat__unit">%</span></span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat">
            <span class="stat__label">Time practised</span>
            <span class="stat__value">${formatDuration(stats.totalTime)}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat">
            <span class="stat__label">Longest streak</span>
            <span class="stat__value">${stats.bestStreak}<span class="stat__unit">days</span></span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat">
            <span class="stat__label">Focus index</span>
            <span class="stat__value">${stats.focusIndex ?? '—'}${stats.focusIndex != null ? '<span class="stat__unit">/100</span>' : ''}</span>
          </div>
        </div>
      </div>

      ${sessions.length >= 2 ? `
        <section class="section">
          <div class="chart-card">
            <div class="chart-card__header">
              <h2 class="card__title">Speed history</h2>
            </div>
            <div id="profile-chart"></div>
          </div>
        </section>
      ` : ''}

      <section class="section">
        <h2 class="section__label">Account</h2>
        <div class="card">
          <div class="setting-row">
            <div class="setting-row__text">
              <div class="setting-row__title">Manage your data</div>
              <div class="setting-row__desc">Export, import or reset your history.</div>
            </div>
            <div class="setting-row__control">
              <a href="#/settings" class="btn btn-secondary">Open settings</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;

  const chartHost = container.querySelector('#profile-chart');
  if (chartHost) {
    const recent = sessions.slice(-30);
    chartHost.appendChild(createLineChart({
      data: recent.map((s) => Math.round(s.wpm || 0)),
      xLabels: recent.map((s) =>
        new Date(s.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      ),
      label: 'WPM',
      color: 'var(--color-chart-wpm)',
    }));
  }

  container.querySelector('#profile-signout')?.addEventListener('click', async () => {
    try {
      await signOut();
      window.location.hash = '#/';
    } catch {
      // onAuthChange in main.js reconciles UI state either way.
    }
  });

  if (window.lucide) window.lucide.createIcons();
}

export function destroy() {}
