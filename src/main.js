/**
 * KeyFlow — Main Application Entry Point
 * 
 * Initializes the router, global layout wrapper (Nav & Footer),
 * registers all workspace routes, sets up command palette, and
 * manages theme & accessibility configurations.
 * 
 * @module main
 */

import { addRoute, setContainer, initRouter, navigate, onRouteChange, getCurrentPath } from './utils/router.js';
import { createNav } from './components/nav.js';
import { createFooter } from './components/footer.js';
import { createCommandPalette } from './components/command-palette.js';
import { initTheme, setSurfaceForRoute, setAppearance, toggleAppearance, setDevAccent } from './services/theme.js';
import { onAuthChange, signOut } from './services/auth.js';
import { initInstrumentation, logger } from './services/instrumentation.js';

/**
 * Lazy-load page modules for code splitting and high performance.
 */
const pageLoaders = {
  '/': () => import('./pages/landing.js'),
  '/auth': () => import('./pages/auth.js'),
  '/practice': () => import('./pages/practice.js'),
  '/typing': () => import('./pages/practice.js'), // Alias for practice
  '/developer': () => import('./pages/developer.js'),
  '/dashboard': () => import('./pages/dashboard.js'),
  '/results': () => import('./pages/results.js'),
  '/achievements': () => import('./pages/achievements.js'),
  '/themes': () => import('./pages/themes.js'),
  '/settings': () => import('./pages/settings.js'),
  '/profile': () => import('./pages/profile.js'),
};

// Routes that require a signed-in user. Everything else (landing, auth,
// themes gallery) stays public.
const PROTECTED_PATHS = new Set([
  '/practice',
  '/typing',
  '/developer',
  '/dashboard',
  '/results',
  '/achievements',
  '/settings',
  '/profile',
]);

let currentUser = undefined; // undefined = not yet resolved, null = signed out

const GUEST_MODE_KEY = 'keyflow_guest_mode';
const isGuestMode = () => localStorage.getItem(GUEST_MODE_KEY) === 'true';

const pageCache = new Map();

function createLazyPage(path) {
  return {
    render(container) {
      if (PROTECTED_PATHS.has(path) && !currentUser && !isGuestMode()) {
        navigate('/auth');
        return;
      }

      const cached = pageCache.get(path);
      if (cached) {
        cached.render(container);
        return;
      }

      container.innerHTML = `
        <div class="page-loader" aria-label="Loading workspace">
          <div class="page-loader__spinner"></div>
        </div>
      `;

      const loader = pageLoaders[path];
      if (!loader) return;

      loader().then(module => {
        pageCache.set(path, module);
        container.innerHTML = '';
        module.render(container);
      }).catch(err => {
        console.error(`Failed to load page: ${path}`, err);
        container.innerHTML = `
          <div class="error-state" style="padding: 4rem; text-align: center;">
            <h2>Something went wrong</h2>
            <p style="color: var(--color-text-secondary); margin: 1rem 0;">Failed to load this workspace. Please refresh.</p>
            <button onclick="location.reload()" class="btn btn-ember">Refresh Application</button>
          </div>
        `;
      });
    },
    destroy() {
      const cached = pageCache.get(path);
      if (cached && cached.destroy) {
        cached.destroy();
      }
    },
  };
}



function initAccessibility() {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reducedMotion.matches) {
    document.documentElement.classList.add('reduce-motion');
  }
}

/**
 * Initialize Command Palette with global commands dictionary
 */
