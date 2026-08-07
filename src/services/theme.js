/**
 * Theme & Mode controller.
 *
 * Two independent axes:
 *
 *   SURFACE  'normal' | 'dev'   which visual identity is active. Driven by
 *                               the route, not the user — /developer renders
 *                               the developer surface, everything else normal.
 *
 *   APPEARANCE 'light' | 'dark' | 'system'   user preference. Only meaningful
 *                               in the normal surface; developer mode is
 *                               always dark by design.
 *
 * Both are plain attributes on <html>, and every token in design-tokens.css
 * keys off them. Switching is one style recalculation — no stylesheet fetch,
 * so no flash of unstyled content.
 */

const APPEARANCE_KEY = 'keyflow_appearance';
const DEV_ACCENT_KEY = 'keyflow_dev_accent';

/** Routes that render in the developer surface. */
const DEV_ROUTES = new Set(['/developer']);

/**
 * Developer-mode accent options. Each only re-points the accent ramp — the
 * rest of the terminal identity (surfaces, mono type, square corners) stays
 * constant, so these read as variants of one mode, not separate themes.
 */
export const DEV_ACCENTS = {
  phosphor: { label: 'Phosphor', accent: '#00E57A', hover: '#35F58F', contrast: '#04120A' },
  amber:    { label: 'Amber',    accent: '#FFB000', hover: '#FFC64D', contrast: '#1A1000' },
  cyan:     { label: 'Cyan',     accent: '#3DDCFF', hover: '#7BE8FF', contrast: '#001A20' },
  magenta:  { label: 'Magenta',  accent: '#FF6EC7', hover: '#FF9BD8', contrast: '#20031A' },
};

export const appState = {
  surface: 'normal',
  appearance: 'system',
  devAccent: 'phosphor',
};

const prefersDark = () =>
  window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

/** Resolve 'system' into a concrete light/dark value. */
function resolveAppearance(pref) {
  if (pref === 'light' || pref === 'dark') return pref;
  return prefersDark() ? 'dark' : 'light';
}

/**
 * Push current state onto <html>. Single source of truth for how the DOM
 * looks — every setter routes through here.
 */
function apply() {
  const root = document.documentElement;

  root.setAttribute('data-surface', appState.surface);

  // Developer mode is always dark; light/dark only applies to normal.
  const dark = appState.surface === 'dev' || resolveAppearance(appState.appearance) === 'dark';
  root.classList.toggle('theme-dark', dark);

  if (appState.surface === 'dev') {
    const a = DEV_ACCENTS[appState.devAccent] || DEV_ACCENTS.phosphor;
    root.style.setProperty('--p-phos-500', a.accent);
    root.style.setProperty('--p-phos-400', a.hover);
    root.style.setProperty('--color-accent-contrast', a.contrast);
  } else {
    root.style.removeProperty('--p-phos-500');
    root.style.removeProperty('--p-phos-400');
    root.style.removeProperty('--color-accent-contrast');
  }

  // Keep browser UI (mobile address bar) in step with the surface.
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute(
      'content',
      appState.surface === 'dev' ? '#05070A' : dark ? '#0C0C0D' : '#FBFAF8'
    );
  }
}

/** Set the visual surface for a route. Called by the router on every change. */
export function setSurfaceForRoute(path) {
  const next = DEV_ROUTES.has(path) ? 'dev' : 'normal';
  if (next === appState.surface) return;
  appState.surface = next;
  apply();
  window.dispatchEvent(new CustomEvent('keyflow:surface-change', { detail: { surface: next } }));
}

export function getSurface() {
  return appState.surface;
}

/** User appearance preference — 'light' | 'dark' | 'system'. */
export function setAppearance(pref) {
  appState.appearance = pref;
  localStorage.setItem(APPEARANCE_KEY, pref);
  apply();
}

export function getAppearance() {
  return appState.appearance;
}

/** Concrete light/dark currently in effect for the normal surface. */
export function getResolvedAppearance() {
  return resolveAppearance(appState.appearance);
}

export function toggleAppearance() {
  setAppearance(getResolvedAppearance() === 'dark' ? 'light' : 'dark');
}

export function setDevAccent(name) {
  if (!DEV_ACCENTS[name]) return;
  appState.devAccent = name;
  localStorage.setItem(DEV_ACCENT_KEY, name);
  apply();
}

export function getDevAccent() {
  return appState.devAccent;
}

export function initTheme() {
  const savedAppearance = localStorage.getItem(APPEARANCE_KEY);
  if (savedAppearance) appState.appearance = savedAppearance;

  const savedAccent = localStorage.getItem(DEV_ACCENT_KEY);
  if (savedAccent && DEV_ACCENTS[savedAccent]) appState.devAccent = savedAccent;

  // Set the surface from the entry URL so a hard load on /developer never
  // paints the normal identity first.
  const entryPath = window.location.hash.replace('#', '') || '/';
  appState.surface = DEV_ROUTES.has(entryPath) ? 'dev' : 'normal';

  apply();

  // Follow the OS when the user hasn't pinned a preference.
  if (window.matchMedia) {
    window
      .matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', () => {
        if (appState.appearance === 'system') apply();
      });
  }
}

/**
 * Back-compat for older call sites that pass a named theme. Named themes are
 * gone — map the intent onto the appearance axis rather than silently no-op.
 */
export function applyTheme(name) {
  if (name === 'light' || name === 'dark' || name === 'system') {
    setAppearance(name);
    return;
  }
  if (DEV_ACCENTS[name]) {
    setDevAccent(name);
    return;
  }
  setAppearance('dark');
}
