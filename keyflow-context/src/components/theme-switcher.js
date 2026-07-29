import { createElement, on } from '../utils/dom.js';

export function createThemeSwitcher({ currentTheme = 'dark', onChange }) {
  const container = createElement('div', { className: 'theme-switcher' });
  
  const themes = [
    { id: 'dark', name: 'Dark (Default)', colors: ['#0f172a', '#1e293b', '#a855f7'] },
    { id: 'light', name: 'Light', colors: ['#ffffff', '#f1f5f9', '#8b5cf6'] },
    { id: 'matrix', name: 'Matrix', colors: ['#000000', '#0a0a0a', '#22c55e'] },
    { id: 'dracula', name: 'Dracula', colors: ['#282a36', '#44475a', '#bd93f9'] },
    { id: 'nord', name: 'Nord', colors: ['#2e3440', '#3b4252', '#88c0d0'] }
  ];
  
  themes.forEach(theme => {
    const btn = createElement('button', {
      className: `theme-swatch ${currentTheme === theme.id ? 'active' : ''}`,
      'aria-label': `Select ${theme.name} theme`,
      title: theme.name
    });
    
    btn.style.background = `linear-gradient(135deg, ${theme.colors[0]} 50%, ${theme.colors[1]} 50%)`;
    btn.style.borderColor = theme.colors[2];
    
    if (currentTheme === theme.id) {
      const check = createElement('span', { className: 'theme-check', innerHTML: '✓' });
      btn.appendChild(check);
    }
    
    on(btn, 'click', () => {
      document.documentElement.setAttribute('data-theme', theme.id);
      localStorage.setItem('kf_theme', theme.id);
      if (onChange) onChange(theme.id);
      
      container.querySelectorAll('.theme-swatch').forEach(b => {
        b.classList.remove('active');
        const c = b.querySelector('.theme-check');
        if (c) c.remove();
      });
      btn.classList.add('active');
      const check = createElement('span', { className: 'theme-check', innerHTML: '✓' });
      btn.appendChild(check);
    });
    
    container.appendChild(btn);
  });
  
  return container;
}
