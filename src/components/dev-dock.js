/**
 * Developer-mode inspector dock.
 *
 * Five panels over real session data: logs, JSON, storage, network, metrics.
 * Each panel subscribes only while it is the visible tab, so an open dock
 * costs one live subscription rather than five.
 */

import {
  getLogs, subscribeLogs, clearLogs, getDroppedLogCount,
  getNetworkRecords, subscribeNetwork, clearNetworkRecords,
  getMetrics, subscribeMetrics,
  getStorageRecords, getStorageTotals, deleteStorageRecord,
} from '../services/instrumentation.js';

/* ── formatting helpers ────────────────────────────────────────────────── */

const pad = (n) => String(n).padStart(2, '0');

function formatTime(ts) {
  const d = new Date(ts);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${String(d.getMilliseconds()).padStart(3, '0')}`;
}

function formatBytes(n) {
  if (!n) return '0 B';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

function formatDuration(ms) {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${s % 60}s`;
}

/** Escape before any innerHTML write — log messages contain user input. */
function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ── JSON syntax highlighter ───────────────────────────────────────────── */

/**
 * Render a value as coloured JSON. Recursive rather than regex-over-a-string:
 * it keeps type information, so numbers-in-strings don't get miscoloured.
 */
function highlightJson(value, indent = 0) {
  const pad_ = '  '.repeat(indent);
  const padIn = '  '.repeat(indent + 1);

  if (value === null) return '<span class="json-null">null</span>';
  if (typeof value === 'boolean') return `<span class="json-boolean">${value}</span>`;
  if (typeof value === 'number') return `<span class="json-number">${value}</span>`;
  if (typeof value === 'string') return `<span class="json-string">"${esc(value)}"</span>`;

  if (Array.isArray(value)) {
    if (value.length === 0) return '<span class="json-punct">[]</span>';
    const items = value
      .map((v) => `${padIn}${highlightJson(v, indent + 1)}`)
      .join('<span class="json-punct">,</span>\n');
    return `<span class="json-punct">[</span>\n${items}\n${pad_}<span class="json-punct">]</span>`;
  }

  if (typeof value === 'object') {
    const keys = Object.keys(value);
    if (keys.length === 0) return '<span class="json-punct">{}</span>';
    const items = keys
      .map((k) => `${padIn}<span class="json-key">"${esc(k)}"</span><span class="json-punct">: </span>${highlightJson(value[k], indent + 1)}`)
      .join('<span class="json-punct">,</span>\n');
    return `<span class="json-punct">{</span>\n${items}\n${pad_}<span class="json-punct">}</span>`;
  }

  return `<span class="json-null">${esc(String(value))}</span>`;
}

/* ── sparkline ─────────────────────────────────────────────────────────── */

function sparkline(samples, max) {
  if (!samples.length) return '';
  const w = 100;
  const h = 24;
  const ceiling = max || Math.max(...samples, 1);
  const step = w / Math.max(samples.length - 1, 1);

  const points = samples
    .map((v, i) => `${(i * step).toFixed(1)},${(h - (Math.min(v, ceiling) / ceiling) * h).toFixed(1)}`)
    .join(' ');

  return `<svg class="dev-metric__spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">
    <polyline points="${points}" fill="none" stroke="var(--color-accent)" stroke-width="1.5"
      vector-effect="non-scaling-stroke" stroke-linejoin="round" />
  </svg>`;
}

/* ── panel definitions ─────────────────────────────────────────────────── */

const PANELS = [
  { id: 'logs',    label: 'Logs',    icon: 'scroll-text' },
  { id: 'json',    label: 'JSON',    icon: 'braces' },
  { id: 'storage', label: 'Storage', icon: 'database' },
  { id: 'network', label: 'Network', icon: 'globe' },
  { id: 'metrics', label: 'Metrics', icon: 'activity' },
];

/**
 * @param {object} opts
 * @param {() => object|null} opts.getSessionSnapshot  current session state
 *        for the JSON panel — supplied by the page so the dock stays
 *        decoupled from typing internals.
 */
