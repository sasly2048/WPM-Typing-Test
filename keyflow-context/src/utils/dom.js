/**
 * Queries the DOM for a single element.
 * @param {string} selector - The CSS selector.
 * @param {Element|Document} [parent=document] - The parent element to query within.
 * @returns {Element|null} The matched element or null.
 */
export const $ = (selector, parent = document) => parent.querySelector(selector);

/**
 * Queries the DOM for multiple elements.
 * @param {string} selector - The CSS selector.
 * @param {Element|Document} [parent=document] - The parent element to query within.
 * @returns {NodeList} The matched elements.
 */
export const $$ = (selector, parent = document) => parent.querySelectorAll(selector);

/**
 * Creates a DOM element with attributes and children.
 * @param {string} tag - The HTML tag name.
 * @param {Object} [attrs={}] - The attributes to set.
 * @param {Array<Element|string>} [children=[]] - The child elements or text nodes.
 * @returns {Element} The created element.
 */
export const createElement = (tag, attrs = {}, children = []) => {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'className') {
      el.className = value;
    } else if (key === 'innerHTML') {
      el.innerHTML = value;
    } else if (key === 'textContent') {
      el.textContent = value;
    } else if (key === 'dataset') {
      for (const [dataKey, dataVal] of Object.entries(value)) {
        el.dataset[dataKey] = dataVal;
      }
    } else {
      el.setAttribute(key, value);
    }
  }
  children.forEach(child => {
    if (typeof child === 'string') {
      el.appendChild(document.createTextNode(child));
    } else if (child) {
      el.appendChild(child);
    }
  });
  return el;
};

/**
 * Tagged template literal for creating HTML strings.
 * Use with container.innerHTML = html`<div>...</div>`
 * @param {TemplateStringsArray} strings
 * @param {...any} values
 * @returns {string}
 */
export const html = (strings, ...values) => {
  return strings.reduce((result, str, i) => {
    const value = values[i] !== undefined && values[i] !== null ? values[i] : '';
    return result + str + value;
  }, '');
};

/**
 * Adds an event listener to an element.
 * @param {Element|Window|Document} el
 * @param {string} event
 * @param {Function} handler
 * @param {boolean|AddEventListenerOptions} [options]
 */
export const on = (el, event, handler, options = false) => {
  el.addEventListener(event, handler, options);
};

/**
 * Removes an event listener from an element.
 * @param {Element|Window|Document} el
 * @param {string} event
 * @param {Function} handler
 */
export const off = (el, event, handler) => {
  el.removeEventListener(event, handler);
};

/**
 * Adds a class to an element.
 * @param {Element} el
 * @param {string} className
 */
export const addClass = (el, className) => el.classList.add(className);

/**
 * Removes a class from an element.
 * @param {Element} el
 * @param {string} className
 */
export const removeClass = (el, className) => el.classList.remove(className);

/**
 * Toggles a class on an element.
 * @param {Element} el
 * @param {string} className
 * @param {boolean} [force]
 */
export const toggleClass = (el, className, force) => el.classList.toggle(className, force);

/**
 * Shows an element by setting display.
 * @param {Element} el
 * @param {string} [display='block']
 */
export const show = (el, display = 'block') => { el.style.display = display; };

/**
 * Hides an element by setting display to none.
 * @param {Element} el
 */
export const hide = (el) => { el.style.display = 'none'; };
