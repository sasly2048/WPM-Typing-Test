/**
 * Landing.
 *
 * The fastest path to value is typing, so the hero *is* a working test rather
 * than a screenshot of one: type in it and you are already practising, with
 * the full session continuing on /practice.
 */

import { html } from '../utils/dom.js';
import { getStats } from '../services/history.js';

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const TEASER = 'the quick brown fox jumps over the lazy dog';

const FEATURES = [
  {
    icon: 'gauge',
    title: 'Measurement you can trust',
    body: 'Raw and net speed, accuracy, consistency and a focus index derived from real keystroke timing — not a single averaged number.',
  },
  {
    icon: 'code-2',
    title: 'A real code workspace',
    body: 'Syntax highlighting across 16 languages in an editor shell with a gutter, tab strip and status bar. Indentation and symbols behave like the real thing.',
  },
  {
    icon: 'activity',
    title: 'Instrumented, not guessed',
    body: 'Inspect the live event log, session JSON, stored records, network activity and frame-level performance while you type.',
  },
  {
    icon: 'line-chart',
    title: 'Progress that means something',
    body: 'Filter history by mode and window, and see whether you are genuinely improving rather than just accumulating attempts.',
  },
  {
    icon: 'keyboard',
    title: 'Built for the keyboard',
    body: 'Tab restarts, ⌘K opens the palette, every control is reachable and labelled. No pointer required.',
  },
  {
    icon: 'shield-check',
    title: 'Your data stays yours',
    body: 'Everything is stored locally by default. Export or delete all of it at any time, in one click.',
  },
];

