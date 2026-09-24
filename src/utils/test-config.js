/**
 * Test-config URL serialization.
 *
 * Every test configuration (mode, duration, wordCount, difficulty,
 * language, modifiers, theme) can be encoded as a query string. The
 * encoded URL is shareable: paste it into another tab, and the
 * practice page boots with that exact configuration.
 *
 * Format: ?c=<base64-json> — short enough for most URLs and the
 * base64 layer shields the user from the raw JSON. We deliberately
 * don't include PII or full session state.
 */

const PREFIX = 'c=';

/**
 * Encode a settings object into a URL-safe string.
 * @param {object} cfg
 * @returns {string}
 */
export const encode = (cfg) => {
  try {
    // Drop nulls and undefined so the encoded blob is short.
    const clean = Object.fromEntries(
      Object.entries(cfg).filter(([, v]) => v !== null && v !== undefined)
    );
    const json = JSON.stringify(clean);
    return PREFIX + btoa(unescape(encodeURIComponent(json)));
  } catch {
    return '';
  }
};

/**
 * Decode a config string (or a full URL) into a settings object.
 * @param {string} input  either a full URL, a query string, or the
 *                        encoded payload alone
 * @returns {object|null}
 */
export const decode = (input) => {
  if (!input) return null;
  let payload = input;
  // Strip URL prefix if present
  if (input.includes('?')) {
    const params = new URLSearchParams(input.split('?')[1]);
    payload = params.get('c') || '';
  } else if (input.startsWith(PREFIX)) {
    payload = input.slice(PREFIX.length);
  }
  if (!payload) return null;
  try {
    const json = decodeURIComponent(escape(atob(payload)));
    return JSON.parse(json);
  } catch {
    return null;
  }
};

/**
 * Patch a settings object with values from a URL parameter string,
 * if present. Returns the original object when no param exists.
 * @param {object} base
 * @param {string} search
 * @returns {object}
 */
export const applyFromUrl = (base, search) => {
  if (!search) return base;
  const cfg = decode(search);
  if (!cfg) return base;
  return { ...base, ...cfg };
};

/**
 * Build a shareable URL from a settings object and a base URL.
 * @param {string} baseUrl   e.g. window.location.origin + '/#/practice'
 * @param {object} cfg
 * @returns {string}
 */
export const buildShareUrl = (baseUrl, cfg) => {
  const enc = encode(cfg);
  if (!enc) return baseUrl;
  return `${baseUrl}?${enc}`;
};