export function createDevDock({ getSessionSnapshot } = {}) {
  const el = document.createElement('section');
  el.className = 'dev-dock';
  el.setAttribute('aria-label', 'Developer inspector');

  let activePanel = 'logs';
  let collapsed = false;
  let unsubscribe = null;
  let logFilter = 'all';

  el.innerHTML = `
    <div class="dev-dock__tabs" role="tablist">
      ${PANELS.map((p) => `
        <button class="dev-dock__tab ${p.id === activePanel ? 'active' : ''}"
                role="tab" data-panel="${p.id}"
                aria-selected="${p.id === activePanel}">
          ${p.label}<span class="dev-dock__count" data-count="${p.id}"></span>
        </button>
      `).join('')}
      <div class="dev-dock__actions">
        <button class="icon-btn btn-sm" data-action="clear" title="Clear panel">
          <i data-lucide="trash-2"></i>
        </button>
        <button class="icon-btn btn-sm" data-action="toggle" title="Collapse panel" aria-expanded="true">
          <i data-lucide="chevrons-down"></i>
        </button>
      </div>
    </div>
    <div class="dev-dock__body" role="tabpanel"></div>
  `;

  const body = el.querySelector('.dev-dock__body');
  const tabs = el.querySelectorAll('.dev-dock__tab');

  const setCount = (id, n) => {
    const badge = el.querySelector(`[data-count="${id}"]`);
    if (badge) badge.textContent = n > 0 ? String(n) : '';
  };

  /* ── renderers ───────────────────────────────────────────────────────── */

  function renderLogs() {
    const all = getLogs();
    const rows = logFilter === 'all' ? all : all.filter((l) => l.level === logFilter);
    setCount('logs', all.length);

    if (!rows.length) {
      body.innerHTML = `<div class="dev-dock__empty">No log entries yet — start typing to generate events.</div>`;
      return;
    }

    const dropped = getDroppedLogCount();
    const notice = dropped
      ? `<div class="dev-log__row"><span class="dev-log__time"></span><span class="dev-log__level dev-log__level--debug">···</span><span class="dev-log__meta">${dropped} earlier ${dropped === 1 ? 'entry' : 'entries'} dropped (buffer limit)</span></div>`
      : '';

    // Newest first: during a fast session the tail is what you care about.
    body.innerHTML = `<div class="dev-log">${notice}${rows.slice().reverse().map((l) => `
      <div class="dev-log__row">
        <span class="dev-log__time">${formatTime(l.t)}</span>
        <span class="dev-log__level dev-log__level--${l.level}">${l.level}</span>
        <span class="dev-log__msg">
          <span class="dev-log__meta">[${esc(l.scope)}]</span> ${esc(l.message)}
          ${l.meta ? `<span class="dev-log__meta"> ${esc(JSON.stringify(l.meta))}</span>` : ''}
        </span>
      </div>
    `).join('')}</div>`;
  }

  function renderJson() {
    const snapshot = getSessionSnapshot ? getSessionSnapshot() : null;

    let last = null;
    try {
      last = JSON.parse(sessionStorage.getItem('lastSession') || 'null');
    } catch { last = null; }

    const payload = {
      currentSession: snapshot,
      lastCompletedSession: last,
    };

    setCount('json', 0);
    body.innerHTML = `<pre class="dev-json">${highlightJson(payload)}</pre>`;
  }

  function renderStorage() {
    const rows = getStorageRecords();
    const totals = getStorageTotals();
    setCount('storage', totals.count);

    if (!rows.length) {
      body.innerHTML = `<div class="dev-dock__empty">No records persisted.</div>`;
      return;
    }

    body.innerHTML = `
      <div class="dev-records">
        <div class="dev-records__row dev-records__row--header">
          <span>key (${totals.count} records · ${formatBytes(totals.bytes)})</span>
          <span class="dev-records__size">bytes</span>
          <span>value</span>
        </div>
        ${rows.map((r, i) => `
          <div class="dev-records__row" data-record="${i}">
            <span class="dev-records__key">${esc(r.store)}:${esc(r.key)}</span>
            <span class="dev-records__size">${formatBytes(r.bytes)}</span>
            <span class="dev-records__value">${esc(
              r.count !== null ? `${r.kind}(${r.count})` : r.raw.slice(0, 90)
            )}</span>
          </div>
        `).join('')}
      </div>
    `;

    // Click a record to expand it as highlighted JSON.
    body.querySelectorAll('[data-record]').forEach((rowEl) => {
      rowEl.addEventListener('click', () => {
        const r = rows[Number(rowEl.dataset.record)];
        if (!r) return;
        body.innerHTML = `
          <div class="dev-dock__tabs" style="border-bottom:1px solid var(--color-border-subtle)">
            <button class="dev-dock__tab" data-action="back">&larr; back</button>
            <span class="dev-dock__tab" style="color:var(--color-accent)">${esc(r.store)}:${esc(r.key)}</span>
          </div>
          <pre class="dev-json">${highlightJson(r.value !== null ? r.value : r.raw)}</pre>
        `;
        body.querySelector('[data-action="back"]')?.addEventListener('click', renderStorage);
      });
    });
  }

  function renderNetwork() {
    const rows = getNetworkRecords();
    setCount('network', rows.length);

    if (!rows.length) {
      body.innerHTML = `<div class="dev-dock__empty">No requests captured this session.</div>`;
      return;
    }

    const statusClass = (r) => {
      if (r.pending) return '';
      if (r.status === 0) return 'dev-net__status--err';
      if (r.status >= 500) return 'dev-net__status--err';
      if (r.status >= 400) return 'dev-net__status--warn';
      return 'dev-net__status--ok';
    };

    body.innerHTML = `
      <div class="dev-net">
        <div class="dev-net__row dev-net__row--header">
          <span>method</span><span>status</span><span>url</span><span>time</span><span>size</span>
        </div>
        ${rows.slice().reverse().map((r) => `
          <div class="dev-net__row">
            <span class="dev-net__method">${esc(r.method)}</span>
            <span class="dev-net__status ${statusClass(r)}">${r.pending ? '···' : r.status || 'ERR'}</span>
            <span class="dev-net__url" title="${esc(r.url)}">${esc(r.url)}</span>
            <span class="dev-net__time">${r.pending ? '' : `${r.ms}ms`}</span>
            <span class="dev-net__size">${r.size ? formatBytes(r.size) : '—'}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderMetrics(m = getMetrics()) {
    setCount('metrics', 0);

    const heapPct = m.heapLimit ? (m.heapUsed / m.heapLimit) * 100 : 0;

    body.innerHTML = `
      <div class="dev-metrics">
        <div class="dev-metric">
          <div class="dev-metric__label">Frame rate</div>
          <div class="dev-metric__value">${m.fps}<span class="dev-metric__unit"> fps</span></div>
          ${sparkline(m.fpsSamples, 70)}
        </div>
        <div class="dev-metric">
          <div class="dev-metric__label">Input latency</div>
          <div class="dev-metric__value">${m.inputLatency.toFixed(1)}<span class="dev-metric__unit"> ms</span></div>
          ${sparkline(m.latencySamples)}
        </div>
        <div class="dev-metric">
          <div class="dev-metric__label">Latency p95</div>
          <div class="dev-metric__value">${m.inputLatencyP95.toFixed(1)}<span class="dev-metric__unit"> ms</span></div>
          <div class="dev-metric__label" style="margin-top:var(--space-2)">avg ${m.inputLatencyAvg.toFixed(1)} ms</div>
        </div>
        <div class="dev-metric">
          <div class="dev-metric__label">JS heap</div>
          <div class="dev-metric__value">${m.heapUsed ? formatBytes(m.heapUsed) : '—'}</div>
          ${m.heapLimit ? `<div class="dev-metric__bar"><div class="dev-metric__bar-fill" style="width:${heapPct.toFixed(1)}%"></div></div>` : ''}
        </div>
        <div class="dev-metric">
          <div class="dev-metric__label">Keystrokes</div>
          <div class="dev-metric__value">${m.keystrokes}</div>
        </div>
        <div class="dev-metric">
          <div class="dev-metric__label">Long tasks</div>
          <div class="dev-metric__value">${m.longTasks}</div>
        </div>
        <div class="dev-metric">
          <div class="dev-metric__label">DOM nodes</div>
          <div class="dev-metric__value">${m.domNodes}</div>
        </div>
        <div class="dev-metric">
          <div class="dev-metric__label">Uptime</div>
          <div class="dev-metric__value">${formatDuration(m.uptimeMs)}</div>
        </div>
      </div>
    `;
  }

  /* ── panel switching ─────────────────────────────────────────────────── */

  function detach() {
    if (unsubscribe) { unsubscribe(); unsubscribe = null; }
  }

  /**
   * Live panels re-render on a rAF tick rather than per event — a fast typist
   * can emit hundreds of log lines a second, and rebuilding the list on each
   * one would drop frames in the very view meant to measure frame drops.
   */
  function throttled(render) {
    let queued = false;
    return () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        if (!collapsed) render();
      });
    };
  }

  function showPanel(id) {
    activePanel = id;
    detach();

    tabs.forEach((t) => {
      const on = t.dataset.panel === id;
      t.classList.toggle('active', on);
      t.setAttribute('aria-selected', String(on));
    });

    if (collapsed) return;

    switch (id) {
      case 'logs':
        renderLogs();
        unsubscribe = subscribeLogs(throttled(renderLogs));
        break;
      case 'json':
        renderJson();
        break;
      case 'storage':
        renderStorage();
        break;
      case 'network':
        renderNetwork();
        unsubscribe = subscribeNetwork(throttled(renderNetwork));
        break;
      case 'metrics':
        renderMetrics();
        unsubscribe = subscribeMetrics((m) => { if (!collapsed) renderMetrics(m); });
        break;
    }

    if (window.lucide) window.lucide.createIcons();
  }

  /* ── events ──────────────────────────────────────────────────────────── */

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      if (collapsed) {
        collapsed = false;
        el.classList.remove('is-collapsed');
      }
      showPanel(tab.dataset.panel);
    });
  });

  el.querySelector('[data-action="clear"]').addEventListener('click', () => {
    if (activePanel === 'logs') { clearLogs(); renderLogs(); }
    else if (activePanel === 'network') { clearNetworkRecords(); renderNetwork(); }
    else showPanel(activePanel);
  });

  const toggleBtn = el.querySelector('[data-action="toggle"]');
  toggleBtn.addEventListener('click', () => {
    collapsed = !collapsed;
    el.classList.toggle('is-collapsed', collapsed);
    toggleBtn.setAttribute('aria-expanded', String(!collapsed));
    if (collapsed) detach();
    else showPanel(activePanel);
  });

  showPanel(activePanel);

  return {
    el,
    show: showPanel,
    refresh: () => showPanel(activePanel),
    destroy: detach,
  };
}
