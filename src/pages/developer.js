/**
 * Developer workspace.
 *
 * An IDE shell: activity rail, language explorer, tab strip, gutter + editor,
 * inspector dock, status bar. The visual identity comes from the developer
 * token scope (set on <html> by the router), so nothing here hardcodes colour.
 */

import { html } from '../utils/dom.js';
import { InputEngine } from '../engines/InputEngine.js';
import { RenderEngine } from '../engines/RenderEngine.js';
import { StatsEngine } from '../engines/StatsEngine.js';
import { CodeAdapter } from '../adapters/CodeAdapter.js';
import { getText } from '../services/text-provider.js';
import { MODES } from '../constants/config.js';
import { tokenize } from '../syntax/tokenizer.js';
import { javascript } from '../syntax/languages/javascript.js';
import { python } from '../syntax/languages/python.js';
import { createDevDock } from '../components/dev-dock.js';
import { logger, recordInputLatency } from '../services/instrumentation.js';
import { calculateConsistency } from '../services/stats-engine.js';
import { saveSession } from '../services/history.js';

const LANGUAGES = [
  { id: 'javascript', label: 'javascript', ext: 'js',    icon: 'file-code' },
  { id: 'typescript', label: 'typescript', ext: 'ts',    icon: 'file-code-2' },
  { id: 'python',     label: 'python',     ext: 'py',    icon: 'file-terminal' },
  { id: 'c',          label: 'c',          ext: 'c',     icon: 'file-text' },
  { id: 'cpp',        label: 'cpp',        ext: 'cpp',   icon: 'file-code' },
  { id: 'java',       label: 'java',       ext: 'java',  icon: 'file-code' },
  { id: 'go',         label: 'go',         ext: 'go',    icon: 'file-code-2' },
  { id: 'rust',       label: 'rust',       ext: 'rs',    icon: 'file-cog' },
  { id: 'kotlin',     label: 'kotlin',     ext: 'kt',    icon: 'file-code' },
  { id: 'swift',      label: 'swift',      ext: 'swift', icon: 'file-code' },
  { id: 'html',       label: 'html',       ext: 'html',  icon: 'file-type-2' },
  { id: 'css',        label: 'css',        ext: 'css',   icon: 'palette' },
  { id: 'sql',        label: 'sql',        ext: 'sql',   icon: 'database' },
  { id: 'json',       label: 'json',       ext: 'json',  icon: 'file-json' },
  { id: 'markdown',   label: 'markdown',   ext: 'md',    icon: 'file-text' },
  { id: 'bash',       label: 'bash',       ext: 'sh',    icon: 'terminal' },
];

