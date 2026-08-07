import { createElement, html } from '../utils/dom.js';

/**
 * Site footer.
 *
 * Hidden in the developer workspace: that route is a full-height IDE shell,
 * and a marketing footer below it would both break the layout and read as a
 * different product. main.js toggles the hidden state on surface change.
 */
export function createFooter() {
  const footer = createElement('footer', { className: 'site-footer' });

  footer.innerHTML = html`
    <div class="footer-container">
      <div class="footer__brand">
        <a href="#/" class="logo-link">
          <svg class="logo-mark" viewBox="0 0 32 32" width="22" height="22" aria-hidden="true">
            <rect x="5" y="5" width="22" height="22" rx="6" fill="none" stroke="currentColor" stroke-width="3"/>
            <path d="M13 14 L13 22 M13 22 L18 22" stroke="currentColor" stroke-width="3"
                  stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          </svg>
          <span class="logo-text">KeyFlow</span>
        </a>
        <p class="footer__desc">Open-source typing practice for prose and code.</p>
      </div>

      <nav class="footer__col" aria-label="Workspaces">
        <h2 class="footer__heading">Practice</h2>
        <ul class="footer__list">
          <li><a href="#/practice">Practice</a></li>
          <li><a href="#/developer">Developer</a></li>
          <li><a href="#/dashboard">Dashboard</a></li>
          <li><a href="#/achievements">Achievements</a></li>
        </ul>
      </nav>

      <div class="footer__col">
        <h2 class="footer__heading">Shortcuts</h2>
        <ul class="footer__list footer__list--shortcuts">
          <li><kbd>Tab</kbd> <span>Restart test</span></li>
          <li><kbd>⌘K</kbd> <span>Command palette</span></li>
          <li><kbd>Esc</kbd> <span>Close dialog</span></li>
        </ul>
      </div>

      <nav class="footer__col" aria-label="Links">
        <h2 class="footer__heading">Project</h2>
        <ul class="footer__list">
          <li>
            <a href="https://github.com/sasly2048/WPM-Typing-Test" target="_blank" rel="noopener noreferrer">
              GitHub <i data-lucide="external-link"></i>
            </a>
          </li>
          <li><a href="#/settings">Settings</a></li>
        </ul>
      </nav>
    </div>

    <div class="footer__bottom">
      <span>© ${new Date().getFullYear()} KeyFlow</span>
      <span>Data stored locally in your browser.</span>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  return footer;
}
