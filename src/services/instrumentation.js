/**
 * Developer-mode instrumentation.
 *
 * Collects real telemetry the developer panels render: an event log, network
 * activity, runtime metrics, and a view over persisted records. Nothing here
 * is simulated — every row a panel shows corresponds to something that
 * actually happened in this session.
 *
 * Design constraints:
 *   - Fixed memory. Logs and samples live in ring buffers, so a long session
 *     costs the same as a short one.
 *   - Idle when unobserved. Metrics sampling only runs while a panel is
 *     subscribed; nothing polls in the background on other routes.
 *   - Never throws into the host app. Instrumentation failing must not break
 *     typing, so subscriber callbacks are isolated.
 */

/* ──────────────────────────────────────────────────────────────────────────
   Ring buffer — constant memory regardless of session length.
   ────────────────────────────────────────────────────────────────────────── */

class RingBuffer {
  constructor(capacity) {
    this.capacity = capacity;
    this.items = [];
    this.dropped = 0;
  }

  push(item) {
    this.items.push(item);
    if (this.items.length > this.capacity) {
      this.items.shift();
      this.dropped++;
    }
  }

  toArray() { return this.items.slice(); }
  get size() { return this.items.length; }

  clear() {
    this.items = [];
    this.dropped = 0;
  }
}

/* ──────────────────────────────────────────────────────────────────────────
   Tiny pub/sub. Subscribers are isolated so one bad panel can't take down
   the app or starve the others.
   ────────────────────────────────────────────────────────────────────────── */

function createEmitter() {
  const listeners = new Set();
  return {
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    emit(payload) {
      for (const fn of listeners) {
        try {
          fn(payload);
        } catch (err) {
          console.error('[instrumentation] subscriber failed', err);
        }
      }
    },
    get count() { return listeners.size; },
  };
}

/* ══════════════════════════════════════════════════════════════════════════
   LOGS
   ══════════════════════════════════════════════════════════════════════════ */

const LOG_CAPACITY = 500;
const logBuffer = new RingBuffer(LOG_CAPACITY);
const logEmitter = createEmitter();

let logSeq = 0;

/**
 * Record an event.
 * @param {'debug'|'info'|'warn'|'error'|'trace'} level
 * @param {string} scope   subsystem, e.g. 'input', 'router', 'auth'
 * @param {string} message
 * @param {object} [meta]  small structured payload
 */
export function log(level, scope, message, meta) {
  const entry = {
    id: ++logSeq,
    t: Date.now(),
    level,
    scope,
    message,
    meta: meta ?? null,
  };
  logBuffer.push(entry);
  logEmitter.emit(entry);
  return entry;
}

export const logger = {
  debug: (scope, msg, meta) => log('debug', scope, msg, meta),
  info:  (scope, msg, meta) => log('info',  scope, msg, meta),
  warn:  (scope, msg, meta) => log('warn',  scope, msg, meta),
  error: (scope, msg, meta) => log('error', scope, msg, meta),
  trace: (scope, msg, meta) => log('trace', scope, msg, meta),
};

export function getLogs() { return logBuffer.toArray(); }
export function getDroppedLogCount() { return logBuffer.dropped; }
export function subscribeLogs(fn) { return logEmitter.subscribe(fn); }

export function clearLogs() {
  logBuffer.clear();
  logEmitter.emit(null); // null signals "full refresh"
}

/* ══════════════════════════════════════════════════════════════════════════
   NETWORK
   Wraps fetch to observe requests the app (and the Firebase SDK) makes.
   ══════════════════════════════════════════════════════════════════════════ */

const NET_CAPACITY = 120;
const netBuffer = new RingBuffer(NET_CAPACITY);
const netEmitter = createEmitter();

let netSeq = 0;
let fetchPatched = false;
let originalFetch = null;

/** Strip query strings and origins so the panel shows a readable path. */
function shortenUrl(url) {
  try {
    const u = new URL(url, window.location.origin);
    const path = u.pathname.length > 1 ? u.pathname : u.hostname;
    return u.origin === window.location.origin ? path : `${u.hostname}${path}`;
  } catch {
    return String(url).slice(0, 120);
  }
}

