/**
 * Charts — SVG, not canvas.
 *
 * Canvas was replaced deliberately:
 *   - Canvas needs manual devicePixelRatio handling or it renders soft on
 *     HiDPI displays. SVG is resolution-independent by definition.
 *   - Canvas captures colours at draw time, so a light/dark switch left the
 *     old stroke colour behind. SVG referencing var(--token) re-resolves on
 *     every repaint with no listener.
 *   - SVG nodes are real DOM, so they can carry accessible names.
 *
 * All charts scale to their container via viewBox + preserveAspectRatio.
 */

const NS = 'http://www.w3.org/2000/svg';

const svgEl = (tag, attrs = {}) => {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
};

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** "Nice" axis bounds so gridlines land on round numbers. */
function niceScale(min, max, ticks = 4) {
  if (min === max) { min = Math.max(0, min - 1); max = max + 1; }
  const range = max - min;
  const raw = range / ticks;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag;
  return {
    min: Math.floor(min / step) * step,
    max: Math.ceil(max / step) * step,
    step,
  };
}

function emptyState(message = 'Not enough data yet') {
  const el = document.createElement('div');
  el.className = 'chart-empty';
  el.textContent = message;
  return el;
}

/**
 * Line chart with axes, gridlines, and hover readout.
 *
 * @param {number[]} data          series values
 * @param {string}   color         CSS colour (token reference is fine)
 * @param {string}   label         accessible name / tooltip noun
 * @param {string[]} [xLabels]     optional category labels
 * @param {boolean}  [area=true]   fill under the line
 */
