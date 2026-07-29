import { createElement, on } from '../utils/dom.js';

export function createModal({ title, content, actions = [], onClose }) {
  const overlay = createElement('div', { className: 'modal-overlay', style: 'background: var(--overlay-bg);', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'modal-title' });
  const modal = createElement('div', { className: 'modal' });
  
  const header = createElement('div', { className: 'modal-header' });
  const titleEl = createElement('h2', { id: 'modal-title', textContent: title });
  const closeBtn = createElement('button', { className: 'modal-close', 'aria-label': 'Close modal', innerHTML: '&times;' });
  
  header.appendChild(titleEl);
  header.appendChild(closeBtn);
  
  const body = createElement('div', { className: 'modal-body' });
  if (typeof content === 'string') {
    body.innerHTML = content;
  } else if (content instanceof HTMLElement) {
    body.appendChild(content);
  }
  
  const footer = createElement('div', { className: 'modal-footer' });
  actions.forEach(action => {
    const btn = createElement('button', { 
      className: `btn btn-${action.type || 'secondary'}`, 
      textContent: action.label 
    });
    on(btn, 'click', action.onClick);
    footer.appendChild(btn);
  });
  
  modal.appendChild(header);
  modal.appendChild(body);
  if (actions.length > 0) modal.appendChild(footer);
  
  overlay.appendChild(modal);
  
  const close = () => {
    document.removeEventListener('keydown', handleEsc);
    if (previousFocus) previousFocus.focus();
    overlay.classList.remove('modal-visible');
    setTimeout(() => {
      overlay.remove();
      if (onClose) onClose();
    }, 300); // match transition
  };
  
  on(closeBtn, 'click', close);
  on(overlay, 'click', (e) => {
    if (e.target === overlay) close();
  });
  
  const handleEsc = (e) => {
    if (e.key === 'Escape') close();
  };
  document.addEventListener('keydown', handleEsc);

  const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  on(overlay, 'keydown', (e) => {
    if (e.key === 'Tab') {
      const focusableContent = overlay.querySelectorAll(focusableElements);
      if (focusableContent.length === 0) return;
      const first = focusableContent[0];
      const last = focusableContent[focusableContent.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          last.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    }
  });
  
  let previousFocus = null;
  const open = () => {
    previousFocus = document.activeElement;
    document.body.appendChild(overlay);
    // force reflow
    void overlay.offsetWidth;
    overlay.classList.add('modal-visible');
    closeBtn.focus();
  };
  
  return { el: overlay, open, close };
}
