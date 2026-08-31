/**
 * Renders a QWERTY key heatmap. Each key shows the count of mistakes made
 * on it (incorrect/extra keystrokes), with the most-troubled keys glowing
 * more intensely. Used in the dashboard and on the practice results page
 * to surface a typist's weak keys at a glance.
 *
 * The heatmap is layout-only — callers feed in the stats map and the
 * component paints. No event listeners; pure visual.
 */

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * The QWERTY layout, row by row, top to bottom. Each key carries a width
 * factor (in em units) so wider keys like Backspace get more horizontal
 * space. Empty cells are gaps.
 */
const ROWS = [
  [
    { key: '`', w: 1 }, { key: '1', w: 1 }, { key: '2', w: 1 }, { key: '3', w: 1 },
    { key: '4', w: 1 }, { key: '5', w: 1 }, { key: '6', w: 1 }, { key: '7', w: 1 },
    { key: '8', w: 1 }, { key: '9', w: 1 }, { key: '0', w: 1 }, { key: '-', w: 1 },
    { key: '=', w: 1 }, { key: 'backspace', w: 2, label: '←' },
  ],
  [
    { key: 'tab', w: 1.5, label: 'Tab' }, { key: 'q', w: 1 }, { key: 'w', w: 1 },
    { key: 'e', w: 1 }, { key: 'r', w: 1 }, { key: 't', w: 1 }, { key: 'y', w: 1 },
    { key: 'u', w: 1 }, { key: 'i', w: 1 }, { key: 'o', w: 1 }, { key: 'p', w: 1 },
    { key: '[', w: 1 }, { key: ']', w: 1 }, { key: '\\', w: 1.5 },
  ],
  [
    { key: 'caps', w: 1.75, label: 'Caps' }, { key: 'a', w: 1 }, { key: 's', w: 1 },
    { key: 'd', w: 1 }, { key: 'f', w: 1 }, { key: 'g', w: 1 }, { key: 'h', w: 1 },
    { key: 'j', w: 1 }, { key: 'k', w: 1 }, { key: 'l', w: 1 }, { key: ';', w: 1 },
    { key: "'", w: 1 }, { key: 'enter', w: 2.25, label: '↵' },
  ],
  [
    { key: 'shift', w: 2.25, label: 'Shift' }, { key: 'z', w: 1 }, { key: 'x', w: 1 },
    { key: 'c', w: 1 }, { key: 'v', w: 1 }, { key: 'b', w: 1 }, { key: 'n', w: 1 },
    { key: 'm', w: 1 }, { key: ',', w: 1 }, { key: '.', w: 1 }, { key: '/', w: 1 },
    { key: 'shift-r', w: 2.75, label: 'Shift' },
  ],
  [
    { key: 'space', w: 6.25, label: '' },
  ],
];

function normaliseKey(k) {
  if (!k) return null;
  const lower = String(k).toLowerCase();
  if (lower === ' ') return 'space';
  if (lower === 'control' || lower === 'ctrl') return 'ctrl';
  if (lower === 'arrowup') return '↑';
  if (lower === 'arrowdown') return '↓';
  if (lower === 'arrowleft') return '←';
  if (lower === 'arrowright') return '→';
  return lower;
}

/**
 * Render the heatmap. `stats` is a map of { key: count } where higher counts
 * mean more mistakes. Levels are bucketed: 0 (none), 1-2 (occasional), 3-5
 * (frequent), 6+ (problem key).
 *
 * The component is rendered as a string of HTML; the caller is expected to
 * inject it where appropriate and re-render on data change.
 */
export function renderKeyHeatmap(stats = {}) {
  const max = Math.max(0, ...Object.values(stats));
  const level = (n) => {
    if (!n) return 0;
    if (n >= 6) return 4;
    if (n >= 3) return 3;
    if (n >= 1) return 2;
    return 1;
  };

  return `
    <div class="keymap" role="img" aria-label="Keyboard mistake heatmap">
      ${ROWS.map((row, ri) => `
        <div class="keymap__row" data-row="${ri}">
          ${row.map((k) => {
            const kk = normaliseKey(k.key);
            const count = stats[kk] || 0;
            const lvl = level(count);
            return `
              <div class="keymap__key keymap__key--lvl${lvl}"
                   style="flex: ${k.w} 0 0;"
                   title="${esc(kk)} — ${count} mistake${count === 1 ? '' : 's'}">
                <span class="keymap__label">${esc(k.label || k.key)}</span>
                ${count > 0 ? `<span class="keymap__count">${count}</span>` : ''}
              </div>
            `;
          }).join('')}
        </div>
      `).join('')}
    </div>
  `;
}

export { normaliseKey };
