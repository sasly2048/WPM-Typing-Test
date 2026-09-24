/**
 * On-screen keyboard.
 *
 * Renders a QWERTY keyboard under the typing surface that highlights
 * (a) the next key the user should press, (b) the most recently
 * typed key (green or red, depending on accuracy), and (c) any
 * layout remapping (Dvorak, Colemak).
 *
 * This is the "active" counterpart to the static `keymap.js`
 * heatmap: that one shows aggregate mistakes; this one is the
 * live, in-the-moment guide. The two can be on the same page —
 * the heatmap above, this keyboard below — without confusion.
 *
 * Why an on-screen keyboard?
 *   - Beginner touch-typists use it to find unfamiliar keys.
 *   - Layout switchers use it to confirm the new mapping is
 *     active ("I pressed Dvorak's Y but this is showing me
 *     QWERTY's Y — is the layout really on?").
 *   - Mobile users without a physical keyboard rely on it.
 *
 * Usage:
 *   const kb = createKeyboard(host, { layout: 'qwerty' });
 *   kb.setExpected('e');   // highlights 'e' as the next key
 *   kb.setLast({ key: 't', correct: true });  // last pressed key
 */

const LAYOUTS = {
  qwerty: {
    label: 'QWERTY',
    rows: [
      ['`','1','2','3','4','5','6','7','8','9','0','-','=', { key: 'backspace', w: 2, label: '←' }],
      [{ key: 'tab', w: 1.5, label: 'Tab' },'q','w','e','r','t','y','u','i','o','p','[',']', { key: '\\', w: 1.5 }],
      [{ key: 'caps', w: 1.75, label: 'Caps' },'a','s','d','f','g','h','j','k','l',';',"'", { key: 'enter', w: 2.25, label: '↵' }],
      [{ key: 'shift', w: 2.25, label: 'Shift' },'z','x','c','v','b','n','m',',','.','/', { key: 'shift-r', w: 2.75, label: 'Shift' }],
      [{ key: 'space', w: 6.25, label: '' }],
    ],
  },
  dvorak: {
    label: 'Dvorak',
    rows: [
      ['`','1','2','3','4','5','6','7','8','9','0','[',']', { key: 'backspace', w: 2, label: '←' }],
      [{ key: 'tab', w: 1.5, label: 'Tab' },"'",',','.','p','y','f','g','c','r','l','/','=', { key: '\\', w: 1.5 }],
      [{ key: 'caps', w: 1.75, label: 'Caps' },'a','o','e','u','i','d','h','t','n','s','-', { key: 'enter', w: 2.25, label: '↵' }],
      [{ key: 'shift', w: 2.25, label: 'Shift' },';','q','j','k','x','b','m','w','v','z', { key: 'shift-r', w: 2.75, label: 'Shift' }],
      [{ key: 'space', w: 6.25, label: '' }],
    ],
  },
  colemak: {
    label: 'Colemak',
    rows: [
      ['`','1','2','3','4','5','6','7','8','9','0','-','=', { key: 'backspace', w: 2, label: '←' }],
      [{ key: 'tab', w: 1.5, label: 'Tab' },'q','w','f','p','g','j','l','u','y',';','[',']', { key: '\\', w: 1.5 }],
      [{ key: 'caps', w: 1.75, label: 'Caps' },'a','r','s','t','d','h','n','e','i','o',"'", { key: 'enter', w: 2.25, label: '↵' }],
      [{ key: 'shift', w: 2.25, label: 'Shift' },'z','x','c','v','b','k','m',',','.','/', { key: 'shift-r', w: 2.75, label: 'Shift' }],
      [{ key: 'space', w: 6.25, label: '' }],
    ],
  },
};

/**
 * Map a QWERTY key to its Dvorak / Colemak equivalent, so the
 * "next key" indicator still highlights the right physical button
 * when the user has a non-QWERTY layout active. We do this
 * optimistically by walking the layout rows in source order: the
 * "physical" QWERTY key is the one at the same index in the
 * QWERTY layout; the "logical" key (what the user must press) is
 * the one at the same index in their layout.
 */
