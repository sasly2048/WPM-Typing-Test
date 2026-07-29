import { createElement } from '../utils/dom.js';

export function createSkeleton(type = 'line', { width, height, size } = {}) {
  const el = createElement('div', { 
    className: `skeleton skeleton-${type} skeleton-shimmer`,
    'aria-hidden': 'true'
  });
  
  if (width) el.style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) el.style.height = typeof height === 'number' ? `${height}px` : height;
  if (size && type === 'circle') {
    el.style.width = typeof size === 'number' ? `${size}px` : size;
    el.style.height = typeof size === 'number' ? `${size}px` : size;
  }
  
  return el;
}
