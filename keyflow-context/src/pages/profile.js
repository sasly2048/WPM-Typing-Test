import { $, createElement, html } from '../utils/dom.js';
import { getStats } from '../services/history.js';
import { getProgress } from '../services/achievements.js';
import * as storage from '../services/storage.js';
import { getCurrentUser } from '../services/auth.js';

const BADGE_ICONS = {
  first_test: 'zap',
  speed_demon_50: 'zap',
  speed_demon_100: 'gauge',
  perfect_accuracy: 'target',
  streak_7: 'calendar',
  consistency_king: 'trophy',
  tests_100: 'cpu',
};

const styles = `
.profile-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 3rem 1.5rem 5rem;
  color: var(--color-text-primary, #e2e2e2);
}

.profile-header-card {
  display: flex;
  align-items: center;
  gap: 2rem;
  margin-bottom: 3rem;
  background: var(--surface-2, #13131A);
  padding: 2.5rem;
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

@media (max-width: 600px) {
  .profile-header-card { flex-direction: column; text-align: center; }
}

.avatar-sphere {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-accent, #f0a968) 0%, #d97706 100%);
  color: #000;
  font-size: 2.5rem;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 24px rgba(240, 169, 104, 0.3);
}

.profile-info h1 {
  font-size: 2.25rem;
  font-weight: 800;
  margin: 0 0 0.25rem 0;
}

.profile-role {
  color: var(--color-accent, #f0a968);
  font-weight: 600;
  font-size: 1rem;
  margin-bottom: 0.5rem;
}

.profile-meta-text {
  color: var(--color-text-secondary, #9a9a9a);
  font-size: 0.875rem;
}

.profile-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1.25rem;
  margin-bottom: 3rem;
}

.summary-card-elevated {
  text-align: center;
  padding: 1.5rem;
  background: var(--surface-2, #13131A);
  border-radius: 0.875rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: transform 0.2s var(--ease-apple);
}

.summary-card-elevated:hover {
  transform: translateY(-4px);
}

.summary-value-num {
  font-size: 2.25rem;
  font-weight: 900;
  color: #fff;
  margin-bottom: 0.25rem;
}

.summary-label-txt {
  font-size: 0.8rem;
  color: var(--color-text-secondary, #9a9a9a);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}

.badges-section-title {
  font-size: 1.35rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.badges-grid-layout {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 1.25rem;
}

.badge-item-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.75rem;
  padding: 1.25rem;
  background: var(--surface-2, #13131A);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.875rem;
}

.badge-icon-box {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background: rgba(240, 169, 104, 0.1);
  color: var(--color-accent, #f0a968);
  display: flex;
  align-items: center;
  justify-content: center;
}

.badge-item-card.locked .badge-icon-box {
  background: rgba(255, 255, 255, 0.04);
  color: #555;
}

.badge-item-name {
  font-weight: 600;
  font-size: 0.9rem;
}
`;

export function render(container) {
  const styleEl = document.createElement('style');
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);

  const user = getCurrentUser();
  const name = storage.get('username') || user?.displayName || user?.email?.split('@')[0] || 'Typist';
  const initial = name.charAt(0).toUpperCase();
  const stats = getStats();
  const totalTests = stats.totalTests || 0;
  const timePracticedHours = Math.round((stats.totalTime || 0) / 3600);
  const peakWpm = stats.bestWpm || 0;
  const streak = stats.currentStreak || 0;

  const xp = (totalTests * 150) + Math.round((stats.totalTime || 0) * 2);
  const level = Math.max(1, Math.floor(xp / 500) + 1);
  const joinDate = user?.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
    : null;

  container.innerHTML = html`
    <main id="main-content" class="profile-page">
      <div class="profile-header-card">
        <div class="avatar-sphere">${initial}</div>
        <div class="profile-info">
          <h1>${name}</h1>
          <div class="profile-meta-text">${joinDate ? `Member since ${joinDate} &middot; ` : ''}Level ${level}</div>
        </div>
      </div>

      <div class="profile-stats-grid">
        <div class="summary-card-elevated">
          <div class="summary-value-num">${totalTests}</div>
          <div class="summary-label-txt">Tests Completed</div>
        </div>
        <div class="summary-card-elevated">
          <div class="summary-value-num">${timePracticedHours}h</div>
          <div class="summary-label-txt">Time Practiced</div>
        </div>
        <div class="summary-card-elevated">
          <div class="summary-value-num">${peakWpm}</div>
          <div class="summary-label-txt">Peak WPM</div>
        </div>
        <div class="summary-card-elevated">
          <div class="summary-value-num">${streak}</div>
          <div class="summary-label-txt">Day Streak</div>
        </div>
      </div>

      <div>
        <h2 class="badges-section-title">
          <i aria-hidden="true" data-lucide="award" style="color: var(--color-accent, #f0a968)"></i> Badges
        </h2>
        <div class="badges-grid-layout" id="profile-badges-grid">
          <p style="color: var(--color-text-secondary, #9a9a9a);">Loading...</p>
        </div>
      </div>
    </main>
  `;

  setTimeout(() => {
    if (window.lucide) window.lucide.createIcons();
  }, 20);

  getProgress(stats).then((progress) => {
    const grid = container.querySelector('#profile-badges-grid');
    if (!grid) return;
    grid.innerHTML = progress.map((ach) => `
      <div class="badge-item-card ${ach.isUnlocked ? '' : 'locked'}">
        <div class="badge-icon-box"><i aria-hidden="true" data-lucide="${BADGE_ICONS[ach.id] || 'award'}"></i></div>
        <div class="badge-item-name">${ach.title}</div>
      </div>
    `).join('');
    if (window.lucide) window.lucide.createIcons();
  });

  container.dataset.destroy = () => {
    if (styleEl && styleEl.parentNode) styleEl.parentNode.removeChild(styleEl);
  };
}

export function destroy(container) {
  if (container.dataset.destroy) container.dataset.destroy();
}
