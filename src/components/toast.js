import { createElement, on } from '../utils/dom.js';

let toastContainer = null;

function getToastContainer() {
  if (!toastContainer) {
    toastContainer = createElement('div', { className: 'kf-toast-container', 'aria-live': 'polite' });
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

/**
 * Robust Toast Component supporting all states (Default, Focus, Disabled, Success, Error, Loading)
 */
export function showToast({ 
  message, 
  type = 'info', // 'info', 'success', 'error', 'warning', 'loading'
  duration, 
  action = null, 
  dismissible = true 
}) {
  const container = getToastContainer();
  const defaultDurations = { success: 3000, info: 4000, warning: 6000, error: 0, loading: 0 };
  const actualDuration = duration !== undefined ? duration : (defaultDurations[type] ?? 4000);
  duration = actualDuration;
  
  const toast = createElement('div', { 
    className: `kf-toast kf-toast-${type}`, 
    role: type === 'error' ? 'alert' : 'status',
    'aria-live': type === 'error' ? 'assertive' : 'polite',
    style: 'max-width: 420px;' 
  });
  
  const iconMap = {
    success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>', 
    error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>', 
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>', 
    warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"/></svg>',
    loading: '<svg viewBox="0 0 24 24" class="kf-spinner"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"></circle></svg>'
  };
  
  const iconWrapper = createElement('span', { className: 'kf-toast-icon', innerHTML: iconMap[type] || iconMap.info });
  const contentWrapper = createElement('div', { className: 'kf-toast-content' });
  const msgEl = createElement('div', { className: 'kf-toast-message', textContent: message });
  
  contentWrapper.appendChild(msgEl);
  toast.appendChild(iconWrapper);
  toast.appendChild(contentWrapper);
  
  if (action) {
    const actionBtn = createElement('button', { className: 'kf-toast-action', textContent: action.label });
    on(actionBtn, 'click', () => {
      action.onClick();
      removeToast(toast);
    });
    // Keyboard navigation focus state
    on(actionBtn, 'keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        actionBtn.click();
      }
    });
    toast.appendChild(actionBtn);
  }
  
  if (dismissible && type !== 'loading') {
    const closeBtn = createElement('button', { 
      className: 'kf-toast-close', 
      'aria-label': 'Close toast',
      innerHTML: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>'
    });
    on(closeBtn, 'click', () => removeToast(toast));
    toast.appendChild(closeBtn);
  }
  
  // Enter animation
  container.appendChild(toast);
  // Trigger reflow
  void toast.offsetWidth;
  toast.classList.add('kf-toast-visible');
  
  let timerId;
  const startTimer = () => {
    if (duration > 0 && type !== 'loading') {
      timerId = setTimeout(() => {
        removeToast(toast);
      }, duration);
    }
  };
  
  const clearTimer = () => {
    if (timerId) clearTimeout(timerId);
  };
  
  // Pause on hover
  on(toast, 'mouseenter', clearTimer);
  on(toast, 'mouseleave', startTimer);
  // Pause on focus
  on(toast, 'focusin', clearTimer);
  on(toast, 'focusout', startTimer);
  
  startTimer();

  // Expose a way to update or remove the toast (useful for 'loading' toasts)
  return {
    el: toast,
    remove: () => removeToast(toast),
    update: (newProps) => {
      if (newProps.message) msgEl.textContent = newProps.message;
      if (newProps.type) {
        toast.className = `kf-toast kf-toast-${newProps.type} kf-toast-visible`;
        iconWrapper.innerHTML = iconMap[newProps.type] || iconMap.info;
        if (newProps.type !== 'loading' && duration > 0) {
          startTimer();
        }
      }
    }
  };
}

function removeToast(toast) {
  toast.classList.remove('kf-toast-visible');
  toast.classList.add('kf-toast-exiting');
  toast.addEventListener('transitionend', () => {
    if (toast.parentNode) toast.remove();
  });
}