const buildLayoutMap = (layoutId) => {
  const target = LAYOUTS[layoutId] || LAYOUTS.qwerty;
  const qwerty = LAYOUTS.qwerty;
  const map = new Map();
  for (let r = 0; r < target.rows.length; r++) {
    const trow = target.rows[r];
    const qrow = qwerty.rows[r] || [];
    for (let i = 0; i < trow.length; i++) {
      const tk = (trow[i] && trow[i].key) || trow[i];
      const qk = (qrow[i] && qrow[i].key) || qrow[i];
      if (typeof tk === 'string' && typeof qk === 'string') {
        // qk is what the user physically presses, tk is what the
        // text expects. Lookup the other direction too.
        map.set(tk, qk);
        map.set(qk, tk);
      }
    }
  }
  return map;
};

const KEY_RENDER = (k) => {
  if (typeof k === 'string') return { key: k, w: 1, label: null };
  return k;
};

export const createKeyboard = (host, { layout = 'qwerty' } = {}) => {
  if (!host) return { setExpected: () => {}, setLast: () => {}, setLayout: () => {}, destroy: () => {} };
  const lm = buildLayoutMap(layout);
  let currentLayout = layout;
  let currentExpected = '';
  let currentLast = null; // { key, correct }

  const build = () => {
    const def = LAYOUTS[currentLayout] || LAYOUTS.qwerty;
    host.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = `keyboard keyboard--${currentLayout}`;
    wrap.setAttribute('role', 'group');
    wrap.setAttribute('aria-label', `${def.label} keyboard`);
    for (const row of def.rows) {
      const r = document.createElement('div');
      r.className = 'keyboard__row';
      for (const cell of row) {
        const c = KEY_RENDER(cell);
        const k = document.createElement('div');
        k.className = 'keyboard__key';
        k.dataset.key = c.key;
        k.style.flex = `${c.w} 0 0`;
        // Use the original character (or label) on the key. Uppercase
        // letters read better at a glance on a keyboard.
        const label = c.label != null ? c.label : (c.key.length === 1 ? c.key : c.key);
        k.innerHTML = `<span class="keyboard__label">${escapeHtml(label)}</span>`;
        if (c.key === 'space') k.classList.add('keyboard__key--space');
        if (c.key === 'backspace') k.classList.add('keyboard__key--wide');
        if (c.key === 'shift' || c.key === 'shift-r') k.classList.add('keyboard__key--mod');
        r.appendChild(k);
      }
      wrap.appendChild(r);
    }
    host.appendChild(wrap);
    paint();
  };

  const escapeHtml = (s) => String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const findKeyEl = (k) => {
    if (!k) return null;
    const lower = String(k).toLowerCase();
    // The expected key is in the user's layout; the *physical* QWERTY
    // key is the one to light up if the layout differs.
    let physKey = lower;
    if (currentLayout !== 'qwerty') {
      physKey = lm.get(lower) || lower;
    }
    return host.querySelector(`.keyboard__key[data-key="${escapeAttr(physKey)}"]`);
  };

  const escapeAttr = (s) => String(s).replace(/"/g, '&quot;');

  const paint = () => {
    if (!host.firstChild) return;
    const all = host.querySelectorAll('.keyboard__key');
    all.forEach((k) => k.classList.remove('keyboard__key--next', 'keyboard__key--correct', 'keyboard__key--incorrect', 'keyboard__key--pressed'));
    if (currentLast) {
      const el = host.querySelector(`.keyboard__key[data-key="${escapeAttr(String(currentLast.key).toLowerCase())}"]`);
      if (el) {
        el.classList.add(currentLast.correct ? 'keyboard__key--correct' : 'keyboard__key--incorrect');
        el.classList.add('keyboard__key--pressed');
      }
    }
    if (currentExpected) {
      const next = findKeyEl(currentExpected);
      if (next) next.classList.add('keyboard__key--next');
    }
  };

  build();

  return {
    setExpected(key) {
      currentExpected = (key == null) ? '' : String(key);
      paint();
    },
    setLast({ key, correct } = {}) {
      currentLast = (key == null) ? null : { key: String(key).toLowerCase(), correct: !!correct };
      paint();
    },
    setLayout(id) {
      if (!LAYOUTS[id]) return;
      currentLayout = id;
      build();
    },
    getLayout: () => currentLayout,
    getLayouts: () => Object.entries(LAYOUTS).map(([id, def]) => ({ id, label: def.label })),
    destroy() { host.innerHTML = ''; },
  };
};

export { LAYOUTS };
