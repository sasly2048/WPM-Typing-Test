/**
 * Results — shown after every completed test.
 *
 * Hierarchy is deliberate: one hero number (WPM) carries the result, four
 * supporting metrics qualify it, then history and breakdown provide context.
 * Everything below the hero is progressive detail, not competition for it.
 */

import { html } from '../utils/dom.js';
import { fireConfetti } from '../components/confetti.js';
import { createLineChart, createRingChart, createBarChart, createSparkline } from '../components/chart.js';
import { createReplay } from '../components/replay.js';
import { renderKeyHeatmap } from '../components/keymap.js';
import { getSessions, getPersonalBest } from '../services/history.js';
import { logger } from '../services/instrumentation.js';
import { getTheme } from '../services/theme.js';
import { renderResultCard, downloadResultCard, copyResultCard } from '../components/result-card.js';

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const MODE_LABEL = {
  paragraph: 'Prose',
  time: 'Time',
  words: 'Words',
  quote: 'Quote',
  zen: 'Zen',
  code: 'Code',
  custom: 'Custom',
  adaptive: 'Adaptive',
};

function relativeTime(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function classifyAccuracy(acc) {
  if (acc >= 98) return { tone: 'success', text: 'Excellent accuracy. Push your speed on the next run.' };
  if (acc >= 95) return { tone: 'success', text: 'Strong accuracy — you can lean into speed with confidence.' };
  if (acc >= 90) return { tone: 'info', text: 'Solid run. Keep the streak going.' };
  if (acc >= 80) return { tone: 'warning', text: 'Accuracy is holding you back — slow down slightly and errors will drop.' };
  return { tone: 'warning', text: 'Accuracy is low. Slow your pace, focus on the next keystroke.' };
}

function verdict(session, previousBest) {
  if (previousBest > 0 && session.wpm > previousBest) {
    return {
      tone: 'success',
      text: `New personal best — ${session.wpm - previousBest} wpm faster than your previous record.`,
    };
  }
  return { tone: 'info', text: '', ...classifyAccuracy(session.accuracy ?? 100) };
}

function getTestConfigSummary(session) {
  const parts = [];
  if (session.mode) parts.push(MODE_LABEL[session.mode] || session.mode);
  if (session.difficulty) parts.push(session.difficulty);
  if (session.duration) parts.push(`${session.duration}s`);
  if (session.wordCount) parts.push(`${session.wordCount} words`);
  if (session.language && session.language !== 'en') parts.push(session.language.toUpperCase());
  if (session.punctuation) parts.push('punct');
  if (session.numbers) parts.push('numbers');
  return parts.join(' · ');
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
  const priorSessions = sessions.filter((s) => s.timestamp !== session.timestamp);
  const previousBest = priorSessions.reduce((m, s) => Math.max(m, s.wpm || 0), 0);
  const isPB = previousBest > 0 && session.wpm > previousBest;
  const v = verdict(session, previousBest);
  const chars = session.chars || { correct: 0, incorrect: 0, extra: 0, missed: 0 };
  const modeLabel = MODE_LABEL[session.mode] || session.mode || 'Test';
  const consistency = session.consistency ?? session.stability;
  const rawWpm = session.rawWpm ?? session.wpm;

  container.innerHTML = html`
    <div class="page page--narrow results">
      <header class="results__hero">
        <div class="results__hero-main">
          <span class="results__hero-label">Words per minute</span>
          <div class="results__hero-value" id="results-wpm">0</div>
          <div class="results__hero-meta">
            <span class="badge">${esc(modeLabel)}</span>
            ${session.difficulty ? `<span class="badge">${esc(session.difficulty)}</span>` : ''}
            ${session.duration ? `<span class="badge">${esc(session.duration)}s</span>` : ''}
            ${session.wordCount && !session.duration ? `<span class="badge">${esc(session.wordCount)} words</span>` : ''}
            ${session.language && session.language !== 'en' ? `<span class="badge">${esc(session.language.toUpperCase())}</span>` : ''}
            ${isPB ? '<span class="badge badge--accent">Personal best</span>' : ''}
          </div>
          ${session.source ? `<p class="results__source">${esc(session.source)}</p>` : ''}
        </div>
        <div class="results__hero-ring" id="results-ring"></div>
      </header>

      <p class="results__verdict results__verdict--${v.tone}">${esc(v.text)}</p>

      <div class="stat-grid">
        <div class="stat-card stat-card--sm">
          <div class="stat">
            <span class="stat__label">Raw speed</span>
            <span class="stat__value">${esc(Math.round(rawWpm))}<span class="stat__unit">wpm</span></span>
          </div>
        </div>
        <div class="stat-card stat-card--sm">
          <div class="stat">
            <span class="stat__label">Consistency</span>
            <span class="stat__value">${consistency != null ? esc(Math.round(consistency)) : '—'}<span class="stat__unit">${consistency != null ? '%' : ''}</span></span>
          </div>
        </div>
        <div class="stat-card stat-card--sm">
          <div class="stat">
            <span class="stat__label">Burst</span>
            <span class="stat__value">${esc(Math.round(session.burstWpm ?? rawWpm))}<span class="stat__unit">wpm</span></span>
          </div>
        </div>
        <div class="stat-card stat-card--sm">
          <div class="stat">
            <span class="stat__label">Errors</span>
            <span class="stat__value">${esc(session.errors ?? (chars.incorrect + chars.extra))}</span>
          </div>
        </div>
        <div class="stat-card stat-card--sm">
          <div class="stat">
            <span class="stat__label">Keystrokes</span>
            <span class="stat__value">${esc(session.totalStrokes ?? chars.correct + chars.incorrect)}</span>
          </div>
        </div>
        <div class="stat-card stat-card--sm">
          <div class="stat">
            <span class="stat__label">Backspaces</span>
            <span class="stat__value">${esc(session.backspaceCount ?? 0)}</span>
          </div>
        </div>
      </div>

      <div class="results__actions">
        <button class="btn btn-primary btn-lg" id="results-next">
          <i data-lucide="rotate-cw"></i> Next test
        </button>
        <a href="#/dashboard" class="btn btn-secondary btn-lg">
          <i data-lucide="bar-chart-3"></i> Dashboard
        </a>
        <button class="btn btn-ghost btn-lg" id="results-share" title="Copy a shareable result snippet">
          <i data-lucide="share-2"></i> Share
        </button>
        <button class="btn btn-ghost btn-lg" id="results-image" title="Download a shareable image card">
          <i data-lucide="image"></i> Image
        </button>
        <button class="btn btn-ghost btn-lg" id="results-copy-image" title="Copy image to clipboard">
          <i data-lucide="clipboard-copy"></i> Copy image
        </button>
      </div>

      <section class="section" id="results-replay-section" hidden>
        <h2 class="section__label">Replay</h2>
        <p class="section__note">Watch the run back to see where the time actually went.</p>
        <div class="card" id="results-replay"></div>
      </section>

      <section class="section">
        <h2 class="section__label">Speed over time</h2>
        <div class="chart-card" id="results-speedcurve"></div>
      </section>

      <section class="section">
        <h2 class="section__label">Character breakdown</h2>
        <div class="chart-card" id="results-breakdown"></div>
      </section>

      ${session.mistakesByKey && Object.keys(session.mistakesByKey).length > 0 ? `
      <section class="section">
        <h2 class="section__label">Where you slipped</h2>
        <p class="section__note">The keys that caught you out, lit by how often. Drill these and your next run will be faster.</p>
        <div class="card" id="results-keymap">${renderKeyHeatmap(session.mistakesByKey)}</div>
      </section>
      ` : ''}

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

  /* Replay, when a timeline was captured for this run. */
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
      colors: [
        'var(--color-success)',
        'var(--color-error)',
        'var(--color-warning)',
        'var(--color-text-muted)',
      ],
    })
  );

  /* Speed curve. */
  const speedCurve = session.speedCurve || [];
  if (speedCurve.length > 1) {
    container.querySelector('#results-speedcurve').appendChild(
      createLineChart({
        data: speedCurve.map((s) => s.wpm),
        xLabels: speedCurve.map((s) => `${Math.round(s.timeMs / 1000)}s`),
        label: 'WPM',
        color: 'var(--color-chart-wpm)',
        area: true,
      })
    );
  } else {
    container.querySelector('#results-speedcurve').innerHTML = '<div class="chart-empty">Speed curve was too short to display.</div>';
  }

  /* WPM across recent sessions, oldest first. */
  const history = sessions.slice(-20);
  if (history.length > 1) {
    container.querySelector('#results-history').appendChild(
      createLineChart({
        data: history.map((s) => s.wpm),
        xLabels: history.map((s) => relativeTime(s.timestamp)),
        label: 'WPM',
        color: 'var(--color-chart-wpm)',
      })
    );
  } else {
    container.querySelector('#results-history').innerHTML = '<div class="chart-empty">Take a few more tests to see your trend.</div>';
  }

  /* Count the hero number up. */
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
      const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      wpmEl.textContent = Math.round(target * eased);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  if (isPB) {
    logger.info('results', `New personal best: ${session.wpm} wpm`);
    try { fireConfetti(); } catch { /* decorative only */ }
    // Big celebratory banner: a top-of-page toast that announces the PB
    // by margin. The number counter then takes the rest of the stage.
    const banner = document.createElement('div');
    banner.className = 'results__pb-banner';
    const margin = previousBest > 0 ? session.wpm - previousBest : 0;
    banner.innerHTML = `
      <div class="results__pb-banner-icon"><i data-lucide="trophy"></i></div>
      <div class="results__pb-banner-text">
        <div class="results__pb-banner-title">New personal best!</div>
        <div class="results__pb-banner-sub">${margin > 0 ? `+${margin} wpm over your previous record of ${previousBest}` : 'Your first record on this configuration'}</div>
      </div>
    `;
    container.querySelector('.results').insertBefore(banner, container.querySelector('.results__hero'));
    setTimeout(() => banner.classList.add('results__pb-banner--show'), 50);
    setTimeout(() => banner.classList.remove('results__pb-banner--show'), 5000);
    setTimeout(() => banner.remove(), 5500);
    if (window.lucide) window.lucide.createIcons();
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

  /* Next-test button: route by mode so a code test goes back to /developer. */
  container.querySelector('#results-next').addEventListener('click', () => {
    window.location.hash = '#/' + (session.mode === 'code' ? 'developer' : 'practice');
  });

  /* Share button: copy a textual summary to clipboard. */
  const shareBtn = container.querySelector('#results-share');
  if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
      const summary = [
        `KeyFlow — ${modeLabel}`,
        getTestConfigSummary(session),
        `${Math.round(session.wpm ?? 0)} wpm · ${Math.round(session.accuracy ?? 0)}% accuracy` +
          (consistency != null ? ` · ${Math.round(consistency)}% consistency` : ''),
      ].join('\n');
      try {
        await navigator.clipboard.writeText(summary);
        shareBtn.innerHTML = '<i data-lucide="check"></i> Copied';
        if (window.lucide) window.lucide.createIcons();
        setTimeout(() => {
          shareBtn.innerHTML = '<i data-lucide="share-2"></i> Share';
          if (window.lucide) window.lucide.createIcons();
        }, 1800);
      } catch {
        shareBtn.innerHTML = '<i data-lucide="x"></i> Failed';
        if (window.lucide) window.lucide.createIcons();
      }
    });
  }

  /* Image export: render a 1200x630 share card and download it. The
     user can post it to social media or save it for their records. */
  const imageBtn = container.querySelector('#results-image');
  if (imageBtn) {
    imageBtn.addEventListener('click', () => {
      const card = renderResultCard({
        session,
        theme: getTheme(),
        modeLabel,
        source: session.source,
      });
      const stamp = new Date().toISOString().slice(0, 10);
      const wpm = Math.round(session.wpm || 0);
      downloadResultCard(card, `keyflow-${modeLabel.toLowerCase()}-${wpm}wpm-${stamp}.png`);
      imageBtn.innerHTML = '<i data-lucide="check"></i> Saved';
      if (window.lucide) window.lucide.createIcons();
      setTimeout(() => {
        imageBtn.innerHTML = '<i data-lucide="image"></i> Image';
        if (window.lucide) window.lucide.createIcons();
      }, 1500);
    });
  }

  /* Clipboard image copy. Try the Clipboard API; fall back to download. */
  const copyImageBtn = container.querySelector('#results-copy-image');
  if (copyImageBtn) {
    copyImageBtn.addEventListener('click', async () => {
      const card = renderResultCard({
        session,
        theme: getTheme(),
        modeLabel,
        source: session.source,
      });
      const ok = await copyResultCard(card);
      if (ok) {
        copyImageBtn.innerHTML = '<i data-lucide="check"></i> Copied image';
        if (window.lucide) window.lucide.createIcons();
        setTimeout(() => {
          copyImageBtn.innerHTML = '<i data-lucide="clipboard-copy"></i> Copy image';
          if (window.lucide) window.lucide.createIcons();
        }, 1800);
      } else {
        copyImageBtn.innerHTML = '<i data-lucide="x"></i> Failed';
        if (window.lucide) window.lucide.createIcons();
      }
    });
  }

  if (window.lucide) window.lucide.createIcons();

  container._destroy = () => replay?.destroy();
}

export function destroy(container) {
  if (container?._destroy) container._destroy();
}