export function render(container) {
  const stats = getStats();
  const hasHistory = stats.totalTests > 0;

  container.innerHTML = html`
    <div class="landing">
      <section class="landing__hero">
        <div class="landing__hero-inner">
          <h1 class="landing__title">
            Typing practice that<br>respects your time.
          </h1>
          <p class="landing__subtitle">
            A precise, distraction-free typing trainer with a dedicated workspace for code.
            Start typing below — no account required.
          </p>

          <div class="landing__teaser" id="landing-teaser" tabindex="0"
               role="textbox" aria-label="Try typing here to begin">
            <div class="landing__teaser-text" id="landing-teaser-text"></div>
            <div class="landing__teaser-hint" id="landing-teaser-hint">
              <i data-lucide="corner-down-left"></i> Start typing to begin a full test
            </div>
          </div>

          <div class="landing__cta">
            <a href="#/practice" class="btn btn-primary btn-lg">
              <i data-lucide="keyboard"></i> ${hasHistory ? 'Continue practising' : 'Start typing'}
            </a>
            <a href="#/developer" class="btn btn-secondary btn-lg">
              <i data-lucide="code-2"></i> Code workspace
            </a>
          </div>

          ${hasHistory ? `
            <div class="landing__resume">
              <span class="landing__resume-stat"><strong>${Math.round(stats.bestWpm)}</strong> best wpm</span>
              <span class="landing__resume-sep"></span>
              <span class="landing__resume-stat"><strong>${stats.totalTests}</strong> tests</span>
              <span class="landing__resume-sep"></span>
              <span class="landing__resume-stat"><strong>${stats.currentStreak}</strong> day streak</span>
              <a href="#/dashboard" class="landing__resume-link">View dashboard</a>
            </div>
          ` : ''}
        </div>
      </section>

      <section class="landing__section">
        <div class="landing__section-head">
          <h2 class="landing__section-title">Two modes, two identities</h2>
          <p class="landing__section-desc">
            Prose and code are different tasks. They get different interfaces, not one
            interface with a toggle.
          </p>
        </div>

        <div class="landing__modes">
          <article class="landing__mode landing__mode--normal">
            <div class="landing__mode-preview" aria-hidden="true">
              <div class="lm-bar"><span class="lm-pill"></span><span class="lm-pill lm-pill--sm"></span></div>
              <div class="lm-prose">
                <span class="lm-typed">the quick brown </span><span class="lm-caret"></span><span class="lm-pending">fox jumps over the lazy dog</span>
              </div>
              <div class="lm-hud"><span class="lm-stat"></span><span class="lm-stat lm-stat--sm"></span></div>
            </div>
            <h3 class="landing__mode-title">Practice</h3>
            <p class="landing__mode-desc">
              Warm paper, generous spacing, and controls that fade the moment you start.
              Built to be read for an hour without fatigue.
            </p>
            <a href="#/practice" class="landing__mode-link">Open practice <i data-lucide="arrow-right"></i></a>
          </article>

          <article class="landing__mode landing__mode--dev">
            <div class="landing__mode-preview landing__mode-preview--dev" aria-hidden="true">
              <div class="lm-tabs"><span class="lm-tab"></span></div>
              <div class="lm-code">
                <span class="lm-line"><span class="lm-num">1</span><span class="lm-kw"></span><span class="lm-id"></span></span>
                <span class="lm-line"><span class="lm-num">2</span><span class="lm-str"></span></span>
                <span class="lm-line"><span class="lm-num">3</span><span class="lm-id lm-id--sm"></span><span class="lm-caret lm-caret--dev"></span></span>
              </div>
              <div class="lm-status"><span class="lm-chip"></span><span class="lm-chip lm-chip--sm"></span></div>
            </div>
            <h3 class="landing__mode-title">Developer</h3>
            <p class="landing__mode-desc">
              A terminal-native editor with syntax highlighting, a line gutter, and live
              inspector panels for logs, JSON, storage, network and metrics.
            </p>
            <a href="#/developer" class="landing__mode-link">Open developer <i data-lucide="arrow-right"></i></a>
          </article>
        </div>
      </section>

      <section class="landing__section">
        <div class="landing__section-head">
          <h2 class="landing__section-title">What makes it different</h2>
        </div>
        <div class="landing__features">
          ${FEATURES.map((f) => `
            <article class="landing__feature">
              <i class="landing__feature-icon" data-lucide="${esc(f.icon)}"></i>
              <h3 class="landing__feature-title">${esc(f.title)}</h3>
              <p class="landing__feature-body">${esc(f.body)}</p>
            </article>
          `).join('')}
        </div>
      </section>

      <section class="landing__closing">
        <h2 class="landing__closing-title">Find out how fast you actually are.</h2>
        <a href="#/practice" class="btn btn-primary btn-lg">
          <i data-lucide="play"></i> Start a test
        </a>
        <p class="landing__closing-note">Free, open source, no account required.</p>
      </section>
    </div>
  `;

  /* ── live teaser ──────────────────────────────────────────────────────
     Renders the sample as spans and colours them as the visitor types. On
     the first keystroke it hands off to the real practice route, carrying
     the fact that they already started so nothing feels reset. */

  const teaser = container.querySelector('#landing-teaser');
  const textEl = container.querySelector('#landing-teaser-text');
  const hintEl = container.querySelector('#landing-teaser-hint');

  textEl.innerHTML = TEASER.split('').map((ch) =>
    `<span class="landing__teaser-char">${ch === ' ' ? '&nbsp;' : esc(ch)}</span>`
  ).join('');

  const chars = Array.from(textEl.children);
  let typed = '';
  let handedOff = false;

  const paint = () => {
    chars.forEach((el, i) => {
      el.classList.toggle('is-correct', i < typed.length && typed[i] === TEASER[i]);
      el.classList.toggle('is-wrong', i < typed.length && typed[i] !== TEASER[i]);
      el.classList.toggle('is-current', i === typed.length);
    });
  };

  const onKey = (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    if (e.key === 'Backspace') {
      e.preventDefault();
      typed = typed.slice(0, -1);
      paint();
      return;
    }

    if (e.key.length !== 1) return;
    e.preventDefault();

    typed += e.key;
    hintEl.classList.add('is-hidden');
    paint();

    // Hand off once there's a clear intent to type, not on a stray keypress.
    if (!handedOff && typed.length >= 8) {
      handedOff = true;
      window.location.hash = '#/practice';
    }
  };

  teaser.addEventListener('keydown', onKey);
  teaser.addEventListener('click', () => teaser.focus());
  paint();

  if (window.lucide) window.lucide.createIcons();

  container._destroy = () => teaser.removeEventListener('keydown', onKey);
}

export function destroy(container) {
  if (container._destroy) container._destroy();
}
