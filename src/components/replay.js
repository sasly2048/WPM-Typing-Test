/**
 * Session replay.
 *
 * Plays back the keystroke timeline captured by StatsEngine so you can see
 * *where* time went — the hesitation before a word, the burst through an easy
 * phrase, the backspace cascade after a typo. An averaged WPM shows none of
 * that.
 *
 * Position is derived from wall-clock deltas against a start reference rather
 * than accumulated per frame, so pausing, scrubbing, speed changes and a
 * throttled tab all stay true to the original timing.
 */

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const SPEEDS = [0.5, 1, 2, 4];

/**
 * @param {object} opts
 * @param {Array}  opts.timeline    StatsEngine timeline entries
 * @param {string} opts.text        the passage that was typed
 * @param {number} opts.totalTimeMs session duration
 */
export function createReplay({ timeline = [], text = '', totalTimeMs = 0, isCode = false } = {}) {
  const el = document.createElement('div');
  // Code keeps its own line structure and scrolls; prose wraps. These need
  // opposite overflow behaviour, so the mode is carried on the element.
  el.className = isCode ? 'replay replay--code' : 'replay';

  if (!timeline.length || !text) {
    el.innerHTML = '<div class="chart-empty">No replay data for this session.</div>';
    return { el, destroy() {} };
  }

  const duration = totalTimeMs || timeline[timeline.length - 1]?.timestamp || 0;

  let playing = false;
  let speed = 1;
  let cursor = 0;        // ms into the session
  let startedAt = 0;     // performance.now() reference for the current run
  let cursorAtStart = 0; // cursor when playback last started
  let rafId = null;

  el.innerHTML = `
    <div class="replay__stage">
      <div class="replay__text" id="replay-text">
        ${text.split('').map((ch) =>
          `<span class="replay__char">${ch === ' ' ? '&nbsp;' : esc(ch)}</span>`
        ).join('')}
      </div>
      <div class="replay__caret" id="replay-caret" hidden></div>
    </div>

    <div class="replay__controls">
      <button class="btn btn-secondary btn-sm" id="replay-toggle" aria-label="Play replay">
        <i data-lucide="play"></i> <span>Play</span>
      </button>

      <input type="range" class="range replay__scrub" id="replay-scrub"
             min="0" max="${Math.round(duration)}" value="0" step="10"
             aria-label="Replay position">

      <span class="replay__time" id="replay-time">0.0s</span>

      <div class="segmented" role="group" aria-label="Playback speed">
        ${SPEEDS.map((s) => `
          <button class="segmented__item ${s === 1 ? 'active' : ''}"
                  data-speed="${s}" aria-pressed="${s === 1}">${s}×</button>
        `).join('')}
      </div>
    </div>
  `;

  const chars = Array.from(el.querySelector('#replay-text').children);
  const caret = el.querySelector('#replay-caret');
  const scrub = el.querySelector('#replay-scrub');
  const timeEl = el.querySelector('#replay-time');
  const toggle = el.querySelector('#replay-toggle');

  /**
   * Paint the state at `ms` from scratch rather than incrementally, so
   * scrubbing backwards is correct without replaying history in reverse.
   */
  function paint(ms) {
    let typed = 0;
    const status = new Array(chars.length).fill(null);

    for (const entry of timeline) {
      if (entry.timestamp > ms) break;
      if (entry.char === 'Backspace') {
        typed = Math.max(0, typed - 1);
        status[typed] = null;
        continue;
      }
      if (typed < status.length) {
        status[typed] = entry.correct ? 'correct' : 'incorrect';
      }
      typed++;
    }

    chars.forEach((c, i) => {
      c.className = 'replay__char' + (status[i] ? ` is-${status[i]}` : '');
    });

    const target = chars[Math.min(typed, chars.length - 1)];
    if (target) {
      const box = target.getBoundingClientRect();
      const stage = el.querySelector('.replay__stage').getBoundingClientRect();
      caret.hidden = false;
      caret.style.transform = `translate(${box.left - stage.left}px, ${box.top - stage.top}px)`;
    }

    timeEl.textContent = `${(ms / 1000).toFixed(1)}s`;
    // Don't fight the user while they are dragging the scrubber.
    if (document.activeElement !== scrub) scrub.value = Math.round(ms);
  }

  function setToggle(icon, label) {
    toggle.innerHTML = `<i data-lucide="${icon}"></i> <span>${label}</span>`;
    toggle.setAttribute('aria-label', `${label} replay`);
    if (window.lucide) window.lucide.createIcons();
  }

  function tick() {
    cursor = cursorAtStart + (performance.now() - startedAt) * speed;

    if (cursor >= duration) {
      cursor = duration;
      paint(cursor);
      pause();
      return;
    }

    paint(cursor);
    rafId = requestAnimationFrame(tick);
  }

  function play() {
    if (playing) return;
    if (cursor >= duration) cursor = 0; // replay from the top once finished
    playing = true;
    cursorAtStart = cursor;
    startedAt = performance.now();
    setToggle('pause', 'Pause');
    rafId = requestAnimationFrame(tick);
  }

  function pause() {
    playing = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    setToggle('play', 'Play');
  }

  toggle.addEventListener('click', () => (playing ? pause() : play()));

  scrub.addEventListener('input', () => {
    cursor = Number(scrub.value);
    cursorAtStart = cursor;
    startedAt = performance.now();
    paint(cursor);
  });

  el.querySelectorAll('[data-speed]').forEach((btn) => {
    btn.addEventListener('click', () => {
      speed = Number(btn.dataset.speed);
      // Re-anchor so the new speed applies from here rather than retroactively.
      cursorAtStart = cursor;
      startedAt = performance.now();
      el.querySelectorAll('[data-speed]').forEach((b) => {
        const on = b === btn;
        b.classList.toggle('active', on);
        b.setAttribute('aria-pressed', String(on));
      });
    });
  });

  paint(0);
  if (window.lucide) window.lucide.createIcons();

  return { el, destroy: pause };
}
