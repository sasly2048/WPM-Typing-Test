import { createElement, html } from '../utils/dom.js';

export function createFooter() {
  const footer = createElement('footer', { className: 'site-footer' });

  footer.innerHTML = html`
    <div class="footer-container">
      <div class="footer-brand">
        <div class="logo">
          <div class="logo-mark">K</div>
          <span class="logo-text">KeyFlow</span>
        </div>
        <p class="footer-desc">The definitive open-source typing platform for developers and keyboard purists.</p>
        <div class="footer-badge">
          <i data-lucide="git-branch" size="14"></i> v1.0.0 Open Source
        </div>
      </div>

      <div class="footer-col">
        <h4>Workspaces</h4>
        <ul>
          <li><a href="#/practice">Practice Workspace</a></li>
          <li><a href="#/developer">Developer Workspace</a></li>
          <li><a href="#/achievements">Missions & XP</a></li>
          <li><a href="#/themes">Theme Experience</a></li>
        </ul>
      </div>

      <div class="footer-col">
        <h4>Shortcuts</h4>
        <ul>
          <li><kbd class="kf-kbd">Tab</kbd> Quick Restart</li>
          <li><kbd class="kf-kbd">⌘ K</kbd> Command Palette</li>
          <li><kbd class="kf-kbd">Esc</kbd> Reset Focus</li>
        </ul>
      </div>

      <div class="footer-col">
        <h4>Connect</h4>
        <ul>
          <li><a href="https://github.com/sasly2048" target="_blank" rel="noopener noreferrer"><i data-lucide="github" size="14"></i> GitHub</a></li>
          <li><a href="https://linkedin.com/in/raghavendra-g204800" target="_blank" rel="noopener noreferrer"><i data-lucide="linkedin" size="14"></i> LinkedIn</a></li>
          <li><a href="mailto:raghavendrasujith204800@gmail.com"><i data-lucide="mail" size="14"></i> Contact</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <p>© 2026 KeyFlow. Crafted with precision & performance in mind.</p>
    </div>
  `;

  setTimeout(() => {
    if (window.lucide) window.lucide.createIcons();
  }, 20);

  return footer;
}
