/**
 * History — all-time results browser.
 *
 * Where the results page shows the just-completed test, this page
 * shows the *full* list of saved sessions. It exists so the user
 * can look up a specific run, find their PB on a particular
 * configuration, or just scroll through history.
 *
 * Features:
 *   - Search by mode, language, or source (quote author, code file).
 *   - Filter by mode and language.
 *   - Per-mode best, with a click to copy a shareable test-config link.
 *   - Pagination (50 at a time).
 *   - "Open replay" — restore the last replay timeline into
 *     sessionStorage and navigate to /results.
 */

import { html } from '../utils/dom.js';
import { getSessions, getPersonalBest } from '../services/history.js';
import { buildShareUrl } from '../utils/test-config.js';
import { showToast } from '../components/toast.js';

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const PAGE_SIZE = 50;

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

const RELATIVE = (ts) => {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(ts).toLocaleDateString();
};

export function render(container) {
  const all = (getSessions() || []).slice().reverse(); // newest first

  const state = {
    query: '',
    mode: 'all',
    language: 'all',
    page: 0,
  };

  const renderShell = () => {
    container.innerHTML = html`
      <div class="page history">
        <header class="page-header">
          <div>
            <h1 class="page-header__title">History</h1>
            <p class="page-header__desc">Every test you've ever finished, with a search and filters.</p>
          </div>
          <div class="page-header__actions">
            <input type="search" class="input history__search" id="history-search"
                   placeholder="Search mode, language, source…" autocomplete="off">
          </div>
        </header>

        <div class="history__filters" id="history-filters"></div>

        <div class="history__list" id="history-list"></div>

        <div class="history__pager" id="history-pager"></div>
      </div>
    `;
  };

  const renderFilters = () => {
    const filtersEl = container.querySelector('#history-filters');
    if (!filtersEl) return;
    const modes = ['all', ...Array.from(new Set(all.map((s) => s.mode).filter(Boolean)))];
    const langs = ['all', ...Array.from(new Set(all.map((s) => s.language).filter(Boolean)))];
    filtersEl.innerHTML = `
      <div class="segmented" role="tablist" aria-label="Mode filter">
        ${modes.map((m) => `
          <button class="segmented__item ${state.mode === m ? 'active' : ''}"
                  role="tab" data-mode="${esc(m)}"
                  aria-selected="${state.mode === m}">${esc(m === 'all' ? 'All modes' : (MODE_LABEL[m] || m))}</button>
        `).join('')}
      </div>
      <div class="segmented" role="tablist" aria-label="Language filter">
        ${langs.slice(0, 11).map((l) => `
          <button class="segmented__item ${state.language === l ? 'active' : ''}"
                  role="tab" data-language="${esc(l)}"
                  aria-selected="${state.language === l}">${esc(l === 'all' ? 'All langs' : l.toUpperCase())}</button>
        `).join('')}
      </div>
    `;
  };

  const filtered = () => {
    const q = state.query.toLowerCase().trim();
    return all.filter((s) => {
      if (state.mode !== 'all' && s.mode !== state.mode) return false;
      if (state.language !== 'all' && (s.language || 'en') !== state.language) return false;
      if (q) {
        const hay = `${s.mode || ''} ${s.language || ''} ${s.source || ''} ${s.difficulty || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  };

  const renderList = () => {
    const list = container.querySelector('#history-list');
    const pager = container.querySelector('#history-pager');
    if (!list) return;
    const sessions = filtered();
    if (!sessions.length) {
      list.innerHTML = '<div class="empty-state"><i class="empty-state__icon" data-lucide="search-x"></i><h2 class="empty-state__title">No matching sessions</h2><p class="empty-state__desc">Try clearing the search or picking a different filter.</p></div>';
      if (pager) pager.innerHTML = '';
      if (window.lucide) window.lucide.createIcons();
      return;
    }
    const start = state.page * PAGE_SIZE;
    const page = sessions.slice(start, start + PAGE_SIZE);

    list.innerHTML = page.map((s) => {
      const pb = getPersonalBest(s.mode, { targetDuration: s.duration, targetWordCount: s.wordCount });
      const isPB = pb > 0 && s.wpm >= pb;
      return `
        <div class="card history__row" data-ts="${s.timestamp}">
          <div class="history__row-main">
            <div class="history__row-head">
              <span class="badge">${esc(MODE_LABEL[s.mode] || s.mode || 'Test')}</span>
              ${s.difficulty ? `<span class="badge">${esc(s.difficulty)}</span>` : ''}
              ${s.duration ? `<span class="badge">${esc(s.duration)}s</span>` : ''}
              ${s.wordCount ? `<span class="badge">${esc(s.wordCount)}w</span>` : ''}
              ${s.language && s.language !== 'en' ? `<span class="badge">${esc(s.language.toUpperCase())}</span>` : ''}
              ${isPB ? '<span class="badge badge--accent">PB</span>' : ''}
            </div>
            <div class="history__row-stats">
              <span class="history__row-wpm">${Math.round(s.wpm || 0)} <span class="stat__unit">wpm</span></span>
              <span class="history__row-acc">${(s.accuracy || 0).toFixed(1)}% acc</span>
              ${s.consistency != null ? `<span class="history__row-cons">${Math.round(s.consistency)}% cons</span>` : ''}
              <span class="history__row-when">${esc(RELATIVE(s.timestamp))}</span>
            </div>
            ${s.source ? `<p class="history__row-source">${esc(s.source)}</p>` : ''}
          </div>
          <div class="history__row-actions">
            <button class="btn btn-ghost btn-sm" data-action="share" title="Copy a shareable test link">
              <i data-lucide="link"></i> Share
            </button>
            <button class="btn btn-ghost btn-sm" data-action="reuse" title="Restart the test with the same configuration">
              <i data-lucide="rotate-cw"></i> Reuse
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Pager
    if (pager) {
      const total = sessions.length;
      const pages = Math.ceil(total / PAGE_SIZE);
      pager.innerHTML = pages > 1 ? `
        <button class="btn btn-ghost btn-sm" id="hist-prev" ${state.page === 0 ? 'disabled' : ''}>← Newer</button>
        <span class="history__pager-info">Page ${state.page + 1} of ${pages} · ${total} test${total === 1 ? '' : 's'}</span>
        <button class="btn btn-ghost btn-sm" id="hist-next" ${state.page >= pages - 1 ? 'disabled' : ''}>Older →</button>
      ` : '';
    }
    if (window.lucide) window.lucide.createIcons();
  };

  const wireEvents = () => {
    container.querySelector('#history-search')?.addEventListener('input', (e) => {
      state.query = e.target.value;
      state.page = 0;
      renderList();
    });
    container.addEventListener('click', (e) => {
      const modeBtn = e.target.closest('[data-mode]');
      if (modeBtn) {
        state.mode = modeBtn.dataset.mode;
        state.page = 0;
        renderFilters();
        renderList();
        return;
      }
      const langBtn = e.target.closest('[data-language]');
      if (langBtn) {
        state.language = langBtn.dataset.language;
        state.page = 0;
        renderFilters();
        renderList();
        return;
      }
      const shareBtn = e.target.closest('[data-action="share"]');
      if (shareBtn) {
        const row = shareBtn.closest('.history__row');
        const ts = Number(row?.dataset.ts);
        const s = all.find((x) => x.timestamp === ts);
        if (s) {
          const cfg = { mode: s.mode };
          if (s.duration) cfg.duration = s.duration;
          if (s.wordCount) cfg.wordCount = s.wordCount;
          if (s.difficulty) cfg.difficulty = s.difficulty;
          if (s.language) cfg.language = s.language;
          if (s.punctuation) cfg.punctuation = true;
          if (s.numbers) cfg.numbers = true;
          const url = buildShareUrl(window.location.origin + window.location.pathname + '#/practice', cfg);
          navigator.clipboard?.writeText(url).then(() => {
            shareBtn.innerHTML = '<i data-lucide="check"></i> Copied';
            if (window.lucide) window.lucide.createIcons();
            setTimeout(() => {
              shareBtn.innerHTML = '<i data-lucide="link"></i> Share';
              if (window.lucide) window.lucide.createIcons();
            }, 1500);
          });
        }
        return;
      }
      const reuseBtn = e.target.closest('[data-action="reuse"]');
      if (reuseBtn) {
        const row = reuseBtn.closest('.history__row');
        const ts = Number(row?.dataset.ts);
        const s = all.find((x) => x.timestamp === ts);
        if (s) {
          const cfg = { mode: s.mode };
          if (s.duration) cfg.duration = s.duration;
          if (s.wordCount) cfg.wordCount = s.wordCount;
          if (s.difficulty) cfg.difficulty = s.difficulty;
          if (s.language) cfg.language = s.language;
          if (s.punctuation) cfg.punctuation = true;
          if (s.numbers) cfg.numbers = true;
          const url = buildShareUrl(window.location.origin + window.location.pathname + '#/practice', cfg);
          window.location.href = url;
        }
        return;
      }
      if (e.target.closest('#hist-prev') && state.page > 0) {
        state.page--;
        renderList();
        return;
      }
      if (e.target.closest('#hist-next')) {
        state.page++;
        renderList();
        return;
      }
    });
  };

  renderShell();
  renderFilters();
  renderList();
  wireEvents();
  if (window.lucide) window.lucide.createIcons();
}

export function destroy(container) { if (container && container._destroy) container._destroy(); }
