/**
 * Live WPM graph.
 *
 * A tiny canvas-based sparkline. The WPM value is pushed every
 * stats snapshot (every animation frame, but typically every 1-3
 * keystrokes). The graph resamples to a fixed width so it doesn't
 * repaint every frame.
 *
 * Design choices:
 *   - canvas, not SVG. A sparkline is a single closed path; SVG
 *     would burn nodes for no visual gain.
 *   - devicePixelRatio-aware. Otherwise the line is fuzzy on
 *     high-DPI screens.
 *   - tail-fade. New samples are bright; older samples fade. The
 *     eye tracks the leading edge without needing a moving line.
 *   - zero-axis. A faint baseline at 0 WPM gives the curve meaning.
 *
 * Public API: createLiveGraph(host, { maxSamples }) returns
 * { push, clear, destroy }. The host must be a positioned element
 * with a known size; we measure on every push.
 */
export const createLiveGraph = (host, opts = {}) => {
  const maxSamples = opts.maxSamples || 60;
  const color = opts.color || 'rgba(120, 200, 255, 0.95)';
  const fillColor = opts.fillColor || 'rgba(120, 200, 255, 0.12)';
  const targetLine = opts.targetLine || 80;
  const minY = opts.minY ?? 0;
  const maxY = opts.maxY ?? null; // auto if null

  if (!host) return { push: () => {}, clear: () => {}, destroy: () => {} };

  const canvas = document.createElement('canvas');
  canvas.className = 'live-graph__canvas';
  canvas.setAttribute('aria-hidden', 'true');
  host.appendChild(canvas);

  const ctx = canvas.getContext('2d', { alpha: true });
  let samples = [];
  let dpr = window.devicePixelRatio || 1;
  let cssWidth = 0;
  let cssHeight = 0;
  let rafId = 0;

  const resize = () => {
    const rect = host.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    cssWidth = Math.floor(rect.width);
    cssHeight = Math.floor(rect.height);
    canvas.width = Math.floor(cssWidth * dpr);
    canvas.height = Math.floor(cssHeight * dpr);
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const measure = () => {
    dpr = window.devicePixelRatio || 1;
    resize();
  };

  const draw = () => {
    rafId = 0;
    if (!cssWidth || !cssHeight) return;
    ctx.clearRect(0, 0, cssWidth, cssHeight);

    if (samples.length < 2) return;

    // Build a working window. We display the most recent maxSamples.
    const window = samples.length > maxSamples ? samples.slice(-maxSamples) : samples;

    // Find max for the y-scale. WPM is bounded by human typing
    // speed (~220 WPM ceiling) but the first sample can be 0; we
    // use a sensible default to avoid a 0-WPM spike. Accuracy uses
    // a fixed 0-100 scale.
    const maxWpm = maxY != null ? maxY : Math.max(40, ...window.map((s) => s.wpm));
    const minWpm = minY;
    const range = Math.max(1, maxWpm - minWpm);

    // Gridlines derive from the current theme's text color so they stay
    // visible in both dark and light themes. (They were hardcoded white,
    // which vanished on the light "paper" theme.)
    const textColor = getComputedStyle(canvas).color || 'rgb(128,128,128)';
    const gridColor = (alpha) => {
      const m = textColor.match(/(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
      return m ? `rgba(${m[1]}, ${m[2]}, ${m[3]}, ${alpha})` : `rgba(128,128,128,${alpha})`;
    };

    // Faint baseline
    ctx.lineWidth = 1;
    ctx.strokeStyle = gridColor(0.12);
    ctx.beginPath();
    ctx.moveTo(0, cssHeight);
    ctx.lineTo(cssWidth, cssHeight);
    ctx.stroke();

    // Y-axis: target tick line (e.g. 80 WPM, or 95% accuracy).
    if (targetLine && maxWpm > targetLine && targetLine > minWpm) {
      const yt = cssHeight - ((targetLine - minWpm) / range) * cssHeight;
      ctx.strokeStyle = gridColor(0.18);
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(0, yt);
      ctx.lineTo(cssWidth, yt);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // The line. We draw it as a gradient stroke from a faded
    // beginning to a bright end, so the leading edge pops.
    const n = window.length;
    const stepX = cssWidth / (maxSamples - 1);

    // Build the path
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const s = window[i];
      const x = i * stepX;
      const y = cssHeight - ((s.wpm - minWpm) / range) * cssHeight;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    // Gradient stroke: faded left to bright right
    const strokeBase = color.replace(/[\d.]+\)$/, '');
    const grad = ctx.createLinearGradient(0, 0, cssWidth, 0);
    grad.addColorStop(0, strokeBase.replace(')', ' / 0.15)').replace('rgb', 'rgba'));
    grad.addColorStop(1, color);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Filled area below the line for emphasis
    ctx.lineTo((n - 1) * stepX, cssHeight);
    ctx.lineTo(0, cssHeight);
    ctx.closePath();
    const fillBase = fillColor.replace(/[\d.]+\)$/, '');
    const fillGrad = ctx.createLinearGradient(0, 0, 0, cssHeight);
    fillGrad.addColorStop(0, fillColor);
    fillGrad.addColorStop(1, fillBase.replace(')', ' / 0)').replace('rgb', 'rgba'));
    ctx.fillStyle = fillGrad;
    ctx.fill();

    // Current value dot
    const last = window[n - 1];
    const lx = (n - 1) * stepX;
    const ly = cssHeight - ((last.wpm - minWpm) / range) * cssHeight;
    ctx.beginPath();
    ctx.arc(lx, ly, 2.5, 0, Math.PI * 2);
    const dotBase = color.replace(/[\d.]+\)$/, '');
    ctx.fillStyle = color;
    ctx.fill();
  };

  const scheduleDraw = () => {
    if (rafId) return;
    rafId = requestAnimationFrame(draw);
  };

  const push = (wpm) => {
    if (typeof wpm !== 'number' || !isFinite(wpm)) return;
    samples.push({ t: performance.now(), wpm });
    if (samples.length > 600) samples = samples.slice(-300);
    scheduleDraw();
  };

  const clear = () => {
    samples = [];
    if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
    if (ctx) ctx.clearRect(0, 0, cssWidth, cssHeight);
  };

  // ResizeObserver so the graph stays crisp on layout changes
  let ro = null;
  if (typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver(() => { measure(); scheduleDraw(); });
    ro.observe(host);
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', measure);
  }

  // Font-load: remeasure so the canvas is the right size for
  // the eventual font metrics.
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    document.fonts.ready.then(() => { measure(); scheduleDraw(); }).catch(() => {});
  }

  // Initial measure after the host is in the DOM
  requestAnimationFrame(measure);

  return {
    push,
    clear,
    destroy: () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (ro) try { ro.disconnect(); } catch (e) {}
      if (typeof window !== 'undefined') window.removeEventListener('resize', measure);
      if (canvas.parentNode) canvas.remove();
    },
  };
};
