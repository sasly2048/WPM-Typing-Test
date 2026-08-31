/**
 * Theme & Mode controller.
 *
 * Two independent axes plus a third visual-identity axis for normal mode:
 *
 *   SURFACE    'normal' | 'dev'       which workspace is active. Driven by
 *                                     the route, not the user — /developer
 *                                     renders the developer surface, every
 *                                     other route renders normal.
 *
 *   APPEARANCE 'light' | 'dark' | 'system'   follows the OS when 'system'.
 *                                             Normal mode honours it; the
 *                                             developer surface is always dark.
 *
 *   THEME      any id in THEMES — a full visual identity (palette, type,
 *               geometry, accent). Independent of appearance. Themes can
 *               carry their own light/dark variants: paper/serif default to
 *               light, carbon/dusk/aurora/mono default to dark, sunset has
 *               both. Theme selection wins when it conflicts with appearance
 *               for surface colours, but appearance still controls chrome
 *               like the page background and shadows.
 *
 * All three are plain attributes on <html>; every token in design-tokens.css
 * keys off them. Switching is one style recalculation, no stylesheet fetch,
 * so there is never a flash of unstyled content.
 */

import { THEMES, DEV_ACCENT_OPTIONS } from '../constants/config.js';

const APPEARANCE_KEY = 'keyflow_appearance';
const THEME_KEY = 'keyflow_theme';
const DEV_ACCENT_KEY = 'keyflow_dev_accent';

const DEV_ROUTES = new Set(['/developer']);

/**
 * Visual identity a theme falls back to. Some themes are inherently dark or
 * light and ignore the appearance toggle, so the user gets a sensible surface
 * out of the box regardless of OS setting.
 */
const THEME_APPEARANCE_BIAS = {
  paper: 'light',
  carbon: 'dark',
  dusk: 'dark',
  aurora: 'dark',
  sunset: 'light',
  serif: 'light',
  mono: 'light',
};

export const appState = {
  surface: 'normal',
  appearance: 'system',
  theme: 'paper',
  devAccent: 'phosphor',
};

const prefersDark = () =>
  window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

function resolveAppearance(pref) {
  if (pref === 'light' || pref === 'dark') return pref;
  return prefersDark() ? 'dark' : 'light';
}

/**
 * Decide the concrete light/dark for the current theme + user preference.
 * Some themes are inherently dark (carbon, dusk, aurora, mono) and override
 * the user's appearance preference; others follow it.
 */
function effectiveAppearance() {
  const bias = THEME_APPEARANCE_BIAS[appState.theme];
  if (bias) return bias;
  return resolveAppearance(appState.appearance);
}

function apply() {
  const root = document.documentElement;

  root.setAttribute('data-surface', appState.surface);
  root.setAttribute('data-theme', appState.theme);

  const dark = appState.surface === 'dev' || effectiveAppearance() === 'dark';
  root.classList.toggle('theme-dark', dark);
  root.classList.toggle('theme-light', !dark);

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

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    const c = appState.surface === 'dev'
      ? '#05070A'
      : (effectiveAppearance() === 'dark' ? '#0C0C0D' : '#FBFAF8');
    meta.setAttribute('content', c);
  }

  window.dispatchEvent(new CustomEvent('keyflow:theme-change', {
    detail: { theme: appState.theme, appearance: effectiveAppearance(), surface: appState.surface }
  }));
}

export function setSurfaceForRoute(path) {
  const next = DEV_ROUTES.has(path) ? 'dev' : 'normal';
  if (next === appState.surface) return;
  appState.surface = next;
  apply();
  window.dispatchEvent(new CustomEvent('keyflow:surface-change', { detail: { surface: next } }));
}

export function getSurface() { return appState.surface; }

export function setAppearance(pref) {
  appState.appearance = pref;
  localStorage.setItem(APPEARANCE_KEY, pref);
  apply();
}

export function getAppearance() { return appState.appearance; }
export function getResolvedAppearance() { return effectiveAppearance(); }

export function toggleAppearance() {
  setAppearance(getResolvedAppearance() === 'dark' ? 'light' : 'dark');
}

export function setTheme(themeId) {
  if (!THEMES.some((t) => t.id === themeId)) return;
  appState.theme = themeId;
  localStorage.setItem(THEME_KEY, themeId);
  apply();
}

export function getTheme() { return appState.theme; }

export function setDevAccent(name) {
  if (!DEV_ACCENTS[name]) return;
  appState.devAccent = name;
  localStorage.setItem(DEV_ACCENT_KEY, name);
  apply();
}

export function getDevAccent() { return appState.devAccent; }

/**
 * Developer-mode accent options. Each only re-points the accent ramp — the
 * rest of the terminal identity (surfaces, mono type, square corners) stays
 * constant, so these read as variants of one mode, not separate themes.
 */
export const DEV_ACCENTS = DEV_ACCENT_OPTIONS.reduce((acc, opt) => {
  acc[opt.id] = accent(opt.id);
  return acc;
}, {});

function accent(id) {
  switch (id) {
    case 'phosphor': return { label: 'Phosphor', accent: '#00E57A', hover: '#35F58F', contrast: '#04120A' };
    case 'amber':    return { label: 'Amber',    accent: '#FFB000', hover: '#FFC64D', contrast: '#1A1000' };
    case 'cyan':     return { label: 'Cyan',     accent: '#3DDCFF', hover: '#7BE8FF', contrast: '#001A20' };
    case 'magenta':  return { label: 'Magenta',  accent: '#FF6EC7', hover: '#FF9BD8', contrast: '#20031A' };
    case 'sunshine': return { label: 'Sunshine', accent: '#F5C147', hover: '#FFD974', contrast: '#1A1300' };
    case 'lavender': return { label: 'Lavender', accent: '#B19CFF', hover: '#C7B6FF', contrast: '#0E0726' };
    default:         return { label: 'Phosphor', accent: '#00E57A', hover: '#35F58F', contrast: '#04120A' };
  }
}

export function initTheme() {
  const savedAppearance = localStorage.getItem(APPEARANCE_KEY);
  if (savedAppearance) appState.appearance = savedAppearance;

  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme && THEMES.some((t) => t.id === savedTheme)) appState.theme = savedTheme;

  const savedAccent = localStorage.getItem(DEV_ACCENT_KEY);
  if (savedAccent && DEV_ACCENTS[savedAccent]) appState.devAccent = savedAccent;

  const entryPath = window.location.hash.replace('#', '') || '/';
  appState.surface = DEV_ROUTES.has(entryPath) ? 'dev' : 'normal';

  apply();

  if (window.matchMedia) {
    window
      .matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', () => {
        if (appState.appearance === 'system') apply();
      });
  }
}

export function applyTheme(name) {
  if (THEMES.some((t) => t.id === name)) {
    setTheme(name);
    return;
  }
  if (name === 'light' || name === 'dark' || name === 'system') {
    setAppearance(name);
    return;
  }
  if (DEV_ACCENTS[name]) {
    setDevAccent(name);
    return;
  }
  setTheme('paper');
}

export { THEMES, DEV_ACCENT_OPTIONS };
