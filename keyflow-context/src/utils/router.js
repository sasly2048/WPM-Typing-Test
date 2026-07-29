/**
 * Simple hash-based SPA router for KeyFlow.
 * Routes are defined as hash paths (e.g., #/typing, #/dashboard).
 * 
 * @module router
 */

/** @type {Map<string, { render: Function, destroy?: Function }>} */
const routes = new Map();

/** @type {{ render: Function, destroy?: Function } | null} */
let currentPage = null;

/** @type {string} */
let currentPath = '';

/** @type {HTMLElement | null} */
let appContainer = null;

/** @type {Array<(path: string) => void>} */
const listeners = [];

/**
 * Register a route with its page module.
 * @param {string} path - The hash path (e.g., '/typing')
 * @param {{ render: (container: HTMLElement) => void, destroy?: () => void }} page - Page module
 */
export function addRoute(path, page) {
  routes.set(path, page);
}

/**
 * Set the DOM element that pages render into.
 * @param {HTMLElement} container
 */
export function setContainer(container) {
  appContainer = container;
}

/**
 * Navigate to a specific route.
 * @param {string} path - The hash path (e.g., '#/typing' or '/typing')
 */
export function navigate(path) {
  const cleanPath = path.startsWith('#') ? path : `#${path}`;
  window.location.hash = cleanPath;
}

/**
 * Get the current route path.
 * @returns {string}
 */
export function getCurrentPath() {
  return currentPath;
}

/**
 * Register a callback for route changes.
 * @param {(path: string) => void} callback
 * @returns {() => void} Unsubscribe function
 */
export function onRouteChange(callback) {
  listeners.push(callback);
  return () => {
    const idx = listeners.indexOf(callback);
    if (idx > -1) listeners.splice(idx, 1);
  };
}

/**
 * Handle hash change and render the appropriate page.
 */
function handleRouteChange() {
  const hash = window.location.hash || '#/';
  const path = hash.replace('#', '') || '/';

  if (path === currentPath) return;

  // Destroy current page
  if (currentPage && currentPage.destroy) {
    try {
      currentPage.destroy();
    } catch (e) {
      console.warn('Error destroying page:', e);
    }
  }

  currentPath = path;

  // Find matching route
  const page = routes.get(path);

  if (page && appContainer) {
    currentPage = page;
    appContainer.innerHTML = '';
    
    // Smooth page transition
    appContainer.classList.add('page-transition-enter');
    page.render(appContainer);
    
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        appContainer.classList.remove('page-transition-enter');
      });
    });

    // Scroll to top on navigation
    window.scrollTo({ top: 0, behavior: 'instant' });
  } else if (appContainer) {
    // 404 fallback — redirect to home
    currentPage = null;
    navigate('/');
    return;
  }

  // Notify listeners
  listeners.forEach(cb => cb(path));
}

/**
 * Initialize the router. Call once on app start.
 */
export function initRouter() {
  window.addEventListener('hashchange', handleRouteChange);
  
  // Handle initial load
  if (!window.location.hash) {
    window.location.hash = '#/';
  }
  handleRouteChange();
}

/**
 * Clean up the router (remove event listeners).
 */
export function destroyRouter() {
  window.removeEventListener('hashchange', handleRouteChange);
  if (currentPage && currentPage.destroy) {
    currentPage.destroy();
  }
  currentPage = null;
  currentPath = '';
  routes.clear();
  listeners.length = 0;
}
