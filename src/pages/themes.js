import { html } from '../utils/dom.js';
import { applyTheme } from '../services/theme.js';

const styles = `
.themes-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem 5rem;
  color: var(--color-text-primary, #e2e2e2);
}

.themes-header {
  text-align: center;
  margin-bottom: 3rem;
}

.themes-title {
  font-size: 2.5rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  background: linear-gradient(135deg, #fff 0%, var(--color-accent, #f0a968) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 0.5rem;
}

.themes-subtitle {
  color: var(--color-text-secondary, #9a9a9a);
  font-size: 1.1rem;
}

.themes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.theme-card {
  border-radius: 0.875rem;
  padding: 1.25rem;
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform 0.2s cubic-bezier(0.32, 0.72, 0, 1), box-shadow 0.2s, border-color 0.2s;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  position: relative;
}

.theme-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.4);
}

.theme-card.active {
  border-color: var(--color-accent, #f0a968);
  box-shadow: 0 0 20px rgba(240, 169, 104, 0.2);
}

.theme-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.theme-card-title {
  font-weight: 700;
  font-size: 1.1rem;
}

.theme-active-badge {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  padding: 0.25rem 0.6rem;
  border-radius: 1rem;
  background: var(--color-accent, #f0a968);
  color: #000;
}

.theme-preview-box {
  border-radius: 0.5rem;
  padding: 1rem;
  font-family: var(--font-mono, 'JetBrains Mono', monospace);
  font-size: 0.875rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.theme-swatches {
  display: flex;
  gap: 0.5rem;
  margin-top: auto;
}

.swatch {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.1);
}
`;

const THEMES_LIST = [
  {
    id: 'midnight',
    name: 'Midnight',
    bg: '#060608',
    surface: '#0d0d12',
    accent: '#f0a968',
    text: '#e2e2e2',
    syntax: ['#b0a0c8', '#9ab88a', '#9a9a9a']
  },
  {
    id: 'graphite',
    name: 'Graphite',
    bg: '#0e0e0f',
    surface: '#1c1c1f',
    accent: '#b0b0b8',
    text: '#e6e6e8',
    syntax: ['#a29acb', '#6ec090', '#9a9a9e']
  },
  {
    id: 'aurora',
    name: 'Aurora',
    bg: '#0a0a12',
    surface: '#171728',
    accent: '#9d7cf9',
    text: '#e8e6f7',
    syntax: ['#b79bfb', '#3ed6a8', '#a29fc4']
  },
  {
    id: 'ocean',
    name: 'Ocean',
    bg: '#071012',
    surface: '#112024',
    accent: '#45c7c7',
    text: '#dcf0f1',
    syntax: ['#7fa3e0', '#4ec98f', '#86a8ab']
  },
  {
    id: 'forest',
    name: 'Forest',
    bg: '#0a0f0a',
    surface: '#151d15',
    accent: '#7bc074',
    text: '#e0e8de',
    syntax: ['#a3b0e0', '#7bc074', '#96a693']
  },
  {
    id: 'monokai',
    name: 'Monokai',
    bg: '#1e1f1c',
    surface: '#2f302a',
    accent: '#e6db74',
    text: '#f8f8f2',
    syntax: ['#f92672', '#a6e22e', '#a6a793']
  },
  {
    id: 'terminal',
    name: 'Terminal',
    bg: '#000000',
    surface: '#0c100c',
    accent: '#39ff6a',
    text: '#baf5ba',
    syntax: ['#39ff6a', '#ffd166', '#6fae6f']
  },
  {
    id: 'arctic',
    name: 'Arctic',
    bg: '#f7f9fb',
    surface: '#eef2f6',
    accent: '#1c7ed6',
    text: '#14212e',
    syntax: ['#6a3fd6', '#2f9e6f', '#4c5b6b']
  },
  {
    id: 'sand',
    name: 'Sand',
    bg: '#faf6ee',
    surface: '#f2ebdc',
    accent: '#c26a3f',
    text: '#3a2e20',
    syntax: ['#8a5fb0', '#4f8f5e', '#6e5f4c']
  }
];

export function render(container) {
  const styleEl = document.createElement('style');
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);

  const currentTheme = localStorage.getItem('keyflow_theme') || 'midnight';

  container.innerHTML = html`
    <div class="themes-page">
      <header class="themes-header">
        <h1 class="themes-title">Theme Experience Gallery</h1>
        <p class="themes-subtitle">Transform colors, syntax highlighting, glow effects, and cursor motion in one click.</p>
      </header>

      <div class="themes-grid">
        ${THEMES_LIST.map(theme => `
          <div class="theme-card ${currentTheme === theme.id ? 'active' : ''}" data-theme-id="${theme.id}" style="background: ${theme.surface}; color: ${theme.text}">
            <div class="theme-card-header">
              <span class="theme-card-title">${theme.name}</span>
              ${currentTheme === theme.id ? '<span class="theme-active-badge">Active</span>' : ''}
            </div>

            <div class="theme-preview-box" style="background: ${theme.bg}">
              <div><span style="color: ${theme.syntax[0]}">const</span> <span style="color: ${theme.text}">flow</span> = <span style="color: ${theme.syntax[1]}">'addictive'</span>;</div>
              <div style="color: ${theme.syntax[2]}; font-size: 0.75rem;">// 120 WPM • 99% Accuracy</div>
            </div>

            <div class="theme-swatches">
              <div class="swatch" style="background: ${theme.bg}" title="Background"></div>
              <div class="swatch" style="background: ${theme.surface}" title="Surface"></div>
              <div class="swatch" style="background: ${theme.accent}" title="Accent"></div>
              <div class="swatch" style="background: ${theme.text}" title="Text"></div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  const cards = container.querySelectorAll('.theme-card');
  cards.forEach(card => {
    card.addEventListener('click', () => {
      const themeId = card.getAttribute('data-theme-id');
      applyTheme(themeId);
      cards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
    });
  });

  container.dataset.destroy = () => {
    if (styleEl && styleEl.parentNode) styleEl.parentNode.removeChild(styleEl);
  };
}

export function destroy(container) {
  if (container.dataset.destroy) container.dataset.destroy();
}
