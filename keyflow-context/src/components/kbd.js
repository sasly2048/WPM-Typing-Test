import { createElement } from '../utils/dom.js';

export function createKbd(shortcut) {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const displayShortcut = isMac ? shortcut.replace('Ctrl', '⌘') : shortcut;
  
  const parts = displayShortcut.split('+');
  const container = createElement('span', { className: 'kbd-container' });
  
  parts.forEach((part, index) => {
    const kbd = createElement('kbd', { className: 'kbd', textContent: part.trim() });
    container.appendChild(kbd);
    
    if (index < parts.length - 1) {
      const plus = createElement('span', { className: 'kbd-separator', textContent: '+' });
      container.appendChild(plus);
    }
  });
  
  return container;
}
