import { html } from '../utils/dom.js';
import { getStats } from '../services/history.js';
import { getProgress } from '../services/achievements.js';

const styles = `
.achievements-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem 5rem;
  color: var(--color-text-primary, #e2e2e2);
}

.achievements-header {
  margin-bottom: 3rem;
  text-align: center;
}

.achievements-title {
  font-size: 2.5rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  background: linear-gradient(135deg, #fff 0%, var(--color-accent, #f0a968) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 0.5rem;
}

.achievements-subtitle {
  color: var(--color-text-secondary, #9a9a9a);
  font-size: 1.1rem;
}

.level-banner {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  gap: 1.5rem;
  align-items: center;
  background: var(--surface-2, #13131A);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1rem;
  padding: 2rem;
  margin-bottom: 3rem;
}

@media (max-width: 768px) {
  .level-banner {
    grid-template-columns: 1fr;
    text-align: center;
  }
}

.level-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: rgba(240, 169, 104, 0.08);
  border: 1px solid rgba(240, 169, 104, 0.25);
  border-radius: 0.875rem;
}

.level-number {
  font-size: 3rem;
  font-weight: 900;
  color: var(--color-accent, #f0a968);
  line-height: 1;
}

.level-label {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-text-secondary, #9a9a9a);
  margin-top: 0.25rem;
}

.xp-progress-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.xp-stats {
  display: flex;
  justify-content: space-between;
  font-weight: 600;
  font-size: 0.95rem;
}

.xp-bar-outer {
  height: 12px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  overflow: hidden;
  position: relative;
}

.xp-bar-inner {
  height: 100%;
  background: linear-gradient(90deg, var(--color-accent, #f0a968), #34d399);
  border-radius: 6px;
  transition: width 0.8s ease-out;
}

.streak-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: rgba(255, 59, 48, 0.08);
  border: 1px solid rgba(255, 59, 48, 0.2);
  border-radius: 0.875rem;
}

.streak-count {
  font-size: 2.5rem;
  font-weight: 900;
  color: #ff3b30;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.streak-label {
  font-size: 0.85rem;
  color: var(--color-text-secondary, #9a9a9a);
  margin-top: 0.25rem;
}

.section-heading {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.achievements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1.25rem;
}

.achievement-card {
  background: var(--surface-2, #13131A);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.75rem;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  transition: transform 0.2s var(--ease-apple);
}

.achievement-card.unlocked {
  border-color: rgba(240, 169, 104, 0.3);
}

.achievement-card.locked {
  opacity: 0.45;
}

.badge-glow {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(240, 169, 104, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-accent, #f0a968);
  margin-bottom: 1rem;
}

.achievement-name {
  font-weight: 700;
  font-size: 1.05rem;
  margin-bottom: 0.35rem;
}

.achievement-desc {
  font-size: 0.825rem;
  color: var(--color-text-secondary, #9a9a9a);
  line-height: 1.4;
  margin-bottom: 1rem;
}
`;

function renderAchievementsGrid(progress) {
  return progress.map(ach => `
    <div class="achievement-card ${ach.isUnlocked ? 'unlocked' : 'locked'}">
      <div class="badge-glow"><div style="font-size: 24px">${ach.icon}</div></div>
      <div class="achievement-name">${ach.title}</div>
      <div class="achievement-desc">${ach.description}</div>
      <div style="font-size: 0.75rem; color: ${ach.isUnlocked ? '#34d399' : '#666'}; font-weight: 600;">
        ${ach.isUnlocked ? 'Unlocked' : 'Locked'}
      </div>
    </div>
  `).join('');
}

export function render(container) {
  const styleEl = document.createElement('style');
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);

  const stats = getStats();
  const xp = (stats.totalTests * 150) + Math.round(stats.totalTime * 2);
  const level = Math.max(1, Math.floor(xp / 500) + 1);
  const currentXpProgress = xp % 500;
  const xpPercentage = Math.min(100, Math.round((currentXpProgress / 500) * 100));

  container.innerHTML = html`
    <div class="achievements-page">
      <header class="achievements-header">
        <h1 class="achievements-title">Achievements & Progression</h1>
        <p class="achievements-subtitle">Track your typing streak, unlock achievements, and level up your mastery.</p>
      </header>

      <section class="level-banner">
        <div class="level-badge">
          <div class="level-number">${level}</div>
          <div class="level-label">Level Tier</div>
        </div>

        <div class="xp-progress-wrap">
          <div class="xp-stats">
            <span>Level ${level} Mastery</span>
            <span>${currentXpProgress} / 500 XP</span>
          </div>
          <div class="xp-bar-outer">
            <div class="xp-bar-inner" style="width: ${xpPercentage}%"></div>
          </div>
          <span style="font-size: 0.85rem; color: var(--color-text-secondary, #9a9a9a);">+150 XP per session completed with &gt;95% accuracy.</span>
        </div>

        <div class="streak-card">
          <div class="streak-count">
            <i aria-hidden="true" data-lucide="flame"></i> ${stats.currentStreak || 0}
          </div>
          <div class="streak-label">Day Active Streak</div>
        </div>
      </section>

      <section>
        <h2 class="section-heading">
          <i aria-hidden="true" data-lucide="trophy" style="color: var(--color-accent, #f0a968)"></i> Trophy Achievements
        </h2>
        <div class="achievements-grid" id="achievements-grid">
          <p style="color: var(--color-text-secondary, #9a9a9a);">Loading...</p>
        </div>
      </section>
    </div>
  `;

  setTimeout(() => {
    if (window.lucide) window.lucide.createIcons();
  }, 20);

  getProgress(stats).then((progress) => {
    const grid = container.querySelector('#achievements-grid');
    if (grid) {
      grid.innerHTML = renderAchievementsGrid(progress);
      if (window.lucide) window.lucide.createIcons();
    }
  });

  container.dataset.destroy = () => {
    if (styleEl && styleEl.parentNode) styleEl.parentNode.removeChild(styleEl);
  };
}

export function destroy(container) {
  if (container.dataset.destroy) container.dataset.destroy();
}