export function installNetworkProbe() {
  if (fetchPatched || typeof window.fetch !== 'function') return;

  originalFetch = window.fetch.bind(window);
  fetchPatched = true;

  window.fetch = async (input, init) => {
    const method = (init?.method || (typeof input === 'object' && input?.method) || 'GET').toUpperCase();
    const rawUrl = typeof input === 'string' ? input : input?.url ?? String(input);
    const started = performance.now();

    const record = {
      id: ++netSeq,
      t: Date.now(),
      method,
      url: shortenUrl(rawUrl),
      status: 0,
      ok: false,
      ms: 0,
      size: 0,
      pending: true,
    };
    netBuffer.push(record);
    netEmitter.emit(record);

    try {
      const res = await originalFetch(input, init);
      record.status = res.status;
      record.ok = res.ok;
      record.ms = Math.round(performance.now() - started);
      record.pending = false;

      const len = res.headers.get('content-length');
      if (len) record.size = Number(len);

      netEmitter.emit(record);
      if (!res.ok) {
        logger.warn('net', `${method} ${record.url} -> ${res.status}`, { ms: record.ms });
      }
      return res;
    } catch (err) {
      record.status = 0;
      record.ok = false;
      record.ms = Math.round(performance.now() - started);
      record.pending = false;
      record.error = err?.message || 'network error';
      netEmitter.emit(record);
      logger.error('net', `${method} ${record.url} failed`, { error: record.error });
      throw err;
    }
  };
}

export function getNetworkRecords() { return netBuffer.toArray(); }
export function subscribeNetwork(fn) { return netEmitter.subscribe(fn); }
export function clearNetworkRecords() { netBuffer.clear(); netEmitter.emit(null); }

/* ══════════════════════════════════════════════════════════════════════════
   METRICS
   Frame rate, input latency, heap. Sampling runs only while observed.
   ══════════════════════════════════════════════════════════════════════════ */

const SAMPLE_CAPACITY = 60;

const metricsState = {
  fps: 0,
  fpsSamples: new RingBuffer(SAMPLE_CAPACITY),
  inputLatency: 0,
  latencySamples: new RingBuffer(SAMPLE_CAPACITY),
  heapUsed: 0,
  heapLimit: 0,
  longTasks: 0,
  keystrokes: 0,
  domNodes: 0,
  sessionStart: Date.now(),
};

const metricsEmitter = createEmitter();

let rafId = null;
let heapTimer = null;
let longTaskObserver = null;
let frameCount = 0;
let lastFpsStamp = 0;

function sampleFrame(now) {
  frameCount++;
  if (!lastFpsStamp) lastFpsStamp = now;

  const elapsed = now - lastFpsStamp;
  if (elapsed >= 1000) {
    metricsState.fps = Math.round((frameCount * 1000) / elapsed);
    metricsState.fpsSamples.push(metricsState.fps);
    frameCount = 0;
    lastFpsStamp = now;
    metricsState.domNodes = document.getElementsByTagName('*').length;
    metricsEmitter.emit(getMetrics());
  }

  rafId = requestAnimationFrame(sampleFrame);
}

function sampleHeap() {
  // performance.memory is Chromium-only; absent elsewhere, so guard it.
  const mem = performance.memory;
  if (mem) {
    metricsState.heapUsed = mem.usedJSHeapSize;
    metricsState.heapLimit = mem.jsHeapSizeLimit;
  }
  metricsEmitter.emit(getMetrics());
}

/**
 * Record how long the app took to respond to a keystroke. Called by the
 * typing pages with the timestamp captured at keydown.
 */
export function recordInputLatency(startedAt) {
  const ms = performance.now() - startedAt;
  metricsState.inputLatency = ms;
  metricsState.latencySamples.push(ms);
  metricsState.keystrokes++;
}