function initCommandPalette() {
  const commands = [
    {
      category: 'Workspaces',
      label: 'Practice Workspace (Words / Quotes)',
      description: 'Standard typing practice mode',
      icon: '<i data-lucide="keyboard"></i>',
      action: () => navigate('/practice')
    },
    {
      category: 'Workspaces',
      label: 'Developer Workspace (Code Editor)',
      description: 'Practice real code syntax in JS, Python, C++, SQL',
      icon: '<i data-lucide="code-2"></i>',
      action: () => navigate('/developer')
    },
    {
      category: 'Navigation',
      label: 'View Dashboard & Analytics',
      description: 'Check WPM history, heatmaps, and consistency metrics',
      icon: '<i data-lucide="bar-chart-3"></i>',
      action: () => navigate('/dashboard')
    },
    {
      category: 'Navigation',
      label: 'Achievements & Missions',
      description: 'Check XP level, daily missions, and badges',
      icon: '<i data-lucide="trophy"></i>',
      action: () => navigate('/achievements')
    },
    {
      category: 'Navigation',
      label: 'Appearance & Themes',
      description: 'Light, dark, and developer accent options',
      icon: '<i data-lucide="palette"></i>',
      action: () => navigate('/themes')
    },
    {
      category: 'Navigation',
      label: 'Preferences & Settings',
      description: 'Configure keyboard sounds, caret, and fair play',
      icon: '<i data-lucide="settings"></i>',
      action: () => navigate('/settings')
    },
    {
      category: 'Appearance',
      label: 'Toggle Light / Dark',
      description: 'Switch the normal-mode appearance',
      icon: '<i data-lucide="sun-moon"></i>',
      action: () => toggleAppearance()
    },
    {
      category: 'Appearance',
      label: 'Use Light Appearance',
      description: 'Warm paper surfaces, ink text',
      icon: '<i data-lucide="sun"></i>',
      action: () => setAppearance('light')
    },
    {
      category: 'Appearance',
      label: 'Use Dark Appearance',
      description: 'Carbon surfaces, amber accent',
      icon: '<i data-lucide="moon"></i>',
      action: () => setAppearance('dark')
    },
    {
      category: 'Appearance',
      label: 'Match System Appearance',
      description: 'Follow the OS light/dark setting',
      icon: '<i data-lucide="monitor"></i>',
      action: () => setAppearance('system')
    },
    {
      category: 'Developer Mode',
      label: 'Developer Accent: Phosphor',
      description: 'Classic terminal green',
      icon: '<i data-lucide="terminal"></i>',
      action: () => setDevAccent('phosphor')
    },
    {
      category: 'Developer Mode',
      label: 'Developer Accent: Amber',
      description: 'Vintage CRT amber',
      icon: '<i data-lucide="terminal"></i>',
      action: () => setDevAccent('amber')
    },
    {
      category: 'Developer Mode',
      label: 'Developer Accent: Cyan',
      description: 'Cool cyan on near-black',
      icon: '<i data-lucide="terminal"></i>',
      action: () => setDevAccent('cyan')
    }
  ];

  const palette = createCommandPalette({
    commands,
    onExecute: (cmd) => {
      // Command executed
    }
  });

  window.addEventListener('keyflow:command-palette', () => {
    palette.toggle();
  });
}

/**
 * Bootstrap Application Shell & Router
 */
function init() {
  const app = document.getElementById('app');
  if (!app) return;

  initTheme();
  initAccessibility();
  initInstrumentation();

  app.innerHTML = '';

  // 1. Render Navigation Header
  let navComponent = createNav({
    currentPath: window.location.hash.replace('#', '') || '/',
    user: null,
    onSignOut: () => signOut(),
  });
  app.appendChild(navComponent);

  // 2. Render Page Container
  const pageContainer = document.createElement('div');
  pageContainer.id = 'page-container';
  pageContainer.setAttribute('role', 'main');
  app.appendChild(pageContainer);
  setContainer(pageContainer);

  // 3. Render Footer. Hidden in the developer workspace, which is a
  //    full-height IDE shell with its own status bar.
  const footerComponent = createFooter();
  app.appendChild(footerComponent);

  const syncFooter = () => {
    footerComponent.hidden = document.documentElement.getAttribute('data-surface') === 'dev';
  };
  window.addEventListener('keyflow:surface-change', syncFooter);
  syncFooter();

  // 4. Initialize Command Palette
  initCommandPalette();

  // 5. Register all routes
  for (const [path] of Object.entries(pageLoaders)) {
    addRoute(path, createLazyPage(path));
  }

  // 6. Listen to route changes to update active state on Nav, and show a
  // brief terminal-style loading state when switching between the Practice
  // and Developer workspaces.
  onRouteChange((newPath) => {
    // The surface swap must happen before the page paints, otherwise the
    // developer workspace renders one frame with normal-mode tokens.
    setSurfaceForRoute(newPath);

    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(link => {
      const target = link.getAttribute('href').replace('#', '') || '/';
      if (target === newPath) link.classList.add('active');
      else link.classList.remove('active');
    });

    logger.debug('router', `Navigated to ${newPath}`);
  });

  // 7. Wait for Firebase to resolve the initial auth state before starting
  // the router — this avoids a flash of protected content (or an incorrect
  // redirect to /auth) while the SDK is still checking a persisted session.
  let routerStarted = false;
  onAuthChange((user) => {
    currentUser = user;

    const refreshedNav = createNav({
      currentPath: window.location.hash.replace('#', '') || '/',
      user,
      onSignOut: () => signOut(),
    });
    navComponent.replaceWith(refreshedNav);
    navComponent = refreshedNav;

    if (!routerStarted) {
      routerStarted = true;
      initRouter();
    } else if (!user && !isGuestMode() && PROTECTED_PATHS.has(getCurrentPath())) {
      navigate('/auth');
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
