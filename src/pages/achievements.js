/**
 * Achievements.
 *
 * Locked entries show real progress toward their target rather than hiding
 * behind a silhouette — knowing you are 8 tests away is motivating; a blank
 * card is not.
 */

import { html } from '../utils/dom.js';
import { getProgress } from '../services/achievements.js';
import { getStats } from '../services/history.js';
import { logger } from '../services/instrumentation.js';

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const UNIT = {
  tests_completed: 'tests',
  code_tests_completed: 'tests',
  wpm_reached: 'wpm',
  accuracy_reached: '%',
  streak_days: 'days',
  consistency_reached: '%',
};

function card(a) {
  const unit = UNIT[a.condition?.type] || '';
  const target = a.condition?.value ?? 0;
  // Clamp so a locked card never reads "41 / 10" — progress toward a target
  // is meaningless past the target.
  const current = Math.min(Math.floor(a.currentValue || 0), target);

  return `
    <article class="achievement ${a.isUnlocked ? 'achievement--unlocked' : ''}">
      <div class="achievement__icon">
        <i data-lucide="${esc(a.icon || (a.isUnlocked ? 'award' : 'lock'))}"></i>
      </div>
      <div class="achievement__body">
        <h3 class="achievement__title">${esc(a.title || a.name || 'Achievement')}</h3>
        <p class="achievement__desc">${esc(a.description || '')}</p>
        ${a.isUnlocked
          ? '<span class="badge badge--accent achievement__badge">Unlocked</span>'
          : `
            <div class="achievement__progress">
              <div class="progress" role="progressbar"
                   aria-valuenow="${Math.round(a.progress)}" aria-valuemin="0" aria-valuemax="100"
                   aria-label="${esc(a.title || 'Achievement')} progress">
                <div class="progress__fill" style="width:${Math.min(100, a.progress)}%"></div>
              </div>
              <span class="achievement__progress-text">${current} / ${target}${unit ? ` ${unit}` : ''}</span>
            </div>
          `}
      </div>
    </article>
  `;
}

export async function render(container) {
  container.innerHTML = html`
    <div class="page achievements">
      <header class="page-header">
        <div>
          <h1 class="page-header__title">Achievements</h1>
          <p class="page-header__desc">Milestones earned through practice.</p>
        </div>
      </header>
      <div class="page-loader"><div class="page-loader__spinner"></div></div>
    </div>
  `;

  let items = [];
  try {
    items = await getProgress(getStats());
  } catch (err) {
    logger.error('achievements', 'Failed to load definitions', { error: err.message });
  }

  const root = container.querySelector('.achievements');
  if (!root) return; // navigated away while awaiting
  root.querySelector('.page-loader')?.remove();

  if (!items.length) {
    root.insertAdjacentHTML('beforeend', `
      <div class="empty-state">
        <i class="empty-state__icon" data-lucide="award"></i>
        <h2 class="empty-state__title">Nothing to show yet</h2>
        <p class="empty-state__desc">Achievement definitions could not be loaded.</p>
      </div>
    `);
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  const unlocked = items.filter((a) => a.isUnlocked);
  const locked = items.filter((a) => !a.isUnlocked);
  const pct = Math.round((unlocked.length / items.length) * 100);

  root.insertAdjacentHTML('beforeend', `
    <div class="achievements__summary card">
      <div class="stat">
        <span class="stat__label">Unlocked</span>
        <span class="stat__value">${unlocked.length}<span class="stat__unit">of ${items.length}</span></span>
      </div>
      <div class="achievements__summary-bar">
        <div class="progress" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"
             aria-label="Overall achievement completion">
          <div class="progress__fill" style="width:${pct}%"></div>
        </div>
        <span class="achievements__summary-pct">${pct}% complete</span>
      </div>
    </div>

    ${unlocked.length ? `
      <section class="section">
        <h2 class="section__label">Earned</h2>
        <div class="grid grid--auto">${unlocked.map(card).join('')}</div>
      </section>
    ` : ''}

    ${locked.length ? `
      <section class="section">
        <h2 class="section__label">In progress</h2>
        <div class="grid grid--auto">
          ${locked.slice().sort((a, b) => b.progress - a.progress).map(card).join('')}
        </div>
      </section>
    ` : ''}
  `);

  if (window.lucide) window.lucide.createIcons();
}

export function destroy() {}
