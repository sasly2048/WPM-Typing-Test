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
import { applyTheme, initTheme } from './services/theme.js';
import { createTerminal } from './components/fx/terminal.js';
import { onAuthChange, signOut } from './services/auth.js';

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



const MODE_TRANSITIONS = {
  '/practice->/developer': {
    command: 'keyflow switch --workspace=developer',
    lines: [
      'Loading syntax highlighter...',
      'Indexing language snippets...',
      'Developer workspace ready.',
    ],
  },
  '/developer->/practice': {
    command: 'keyflow switch --workspace=practice',
    lines: [
      'Loading prose engine...',
      'Restoring practice session...',
      'Practice workspace ready.',
    ],
  },
};

let activeTerminal = null;

function showModeTransition(fromPath, toPath) {
  const key = `${fromPath}->${toPath}`;
  const script = MODE_TRANSITIONS[key];
  if (!script) return;

  if (activeTerminal) {
    activeTerminal.destroy();
    activeTerminal = null;
  }

  const overlay = document.createElement('div');
  overlay.className = 'kf-terminal-overlay';

  const terminal = createTerminal({
    command: script.command,
    lines: script.lines,
    onComplete: () => {
      setTimeout(() => {
        overlay.remove();
        if (activeTerminal === terminal) activeTerminal = null;
      }, 350);
    },
  });

  overlay.appendChild(terminal.el);
  document.body.appendChild(overlay);
  activeTerminal = terminal;
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
      label: 'Themes Gallery',
      description: 'Explore live themes (Midnight, Aurora, Ocean, Arctic, and more)',
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
      category: 'Themes',
      label: 'Switch to Midnight',
      description: 'Deep navy, teal accent',
      icon: '<i data-lucide="sparkles"></i>',
      action: () => applyTheme('midnight')
    },
    {
      category: 'Themes',
      label: 'Switch to Aurora',
      description: 'Near-black with violet/teal accents',
      icon: '<i data-lucide="moon"></i>',
      action: () => applyTheme('aurora')
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

  // 3. Render Footer
  const footerComponent = createFooter();
  app.appendChild(footerComponent);

  // 4. Initialize Command Palette
  initCommandPalette();

  // 5. Register all routes
  for (const [path] of Object.entries(pageLoaders)) {
    addRoute(path, createLazyPage(path));
  }

  // 6. Listen to route changes to update active state on Nav, and show a
  // brief terminal-style loading state when switching between the Practice
  // and Developer workspaces.
  let previousPath = window.location.hash.replace('#', '') || '/';
  onRouteChange((newPath) => {
    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(link => {
      const target = link.getAttribute('href').replace('#', '') || '/';
      if (target === newPath) link.classList.add('active');
      else link.classList.remove('active');
    });

    showModeTransition(previousPath, newPath);
    previousPath = newPath;
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
