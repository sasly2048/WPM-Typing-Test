import { createElement, html, on } from '../utils/dom.js';
import { toggleAppearance, getResolvedAppearance, getSurface } from '../services/theme.js';

export function createNav({ currentPath = '/', onNavigate, user = null, onSignOut }) {
  const nav = createElement('nav', { className: 'site-nav' });

  const links = [
    { label: 'Home', path: '/', icon: 'home' },
    { label: 'Practice', path: '/practice', icon: 'keyboard' },
    { label: 'Developer', path: '/developer', icon: 'code-2' },
    { label: 'Dashboard', path: '/dashboard', icon: 'bar-chart-3' },
    { label: 'Achievements', path: '/achievements', icon: 'trophy' },
    { label: 'Themes', path: '/themes', icon: 'palette' }
  ];

  nav.innerHTML = html`
    <div class="nav-container">
      <div class="nav-left">
        <a href="#/" class="logo-link">
          <svg class="logo-mark" viewBox="0 0 32 32" width="28" height="28" aria-hidden="true">
            <rect x="5" y="5" width="22" height="22" rx="6" fill="none" stroke="currentColor" stroke-width="3"/>
            <path d="M13 14 L13 22 M13 22 L18 22" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          </svg>
          <span class="logo-text">KeyFlow</span>
        </a>
      </div>

      <div class="nav-center">
        <ul class="nav-links">
          ${links.map(l => {
            const isActive = currentPath === l.path || (l.path === '/practice' && currentPath === '/typing');
            return `
              <li>
                <a href="#${l.path}" class="nav-link ${isActive ? 'active' : ''}" data-path="${l.path}">
                  <i data-lucide="${l.icon}"></i>
                  <span>${l.label}</span>
                </a>
              </li>
            `;
          }).join('')}
        </ul>
      </div>

      <div class="nav-right">
        <button class="cmd-trigger-btn" aria-label="Open Command Palette (Cmd+K)">
          <i data-lucide="search"></i>
          <span class="cmd-text">Search...</span>
          <kbd class="cmd-kbd">⌘K</kbd>
        </button>

        <button class="icon-btn" id="nav-appearance-btn"
                aria-label="Toggle light or dark appearance"
                title="Toggle appearance">
          <i data-lucide="${getResolvedAppearance() === 'dark' ? 'sun' : 'moon'}"></i>
        </button>

        <a href="#/settings" class="icon-btn" aria-label="Settings">
          <i data-lucide="settings"></i>
        </a>

        ${user
          ? `<button class="icon-btn" id="nav-sign-out-btn" aria-label="Sign out">
              <i data-lucide="log-out"></i>
            </button>`
          : `<a href="#/auth" class="pill-button">Sign in</a>`}

        <button class="icon-btn nav-menu-trigger" aria-label="Open navigation menu" aria-expanded="false">
          <i data-lucide="menu"></i>
        </button>
      </div>
    </div>

    <ul class="nav-mobile-menu" hidden>
      ${links.map(l => {
        const isActive = currentPath === l.path || (l.path === '/practice' && currentPath === '/typing');
        return `
          <li>
            <a href="#${l.path}" class="nav-link ${isActive ? 'active' : ''}" data-path="${l.path}">
              <i data-lucide="${l.icon}"></i>
              <span>${l.label}</span>
            </a>
          </li>
        `;
      }).join('')}
    </ul>
  `;

  // Attach nav link handlers (both the desktop row and the mobile menu copy)
  const navLinks = nav.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    on(link, 'click', (e) => {
      const path = link.getAttribute('data-path');
      if (onNavigate) onNavigate(path);
      closeMobileMenu();
    });
  });

  // Cmd+K trigger handler
  const cmdBtn = nav.querySelector('.cmd-trigger-btn');
  if (cmdBtn) {
    on(cmdBtn, 'click', () => {
      window.dispatchEvent(new CustomEvent('keyflow:command-palette'));
    });
  }

  // Appearance toggle. Hidden in developer mode — that surface is always dark,
  // so offering a light switch there would be a control that does nothing.
  const appearanceBtn = nav.querySelector('#nav-appearance-btn');
  if (appearanceBtn) {
    const syncAppearanceBtn = () => {
      appearanceBtn.hidden = getSurface() === 'dev';
      const icon = getResolvedAppearance() === 'dark' ? 'sun' : 'moon';
      appearanceBtn.innerHTML = `<i data-lucide="${icon}"></i>`;
      if (window.lucide) window.lucide.createIcons();
    };

    on(appearanceBtn, 'click', () => {
      toggleAppearance();
      syncAppearanceBtn();
    });

    window.addEventListener('keyflow:surface-change', syncAppearanceBtn);
    syncAppearanceBtn();
  }

  const signOutBtn = nav.querySelector('#nav-sign-out-btn');
  if (signOutBtn) {
    on(signOutBtn, 'click', () => {
      if (onSignOut) onSignOut();
    });
  }

  // Mobile menu toggle
  const menuTrigger = nav.querySelector('.nav-menu-trigger');
  const mobileMenu = nav.querySelector('.nav-mobile-menu');

  function closeMobileMenu() {
    if (!mobileMenu) return;
    mobileMenu.hidden = true;
    if (menuTrigger) menuTrigger.setAttribute('aria-expanded', 'false');
  }

  if (menuTrigger && mobileMenu) {
    on(menuTrigger, 'click', () => {
      const isOpen = !mobileMenu.hidden;
      mobileMenu.hidden = isOpen;
      menuTrigger.setAttribute('aria-expanded', String(!isOpen));
    });
  }

  setTimeout(() => {
    if (window.lucide) window.lucide.createIcons();
  }, 20);

  return nav;
}