export function getMetrics() {
  const latencies = metricsState.latencySamples.toArray();
  const sorted = latencies.slice().sort((a, b) => a - b);

  return {
    fps: metricsState.fps,
    fpsSamples: metricsState.fpsSamples.toArray(),
    inputLatency: metricsState.inputLatency,
    inputLatencyAvg: latencies.length
      ? latencies.reduce((s, v) => s + v, 0) / latencies.length
      : 0,
    inputLatencyP95: sorted.length ? sorted[Math.floor(sorted.length * 0.95)] : 0,
    latencySamples: latencies,
    heapUsed: metricsState.heapUsed,
    heapLimit: metricsState.heapLimit,
    longTasks: metricsState.longTasks,
    keystrokes: metricsState.keystrokes,
    domNodes: metricsState.domNodes,
    uptimeMs: Date.now() - metricsState.sessionStart,
  };
}

/**
 * Begin sampling. Returns an unsubscribe that also stops sampling once the
 * last observer detaches — no background cost when no panel is open.
 */
export function subscribeMetrics(fn) {
  const unsubscribe = metricsEmitter.subscribe(fn);

  if (metricsEmitter.count === 1) {
    lastFpsStamp = 0;
    frameCount = 0;
    rafId = requestAnimationFrame(sampleFrame);
    heapTimer = setInterval(sampleHeap, 2000);
    sampleHeap();

    if (typeof PerformanceObserver === 'function') {
      try {
        longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            metricsState.longTasks++;
            logger.warn('perf', `Long task ${Math.round(entry.duration)}ms`, {
              duration: Math.round(entry.duration),
            });
          }
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });
      } catch {
        // longtask unsupported in this browser — metrics degrade, nothing breaks.
        longTaskObserver = null;
      }
    }
  }

  return () => {
    unsubscribe();
    if (metricsEmitter.count === 0) stopMetrics();
  };
}

function stopMetrics() {
  if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  if (heapTimer) { clearInterval(heapTimer); heapTimer = null; }
  if (longTaskObserver) { longTaskObserver.disconnect(); longTaskObserver = null; }
}

/* ══════════════════════════════════════════════════════════════════════════
   STORAGE / RECORDS
   Live view over what the app has actually persisted.
   ══════════════════════════════════════════════════════════════════════════ */

const byteLength = (s) => new Blob([s]).size;

export function getStorageRecords() {
  const rows = [];

  const collect = (store, storeName) => {
    for (let i = 0; i < store.length; i++) {
      const key = store.key(i);
      if (key === null) continue;
      const raw = store.getItem(key) ?? '';

      let parsed = null;
      let kind = 'string';
      try {
        parsed = JSON.parse(raw);
        kind = Array.isArray(parsed) ? 'array' : typeof parsed === 'object' && parsed !== null ? 'object' : typeof parsed;
      } catch {
        kind = 'string';
      }

      rows.push({
        store: storeName,
        key,
        kind,
        bytes: byteLength(raw),
        count: Array.isArray(parsed) ? parsed.length : null,
        raw,
        value: parsed,
      });
    }
  };

  try { collect(localStorage, 'local'); } catch { /* storage blocked */ }
  try { collect(sessionStorage, 'session'); } catch { /* storage blocked */ }

  return rows.sort((a, b) => b.bytes - a.bytes);
}

export function getStorageTotals() {
  const rows = getStorageRecords();
  return {
    count: rows.length,
    bytes: rows.reduce((sum, r) => sum + r.bytes, 0),
  };
}

export function deleteStorageRecord(store, key) {
  try {
    (store === 'session' ? sessionStorage : localStorage).removeItem(key);
    logger.warn('storage', `Deleted ${store}:${key}`);
    return true;
  } catch {
    return false;
  }
}

/* ══════════════════════════════════════════════════════════════════════════
   Bootstrap
   ══════════════════════════════════════════════════════════════════════════ */

let installed = false;

/** Install global probes once, at app start. */
export function initInstrumentation() {
  if (installed) return;
  installed = true;

  installNetworkProbe();

  window.addEventListener('error', (e) => {
    logger.error('window', e.message, {
      source: e.filename ? shortenUrl(e.filename) : undefined,
      line: e.lineno,
    });
  });

  window.addEventListener('unhandledrejection', (e) => {
    logger.error('promise', String(e.reason?.message || e.reason || 'unhandled rejection'));
  });

  logger.info('app', 'KeyFlow session started', {
    ua: navigator.userAgent.slice(0, 60),
    viewport: `${window.innerWidth}x${window.innerHeight}`,
  });
}