export function createLineChart({
  data = [],
  color = 'var(--color-chart-wpm)',
  label = 'Value',
  xLabels = null,
  area = true,
  minPoints = 2,
} = {}) {
  if (!Array.isArray(data) || data.length < minPoints) {
    return emptyState(`Need at least ${minPoints} sessions to chart ${label.toLowerCase()}.`);
  }

  const W = 640;
  const H = 220;
  // Right padding leaves room for the final point's stroke and radius, which
  // would otherwise be clipped now that the SVG hides overflow.
  const PAD = { top: 14, right: 18, bottom: 26, left: 40 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const scale = niceScale(Math.min(...data), Math.max(...data));
  const x = (i) => PAD.left + (i / Math.max(data.length - 1, 1)) * plotW;
  const y = (v) => PAD.top + plotH - ((v - scale.min) / (scale.max - scale.min)) * plotH;

  const wrap = document.createElement('div');
  wrap.className = 'chart';

  const svg = svgEl('svg', {
    viewBox: `0 0 ${W} ${H}`,
    preserveAspectRatio: 'none',
    class: 'chart__svg',
    role: 'img',
    'aria-label': `${label} over ${data.length} sessions`,
  });

  // Gridlines + y-axis labels
  for (let v = scale.min; v <= scale.max + 1e-9; v += scale.step) {
    const gy = y(v);
    svg.appendChild(svgEl('line', {
      x1: PAD.left, x2: W - PAD.right, y1: gy, y2: gy,
      stroke: 'var(--chart-grid)', 'stroke-width': 1,
      'vector-effect': 'non-scaling-stroke',
    }));
    const text = svgEl('text', {
      x: PAD.left - 7, y: gy, 'text-anchor': 'end', 'dominant-baseline': 'middle',
      class: 'chart__axis-label',
    });
    text.textContent = Math.round(v);
    svg.appendChild(text);
  }

  const points = data.map((v, i) => `${x(i)},${y(v)}`).join(' ');

  if (area) {
    svg.appendChild(svgEl('polygon', {
      points: `${PAD.left},${PAD.top + plotH} ${points} ${x(data.length - 1)},${PAD.top + plotH}`,
      fill: color, opacity: 0.10,
    }));
  }

  svg.appendChild(svgEl('polyline', {
    points, fill: 'none', stroke: color, 'stroke-width': 2,
    'stroke-linejoin': 'round', 'stroke-linecap': 'round',
    'vector-effect': 'non-scaling-stroke',
  }));

  // Only mark individual points when they're far enough apart to read.
  if (data.length <= 40) {
    data.forEach((v, i) => {
      const dot = svgEl('circle', {
        cx: x(i), cy: y(v), r: 2.5, fill: color,
        class: 'chart__dot', 'data-index': i,
      });
      const title = svgEl('title');
      title.textContent = xLabels?.[i] ? `${xLabels[i]}: ${v}` : `${label}: ${v}`;
      dot.appendChild(title);
      svg.appendChild(dot);
    });
  }

  // X labels: first and last only — dense ticks are noise at this size.
  if (xLabels?.length) {
    [[0, 'start'], [data.length - 1, 'end']].forEach(([i, anchor]) => {
      if (!xLabels[i]) return;
      const t = svgEl('text', {
        x: x(i), y: H - 8, 'text-anchor': anchor, class: 'chart__axis-label',
      });
      t.textContent = xLabels[i];
      svg.appendChild(t);
    });
  }

  wrap.appendChild(svg);
  return wrap;
}

/** Horizontal bar chart — used for per-key and per-language breakdowns. */
export function createBarChart({
  data = [],
  labels = [],
  color = 'var(--color-chart-wpm)',
  colors = null,
  label = 'Value',
  unit = '',
} = {}) {
  if (!data.length) return emptyState(`No ${label.toLowerCase()} data yet.`);

  const max = Math.max(...data, 1);
  // Per-bar colours matter when the categories mean opposite things — one
  // colour for both "correct" and "incorrect" reads as a single quantity.
  const colorAt = (i) => (Array.isArray(colors) ? colors[i] ?? color : color);
  const wrap = document.createElement('div');
  wrap.className = 'chart-bars';
  wrap.setAttribute('role', 'list');
  wrap.setAttribute('aria-label', label);

  data.forEach((v, i) => {
    const row = document.createElement('div');
    row.className = 'chart-bars__row';
    row.setAttribute('role', 'listitem');
    row.innerHTML = `
      <span class="chart-bars__label">${esc(labels[i] ?? i + 1)}</span>
      <span class="chart-bars__track">
        <span class="chart-bars__fill" style="width:${(v / max) * 100}%; background:${esc(colorAt(i))}"></span>
      </span>
      <span class="chart-bars__value">${esc(v)}${esc(unit)}</span>
    `;
    wrap.appendChild(row);
  });

  return wrap;
}

/**
 * Ring gauge. Uses stroke-dasharray so the sweep animates via CSS transition
 * rather than a redraw loop.
 */
export function createRingChart({
  value = 0,
  max = 100,
  color = 'var(--color-success)',
  label = 'Accuracy',
  unit = '%',
  size = 128,
} = {}) {
  const pct = Math.max(0, Math.min(1, max ? value / max : 0));
  const R = 54;
  const C = 2 * Math.PI * R;

  const wrap = document.createElement('div');
  wrap.className = 'chart-ring';
  wrap.style.setProperty('--ring-size', `${size}px`);

  const svg = svgEl('svg', {
    viewBox: '0 0 128 128', class: 'chart-ring__svg',
    role: 'img', 'aria-label': `${label}: ${value}${unit}`,
  });

  svg.appendChild(svgEl('circle', {
    cx: 64, cy: 64, r: R, fill: 'none',
    stroke: 'var(--color-surface)', 'stroke-width': 9,
  }));

  const arc = svgEl('circle', {
    cx: 64, cy: 64, r: R, fill: 'none', stroke: color,
    'stroke-width': 9, 'stroke-linecap': 'round',
    'stroke-dasharray': C,
    'stroke-dashoffset': C - C * pct,
    transform: 'rotate(-90 64 64)',
    class: 'chart-ring__arc',
  });
  svg.appendChild(arc);

  wrap.appendChild(svg);

  const center = document.createElement('div');
  center.className = 'chart-ring__center';
  center.innerHTML = `
    <span class="chart-ring__value">${esc(value)}<span class="chart-ring__unit">${esc(unit)}</span></span>
    <span class="chart-ring__label">${esc(label)}</span>
  `;
  wrap.appendChild(center);

  return wrap;
}

/** Contribution-style heatmap for the dashboard. */
export function createHeatmap({ days = [], weeks = 26 } = {}) {
  const byDate = new Map(days.map((d) => [d.date, d.count]));
  const maxCount = Math.max(...days.map((d) => d.count), 1);

  const wrap = document.createElement('div');
  wrap.className = 'heatmap';
  wrap.setAttribute('role', 'img');
  wrap.setAttribute('aria-label', `Practice activity over the last ${weeks} weeks`);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - weeks * 7 + 1);
  // Align to Sunday so columns read as calendar weeks.
  start.setDate(start.getDate() - start.getDay());

  for (let w = 0; w < weeks; w++) {
    const col = document.createElement('div');
    col.className = 'heatmap__col';

    for (let d = 0; d < 7; d++) {
      const date = new Date(start);
      date.setDate(start.getDate() + w * 7 + d);

      const cell = document.createElement('div');
      cell.className = 'heatmap__cell';

      if (date > today) {
        cell.style.visibility = 'hidden';
      } else {
        const key = date.toISOString().slice(0, 10);
        const count = byDate.get(key) || 0;
        const level = count === 0 ? 0 : Math.min(4, Math.ceil((count / maxCount) * 4));
        cell.dataset.level = level;
        cell.title = `${count} ${count === 1 ? 'test' : 'tests'} on ${date.toLocaleDateString()}`;
      }
      col.appendChild(cell);
    }
    wrap.appendChild(col);
  }

  return wrap;
}
