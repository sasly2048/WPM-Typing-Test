import { createElement, on, html } from '../utils/dom.js';

/**
 * Robust Button Component supporting all standard states
 * @param {Object} options
 * @param {string} options.label - Button text
 * @param {string} [options.variant='primary'] - 'primary', 'secondary', 'ghost', 'danger'
 * @param {string} [options.size='md'] - 'sm', 'md', 'lg'
 * @param {string} [options.icon] - Optional icon string or HTML
 * @param {string} [options.iconPosition='left'] - 'left' or 'right'
 * @param {Function} [options.onClick] - Click handler
 * @param {boolean} [options.disabled=false] - Initial disabled state
 * @param {boolean} [options.loading=false] - Initial loading state
 * @param {boolean} [options.fullWidth=false] - If true, button takes 100% width
 * @param {string} [options.id] - Optional ID
 * @param {string} [options.className] - Additional classes
 */
export function createButton({
  label,
  variant = 'primary',
  size = 'md',
  icon = null,
  iconPosition = 'left',
  trailingIcon = null,
  ariaLabel = null,
  onClick,
  disabled = false,
  loading = false,
  fullWidth = false,
  id = null,
  className = '',
  type = 'button'
}) {
  const el = createElement('button', {
    type,
    className: `kf-btn kf-btn-${variant} kf-btn-${size} ${fullWidth ? 'kf-btn-full' : ''} ${className}`,
    id
  });
  if (ariaLabel) el.setAttribute('aria-label', ariaLabel);

  if (disabled) {
    el.disabled = true;
    el.setAttribute('aria-disabled', 'true');
  }
  if (loading) el.style.width = el.offsetWidth + 'px';
        el.classList.add('kf-btn-loading');

  const contentSpan = createElement('span', { className: 'kf-btn-content' });
  const spinnerSpan = createElement('span', { 
    className: 'kf-btn-spinner', 
    innerHTML: '<svg viewBox="0 0 24 24" class="kf-spinner"><circle cx="12" cy="12" r="10" fill="none" stroke-width="3"></circle></svg>' 
  });

  const renderContent = () => {
    let contentHtml = '';
    if (icon && iconPosition === 'left') {
      contentHtml += `<span class="kf-btn-icon kf-btn-icon-left">${icon}</span>`;
    }
    contentHtml += `<span class="kf-btn-label">${label}</span>`;
    if (icon && iconPosition === 'right') {
      contentHtml += `<span class="kf-btn-icon kf-btn-icon-right">${icon}</span>`;
    }
    if (trailingIcon) {
      contentHtml += `<span class="kf-btn-icon kf-btn-icon-right">${trailingIcon}</span>`;
    }
    contentSpan.innerHTML = contentHtml;
  };

  renderContent();

  el.appendChild(spinnerSpan);
  el.appendChild(contentSpan);

  // Event handlers for state
  if (onClick) {
    on(el, 'click', (e) => {
      if (!el.disabled && !el.classList.contains('kf-btn-loading')) {
        // Handle ripple effect or pressed state logic if necessary (often handled via CSS :active)
        onClick(e);
      }
    });
  }
  
  // Keyboard Navigation: Enter/Space already handled natively by button element
  
  // Expose methods to update states dynamically
  return {
    el,
    setLoading: (isLoading) => {
      if (isLoading) {
        el.classList.add('kf-btn-loading');
        el.setAttribute('aria-busy', 'true');
      } else {
        el.style.width = '';
        el.classList.remove('kf-btn-loading');
        el.removeAttribute('aria-busy');
      }
    },
    setDisabled: (isDisabled) => {
      el.disabled = isDisabled;
      if (isDisabled) el.setAttribute('aria-disabled', 'true');
      else el.removeAttribute('aria-disabled');
    },
    setSuccess: (successText) => {
      el.classList.add('kf-btn-success');
      const originalLabel = label;
      contentSpan.innerHTML = `<span class="kf-btn-icon">✓</span> <span class="kf-btn-label">${successText || 'Success'}</span>`;
      setTimeout(() => {
        el.classList.remove('kf-btn-success');
        renderContent();
      }, 2000);
    },
    setError: (errorText) => {
      el.classList.add('kf-btn-error');
      const originalLabel = label;
      contentSpan.innerHTML = `<span class="kf-btn-icon">✗</span> <span class="kf-btn-label">${errorText || 'Error'}</span>`;
      setTimeout(() => {
        el.classList.remove('kf-btn-error');
        renderContent();
      }, 2000);
    },
    updateLabel: (newLabel) => {
      label = newLabel;
      renderContent();
    }
  };
}
