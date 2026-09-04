/**
 * Local leaderboards.
 *
 * Aggregates every personal best you have set, scoped by mode,
 * language, and test configuration. The "friends" tab is local —
 * it shows historical PBs you set on this device — because KeyFlow
 * is a single-player, no-account product by default.
 *
 * Each row is clickable: the test config is encoded into a share
 * URL the user can paste into a new tab to recreate that exact
 * configuration.
 */

import { html } from '../utils/dom.js';
import { getAllPersonalBests, getSessions } from '../services/history.js';
import { buildShareUrl } from '../utils/test-config.js';

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const MODE_LABEL = {
  paragraph: 'Prose',
  time: 'Time',
  words: 'Words',
  quote: 'Quote',
  zen: 'Zen',
  code: 'Code',
  custom: 'Custom',
  adaptive: 'Adaptive',
};

function dateOnly(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function render(container) {
  const all = getSessions() || [];
  const personalBests = aggregatePersonalBests(all);

  container.innerHTML = html`
    <div class="page page--narrow leaderboards">
      <header class="page-header">
        <div>
          <h1 class="page-header__title">Leaderboards</h1>
          <p class="page-header__desc">Your personal bests, by mode and configuration. Click any row to recreate that test.</p>
        </div>
      </header>

      <section class="section" id="lb-alltime-section">
        <h2 class="section__label">All-time bests</h2>
        <div class="card">
          <div class="leaderboards__table-wrap">
            <table class="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Mode</th>
                  <th>Config</th>
                  <th class="num">Best WPM</th>
                  <th class="num">Avg acc</th>
                  <th>Achieved</th>
                </tr>
              </thead>
              <tbody id="lb-alltime-body"></tbody>
            </table>
          </div>
        </div>
      </section>

      <section class="section">
        <h2 class="section__label">By mode</h2>
        <div class="grid grid--auto" id="lb-by-mode"></div>
      </section>

      <p class="leaderboards__footnote">
        <i data-lucide="info"></i>
        PBs are kept per (mode, duration, word-count) so a 15s sprint and a 60s test don't compete.
        Local-only; no account required.
      </p>
    </div>
  `;

  // All-time table — top 30 across all configurations
  const tbody = container.querySelector('#lb-alltime-body');
  if (tbody) {
    if (!personalBests.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="table__empty">No personal bests yet. Finish a test to start your leaderboard.</td></tr>';
    } else {
      tbody.innerHTML = personalBests.slice(0, 30).map((pb, i) => `
        <tr data-config='${esc(JSON.stringify(pb.config))}' class="leaderboards__row" tabindex="0" role="button" aria-label="Recreate ${esc(MODE_LABEL[pb.mode] || pb.mode)} test">
          <td>${i + 1}</td>
          <td>${esc(MODE_LABEL[pb.mode] || pb.mode || '—')}</td>
          <td>${esc(pb.configLabel || '—')}</td>
          <td class="num"><strong>${pb.wpm}</strong></td>
          <td class="num">${pb.accuracy != null ? `${pb.accuracy.toFixed(1)}%` : '—'}</td>
          <td>${esc(dateOnly(pb.timestamp))}</td>
        </tr>
      `).join('');
      // Click to recreate
      tbody.querySelectorAll('tr[data-config]').forEach((row) => {
        const fire = () => {
          try {
            const cfg = JSON.parse(row.dataset.config);
            const url = buildShareUrl(window.location.origin + window.location.pathname + '#/practice', cfg);
            window.location.href = url;
          } catch {}
        };
        row.addEventListener('click', fire);
        row.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fire(); }
        });
      });
    }
  }

  // By-mode cards: top WPM, average WPM, and total tests per mode.
  const byMode = container.querySelector('#lb-by-mode');
  if (byMode) {
    const modes = ['time', 'words', 'paragraph', 'quote', 'code', 'zen', 'adaptive'];
    const cards = modes.map((m) => {
      const list = all.filter((s) => s.mode === m);
      if (!list.length) return null;
      const best = list.reduce((a, s) => Math.max(a, s.wpm || 0), 0);
      const avg = list.reduce((a, s) => a + (s.wpm || 0), 0) / list.length;
      const avgAcc = list.reduce((a, s) => a + (s.accuracy || 0), 0) / list.length;
      return `
        <div class="card leaderboards__mode-card">
          <div class="leaderboards__mode-head">
            <h3 class="card__title">${esc(MODE_LABEL[m] || m)}</h3>
            <span class="badge">${list.length} test${list.length === 1 ? '' : 's'}</span>
          </div>
          <div class="leaderboards__mode-stats">
            <div class="stat">
              <span class="stat__label">Best</span>
              <span class="stat__value">${Math.round(best)}<span class="stat__unit">wpm</span></span>
            </div>
            <div class="stat">
              <span class="stat__label">Average</span>
              <span class="stat__value">${Math.round(avg)}<span class="stat__unit">wpm</span></span>
            </div>
            <div class="stat">
              <span class="stat__label">Avg acc</span>
              <span class="stat__value">${avgAcc.toFixed(1)}<span class="stat__unit">%</span></span>
            </div>
          </div>
        </div>
      `;
    }).filter(Boolean);
    byMode.innerHTML = cards.length
      ? cards.join('')
      : '<div class="empty-state"><i class="empty-state__icon" data-lucide="award"></i><h2 class="empty-state__title">No mode data yet</h2><p class="empty-state__desc">Finish a test in any mode to see it ranked.</p></div>';
  }

  if (window.lucide) window.lucide.createIcons();
}

/**
 * Build a deduplicated, ranked list of personal bests across all
 * configurations. Each row carries the test config it was achieved
 * under so the share button can reproduce it.
 */
function aggregatePersonalBests(sessions) {
  const seen = new Map();
  for (const s of sessions) {
    if (typeof s.wpm !== 'number') continue;
    const key = `${s.mode || ''}|${s.duration || ''}|${s.wordCount || ''}|${s.language || ''}|${s.difficulty || ''}`;
    const cur = seen.get(key);
    if (!cur || s.wpm > cur.wpm) seen.set(key, s);
  }
  return [...seen.values()].sort((a, b) => (b.wpm || 0) - (a.wpm || 0)).map((s) => {
    const parts = [];
    if (s.duration) parts.push(`${s.duration}s`);
    if (s.wordCount) parts.push(`${s.wordCount}w`);
    if (s.difficulty) parts.push(s.difficulty);
    if (s.language && s.language !== 'en') parts.push(s.language.toUpperCase());
    return {
      mode: s.mode,
      config: {
        mode: s.mode,
        duration: s.duration,
        wordCount: s.wordCount,
        difficulty: s.difficulty,
        language: s.language,
      },
      configLabel: parts.join(' · ') || '—',
      wpm: s.wpm,
      accuracy: s.accuracy,
      timestamp: s.timestamp,
    };
  });
}

export function destroy(container) { if (container && container._destroy) container._destroy(); }
