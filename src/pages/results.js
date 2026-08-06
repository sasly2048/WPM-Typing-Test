/**
 * Results — shown after every completed test.
 *
 * Hierarchy is deliberate: one hero number (WPM) carries the result, four
 * supporting metrics qualify it, then history and breakdown provide context.
 * Everything below the hero is progressive detail, not competition for it.
 */

import { html } from '../utils/dom.js';
import { fireConfetti } from '../components/confetti.js';
import { createLineChart, createRingChart, createBarChart } from '../components/chart.js';
import { createReplay } from '../components/replay.js';
import { getSessions, getPersonalBest } from '../services/history.js';
import { logger } from '../services/instrumentation.js';

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const MODE_LABEL = {
  paragraph: 'Prose',
  words: 'Words',
  quote: 'Quote',
  code: 'Code',
  custom: 'Custom',
};

function relativeTime(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

/** Plain-language read on the run, so the numbers mean something. */
function verdict(session, previousBest) {
  if (previousBest > 0 && session.wpm > previousBest) {
    return { tone: 'success', text: `New personal best — ${session.wpm - previousBest} wpm faster than your previous record.` };
  }
  if (session.accuracy >= 98) {
    return { tone: 'success', text: 'Excellent accuracy. Push your speed on the next run.' };
  }
  if (session.accuracy < 92) {
    return { tone: 'warning', text: 'Accuracy is holding you back — slow down slightly and errors will drop.' };
  }
  if (session.consistency && session.consistency < 70) {
    return { tone: 'warning', text: 'Your pace varied a lot. Aim for an even rhythm rather than bursts.' };
  }
  return { tone: 'info', text: 'Solid run. Keep the streak going.' };
}

export function render(container) {
  let session = null;
  try {
    session = JSON.parse(sessionStorage.getItem('lastSession') || 'null');
  } catch {
    session = null;
  }

  if (!session) {
    container.innerHTML = html`
      <div class="page page--narrow">
        <div class="empty-state">
          <i class="empty-state__icon" data-lucide="file-question"></i>
          <h2 class="empty-state__title">No results yet</h2>
          <p class="empty-state__desc">Finish a typing test and your results will appear here.</p>
          <a href="#/practice" class="btn btn-primary">Start a test</a>
        </div>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  const sessions = getSessions() || [];
  // Exclude the run just saved so "previous best" is genuinely previous.
  const priorSessions = sessions.filter((s) => s.timestamp !== session.timestamp);
  const previousBest = priorSessions.reduce((m, s) => Math.max(m, s.wpm || 0), 0);
  const isPB = previousBest > 0 && session.wpm > previousBest;
  const v = verdict(session, previousBest);

  const chars = session.chars || { correct: 0, incorrect: 0, extra: 0, missed: 0 };
  const modeLabel = MODE_LABEL[session.mode] || session.mode || 'Test';

  container.innerHTML = html`
    <div class="page page--narrow results">
      <header class="results__hero">
        <div class="results__hero-main">
          <span class="results__hero-label">Words per minute</span>
          <div class="results__hero-value" id="results-wpm">0</div>
          <div class="results__hero-meta">
            <span class="badge">${esc(modeLabel)}</span>
            ${session.language ? `<span class="badge">${esc(session.language)}</span>` : ''}
            <span class="badge">${esc(session.duration)}s</span>
            ${isPB ? '<span class="badge badge--accent">Personal best</span>' : ''}
          </div>
        </div>
        <div class="results__hero-ring" id="results-ring"></div>
      </header>

      <p class="results__verdict results__verdict--${v.tone}">${esc(v.text)}</p>

      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat">
            <span class="stat__label">Raw speed</span>
            <span class="stat__value">${esc(Math.round(session.rawWpm ?? session.wpm))}<span class="stat__unit">wpm</span></span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat">
            <span class="stat__label">Consistency</span>
            <span class="stat__value">${esc(session.consistency ?? 100)}<span class="stat__unit">%</span></span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat">
            <span class="stat__label">Errors</span>
            <span class="stat__value">${esc(session.errors ?? 0)}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat">
            <span class="stat__label">Keystrokes</span>
            <span class="stat__value">${esc(session.totalStrokes ?? 0)}</span>
          </div>
        </div>
      </div>

      <div class="results__actions">
        <a href="#${session.mode === 'code' ? '/developer' : '/practice'}" class="btn btn-primary btn-lg">
          <i data-lucide="rotate-cw"></i> Next test
        </a>
        <a href="#/dashboard" class="btn btn-secondary btn-lg">
          <i data-lucide="bar-chart-3"></i> Dashboard
        </a>
      </div>

      <section class="section" id="results-replay-section" hidden>
        <h2 class="section__label">Replay</h2>
        <p class="results__replay-hint">
          Watch the run back to see where the time actually went.
        </p>
        <div class="card" id="results-replay"></div>
      </section>

      <section class="section">
        <h2 class="section__label">Character breakdown</h2>
        <div class="card" id="results-breakdown"></div>
      </section>

      <section class="section">
        <h2 class="section__label">Recent history</h2>
        <div class="chart-card" id="results-history"></div>
      </section>
    </div>
  `;

  /* Ring gauge for accuracy. */
  container.querySelector('#results-ring').appendChild(
    createRingChart({
      value: Math.round(session.accuracy ?? 0),
      max: 100,
      label: 'Accuracy',
      color: session.accuracy >= 95 ? 'var(--color-success)'
           : session.accuracy >= 88 ? 'var(--color-warning)'
           : 'var(--color-error)',
    })
  );

  /* Replay, when a timeline was captured for this run. Absent for sessions
     restored from history, since only the most recent one keeps a timeline. */
  let replay = null;
  try {
    const stored = JSON.parse(sessionStorage.getItem('lastReplay') || 'null');
    if (stored?.timeline?.length) {
      replay = createReplay(stored);
      container.querySelector('#results-replay').appendChild(replay.el);
      container.querySelector('#results-replay-section').hidden = false;
    }
  } catch (err) {
    logger.warn('replay', 'Could not restore replay', { error: err.message });
  }

  /* Character breakdown. */
  container.querySelector('#results-breakdown').appendChild(
    createBarChart({
      data: [chars.correct, chars.incorrect, chars.extra, chars.missed],
      labels: ['Correct', 'Incorrect', 'Extra', 'Missed'],
      label: 'Character breakdown',
      // These categories mean opposite things, so they must not share a hue.
      colors: [
        'var(--color-success)',
        'var(--color-error)',
        'var(--color-warning)',
        'var(--color-text-muted)',
      ],
    })
  );

  /* WPM across recent sessions, oldest first. */
  const history = sessions.slice(-20);
  container.querySelector('#results-history').appendChild(
    createLineChart({
      data: history.map((s) => s.wpm),
      xLabels: history.map((s) => relativeTime(s.timestamp)),
      label: 'WPM',
      color: 'var(--color-chart-wpm)',
    })
  );

  /* Count the hero number up. Communicates "this is the headline" without
     a decorative animation, and it lands fast enough not to delay reading. */
  const wpmEl = container.querySelector('#results-wpm');
  const target = Math.round(session.wpm ?? 0);
  const reduceMotion = document.documentElement.classList.contains('reduce-motion') ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduceMotion || target === 0) {
    wpmEl.textContent = target;
  } else {
    const DURATION = 620;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min((now - t0) / DURATION, 1);
      // easeOutExpo — fast start, settles precisely on the value.
      const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      wpmEl.textContent = Math.round(target * eased);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  if (isPB) {
    logger.info('results', `New personal best: ${session.wpm} wpm`);
    try { fireConfetti(); } catch { /* decorative only */ }
  }

  /* Surface achievements unlocked by this run. */
  try {
    const unlocked = JSON.parse(sessionStorage.getItem('newAchievements') || '[]');
    if (unlocked.length) {
      const section = document.createElement('section');
      section.className = 'section';
      section.innerHTML = `
        <h2 class="section__label">Unlocked</h2>
        <div class="grid grid--auto">
          ${unlocked.map((a) => `
            <div class="card achievement-card achievement-card--unlocked">
              <i data-lucide="${esc(a.icon || 'award')}"></i>
              <div>
                <div class="card__title">${esc(a.title || a.name || 'Achievement')}</div>
                <p class="card__desc">${esc(a.description || '')}</p>
              </div>
            </div>
          `).join('')}
        </div>
      `;
      container.querySelector('.results').appendChild(section);
      sessionStorage.removeItem('newAchievements');
    }
  } catch { /* non-critical */ }

  if (window.lucide) window.lucide.createIcons();

  // The replay drives a rAF loop; without this it survives navigation.
  container._destroy = () => replay?.destroy();
}

export function destroy(container) {
  if (container?._destroy) container._destroy();
}
