export const appState = {
  lastResult: null,
  theme: 'midnight',
};

export function initTheme() {
  const saved = localStorage.getItem('keyflow_theme');
  if (saved) {
    appState.theme = saved;
  } else {
    appState.theme = 'midnight';
  }
  document.documentElement.setAttribute('data-theme', appState.theme);
  loadThemeCSS(appState.theme);
}

function loadThemeCSS(themeName) {
  const existing = document.getElementById('theme-stylesheet');
  if (existing) existing.remove();

  const link = document.createElement('link');
  link.id = 'theme-stylesheet';
  link.rel = 'stylesheet';
  link.href = `/src/styles/themes/${themeName}.css`;
  document.head.appendChild(link);
}

export function applyTheme(themeName) {
  appState.theme = themeName;
  document.documentElement.setAttribute('data-theme', themeName);
  loadThemeCSS(themeName);
  localStorage.setItem('keyflow_theme', themeName);
}