const escapeHtml = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function render(container) {
  let langId = localStorage.getItem('keyflow_dev_lang') || 'javascript';
  const getLang = (id) => LANGUAGES.find((l) => l.id === id) || LANGUAGES[0];

  let inputEngine = null;
  const statsEngine = new StatsEngine();
  let renderEngine = null;
  let adapter = null;
  let dock = null;
  let locked = false;
  let started = false;

  container.innerHTML = html`
    <div class="dev-shell" id="dev-shell">
      <nav class="dev-rail" aria-label="Inspector panels">
        <button class="dev-rail__btn active" data-rail="explorer" title="Explorer" aria-label="Toggle explorer">
          <i data-lucide="files"></i>
        </button>
        <button class="dev-rail__btn" data-rail="logs" title="Logs" aria-label="Show logs">
          <i data-lucide="scroll-text"></i>
        </button>
        <button class="dev-rail__btn" data-rail="json" title="Session JSON" aria-label="Show session JSON">
          <i data-lucide="braces"></i>
        </button>
        <button class="dev-rail__btn" data-rail="storage" title="Storage records" aria-label="Show storage">
          <i data-lucide="database"></i>
        </button>
        <button class="dev-rail__btn" data-rail="network" title="Network" aria-label="Show network">
          <i data-lucide="globe"></i>
        </button>
        <button class="dev-rail__btn" data-rail="metrics" title="Metrics" aria-label="Show metrics">
          <i data-lucide="activity"></i>
        </button>
        <div class="dev-rail__spacer"></div>
      </nav>

      <aside class="dev-explorer" aria-label="Languages">
        <div class="dev-explorer__header">
          <span>explorer</span>
          <span>${LANGUAGES.length}</span>
        </div>
        <div class="dev-explorer__list" role="listbox" aria-label="Select language">
          ${LANGUAGES.map((l) => `
            <div class="dev-file ${l.id === langId ? 'active' : ''}"
                 role="option" tabindex="0"
                 aria-selected="${l.id === langId}" data-lang="${l.id}">
              <i data-lucide="${l.icon}"></i>
              <span>${l.label}</span>
              <span class="dev-file__ext">.${l.ext}</span>
            </div>
          `).join('')}
        </div>
      </aside>

      <div class="dev-main">
        <div class="dev-tabs">
          <div class="dev-tab">
            <i data-lucide="${getLang(langId).icon}"></i>
            <span id="dev-filename">${getLang(langId).label}.${getLang(langId).ext}</span>
          </div>
          <div class="dev-tabs__actions">
            <button class="btn btn-ghost btn-sm" id="dev-restart" title="New snippet (Tab)">
              <i data-lucide="rotate-cw"></i>
              <span>new</span>
            </button>
          </div>
        </div>

        <div class="dev-breadcrumb">
          <span>src</span>
          <span class="dev-breadcrumb__sep">/</span>
          <span>snippets</span>
          <span class="dev-breadcrumb__sep">/</span>
          <span class="dev-breadcrumb__current" id="dev-crumb">${getLang(langId).label}.${getLang(langId).ext}</span>
        </div>

        <div class="dev-editor">
          <div class="dev-gutter" id="dev-gutter" aria-hidden="true"></div>
          <div class="dev-code" id="dev-code" tabindex="0" role="textbox"
               aria-label="Type the code shown">
            <div class="dev-syntax-layer" id="dev-syntax" aria-hidden="true"></div>
            <div class="caret" id="dev-caret"></div>
            <div class="dev-typed-layer" id="dev-typed"></div>
          </div>
        </div>

        <div id="dev-dock-mount"></div>
      </div>

      <footer class="dev-statusbar">
        <div class="dev-statusbar__group">
          <span class="dev-status-item"><i data-lucide="git-branch"></i> main</span>
          <span class="dev-status-item" id="dev-errors"><i data-lucide="circle-x"></i> 0</span>
          <span class="dev-status-item dev-status-item--accent" id="dev-wpm">0 wpm</span>
          <span class="dev-status-item" id="dev-acc">100%</span>
        </div>
        <div class="dev-statusbar__group">
          <span class="dev-status-item" id="dev-lncol">Ln 1, Col 1</span>
          <span class="dev-status-item">spaces: 4</span>
          <span class="dev-status-item">UTF-8</span>
          <span class="dev-status-item" id="dev-lang">${getLang(langId).label}</span>
        </div>
      </footer>
    </div>
  `;

  const $ = (sel) => container.querySelector(sel);

  const shell    = $('#dev-shell');
  const codeEl   = $('#dev-code');
  const typedEl  = $('#dev-typed');
  const syntaxEl = $('#dev-syntax');
  const caretEl  = $('#dev-caret');
  const gutterEl = $('#dev-gutter');
  const wpmEl    = $('#dev-wpm');
  const accEl    = $('#dev-acc');
  const errEl    = $('#dev-errors');
  const lnColEl  = $('#dev-lncol');

  renderEngine = new RenderEngine(typedEl, caretEl);

  /* ── inspector dock ───────────────────────────────────────────────────── */

  dock = createDevDock({
    getSessionSnapshot: () => {
      if (!adapter) return null;
      const s = statsEngine.getDetailedStats();
      return {
        language: langId,
        line: adapter.currentLineIndex + 1,
        totalLines: adapter.lines.length,
        wpm: s.wpm,
        rawWpm: s.rawWpm,
        accuracy: Number(s.accuracy.toFixed(2)),
        errors: s.errors,
        keystrokes: s.totalStrokes,
        elapsedMs: Math.round(s.totalTimeMs),
      };
    },
  });
  $('#dev-dock-mount').appendChild(dock.el);

  /* ── syntax layer ─────────────────────────────────────────────────────── */

  /**
   * Paint highlighted source beneath the typed layer.
   *
   * Both layers must share identical glyph metrics or they visibly ghost.
   * RenderEngine substitutes NBSP for spaces, so this layer does the same —
   * matching the font alone is not sufficient.
   */
  function paintSyntax(code) {
    const langDef = langId === 'python' ? python : javascript;
    let out = '';

    try {
      for (const token of tokenize(code, langDef)) {
        const value = escapeHtml(token.value);
        out += (token.type === 'text' || token.type === 'whitespace')
          ? value
          : `<span class="tok-${token.type}">${value}</span>`;
      }
    } catch (err) {
      logger.warn('syntax', `Tokenizer failed for ${langId}`, { error: err.message });
      out = escapeHtml(code);
    }

    syntaxEl.innerHTML = out;
  }

  function paintGutter(count, activeLine = 0) {
    gutterEl.innerHTML = Array.from(
      { length: count },
      (_, i) => `<div class="dev-gutter__line${i === activeLine ? ' active' : ''}">${i + 1}</div>`
    ).join('');
  }

  /* ── session lifecycle ────────────────────────────────────────────────── */

  async function startSession(nextLang = langId) {
    langId = nextLang;
    localStorage.setItem('keyflow_dev_lang', langId);
    locked = false;
    started = false;

    const lang = getLang(langId);
    $('#dev-filename').textContent = `${lang.label}.${lang.ext}`;
    $('#dev-crumb').textContent = `${lang.label}.${lang.ext}`;
    $('#dev-lang').textContent = lang.label;

    if (inputEngine) inputEngine.stop();
    statsEngine.reset();
    renderEngine.resetDiffState();
    shell.classList.remove('is-typing');

    logger.info('session', `Loading ${langId} snippet`);

    let code;
    try {
      code = await getText(MODES.CODE, 'medium', { language: langId });
    } catch (err) {
      logger.error('session', `Failed to load snippet for ${langId}`, { error: err.message });
      syntaxEl.innerHTML = '';
      typedEl.innerHTML = `<div class="dev-dock__empty">Could not load a ${escapeHtml(langId)} snippet.</div>`;
      return;
    }

    adapter = new CodeAdapter(code);
    paintSyntax(code);
    paintGutter(adapter.lines.length, 0);

    renderEngine.render(adapter.getRenderState());
    requestAnimationFrame(() => syncCaret(adapter.getCaretPosition()));

    logger.info('session', `Ready — ${adapter.lines.length} lines, ${code.length} chars`, {
      language: langId,
    });

    inputEngine = new InputEngine(
      codeEl,
      (inputEvent) => {
        const t0 = performance.now();

        if (!started) {
          started = true;
          locked = true;
          shell.classList.add('is-typing');
          logger.debug('input', 'First keystroke — session locked');
        }

        const correct = isCorrect(inputEvent);
        statsEngine.recordKeystroke(inputEvent.key, targetChar(), correct);

        const { renderState, caretPosition } = adapter.processInput(inputEvent);
        renderEngine.render(renderState);

        requestAnimationFrame(() => {
          syncCaret(caretPosition);
          paintGutter(adapter.lines.length, caretPosition.lineIndex);
        });

        updateStatus();
        recordInputLatency(t0);

        if (isComplete()) endSession();
      },
      (violation) => logger.warn('fairplay', violation)
    );
    inputEngine.start();
    codeEl.focus();
  }

  function isCorrect(inputEvent) {
    const target = adapter.lines[adapter.currentLineIndex] || '';
    const typed = adapter.typedLines[adapter.currentLineIndex] || '';
    if (inputEvent.isBackspace || inputEvent.key === 'Tab') return false;
    if (inputEvent.key === 'Enter') return typed === target;
    return target[typed.length] === inputEvent.key;
  }

  function targetChar() {
    const target = adapter.lines[adapter.currentLineIndex] || '';
    const typed = adapter.typedLines[adapter.currentLineIndex] || '';
    return target[typed.length] || '\n';
  }

  function isComplete() {
    const last = adapter.lines.length - 1;
    return (
      adapter.currentLineIndex >= last &&
      (adapter.typedLines[last] || '').length >= (adapter.lines[last] || '').length
    );
  }

  function syncCaret({ lineIndex, charIndex }) {
    renderEngine.updateCaretPosition(lineIndex, charIndex);
    lnColEl.textContent = `Ln ${lineIndex + 1}, Col ${charIndex + 1}`;
  }

  function updateStatus() {
    const s = statsEngine.getDetailedStats();
    wpmEl.textContent = `${s.wpm} wpm`;
    accEl.textContent = `${s.accuracy.toFixed(0)}%`;
    errEl.textContent = `${s.errors} errors`;
    errEl.classList.toggle('dev-status-item--error', s.errors > 0);
  }

  function endSession() {
    inputEngine.stop();
    statsEngine.finish();
    locked = false;

    const s = statsEngine.getDetailedStats();
    const session = {
      wpm: s.wpm,
      rawWpm: s.rawWpm,
      accuracy: s.accuracy,
      errors: s.errors,
      consistency: s.speedCurve && s.speedCurve.length > 1
        ? Math.round(calculateConsistency(s.speedCurve))
        : 100,
      duration: Math.round(s.totalTimeMs / 1000),
      mode: MODES.CODE,
      language: langId,
      totalStrokes: s.totalStrokes,
      timestamp: Date.now(),
    };

    logger.info('session', `Complete — ${session.wpm} wpm, ${session.accuracy.toFixed(1)}% accuracy`, {
      language: langId,
      errors: session.errors,
    });

    sessionStorage.setItem('lastSession', JSON.stringify(session));

    // Keep the timeline for the most recent run so the results page can replay
    // it. Bounded to one session on purpose — see the note in practice.js.
    try {
      sessionStorage.setItem('lastReplay', JSON.stringify({
        timeline: s.timeline,
        text: adapter.lines.join('\n'),
        totalTimeMs: s.totalTimeMs,
        isCode: true,
      }));
    } catch (err) {
      sessionStorage.removeItem('lastReplay');
      logger.warn('replay', 'Timeline too large to store', { error: err.message });
    }

    // Persist alongside prose sessions so the dashboard reflects code practice
    // too — previously code runs were recorded nowhere.
    try {
      saveSession(session);
    } catch (err) {
      logger.error('history', 'Failed to persist session', { error: err.message });
    }

    window.location.hash = '#/results';
  }

  /* ── interactions ─────────────────────────────────────────────────────── */

  function selectLanguage(id) {
    if (locked) {
      logger.warn('ui', 'Language switch blocked — session in progress');
      return;
    }
    container.querySelectorAll('.dev-file').forEach((f) => {
      const on = f.dataset.lang === id;
      f.classList.toggle('active', on);
      f.setAttribute('aria-selected', String(on));
    });
    startSession(id);
  }

  container.querySelectorAll('.dev-file').forEach((file) => {
    file.addEventListener('click', () => selectLanguage(file.dataset.lang));
    file.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectLanguage(file.dataset.lang);
      }
    });
  });

  container.querySelectorAll('.dev-rail__btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.rail;

      if (target === 'explorer') {
        shell.classList.toggle('is-explorer-collapsed');
        btn.classList.toggle('active', !shell.classList.contains('is-explorer-collapsed'));
        return;
      }

      container.querySelectorAll('.dev-rail__btn').forEach((b) => {
        if (b.dataset.rail !== 'explorer') b.classList.remove('active');
      });
      btn.classList.add('active');
      dock.show(target);
    });
  });

  $('#dev-restart').addEventListener('click', () => {
    if (!locked) startSession();
  });

  const onKeyDown = (e) => {
    if (e.key === 'Tab' && !locked && document.activeElement !== codeEl) {
      e.preventDefault();
      startSession();
    }
  };
  document.addEventListener('keydown', onKeyDown);

  codeEl.addEventListener('click', () => codeEl.focus());

  if (window.lucide) window.lucide.createIcons();

  startSession();

  container._destroy = () => {
    document.removeEventListener('keydown', onKeyDown);
    if (inputEngine) inputEngine.stop();
    if (dock) dock.destroy();
  };
}

export function destroy(container) {
  if (container._destroy) container._destroy();
}
