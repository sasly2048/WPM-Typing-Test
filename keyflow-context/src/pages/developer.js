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

const ALL_LANGUAGES = [
  { id: 'javascript', label: 'JavaScript', ext: 'js', icon: 'file-code' },
  { id: 'typescript', label: 'TypeScript', ext: 'ts', icon: 'file-code-2' },
  { id: 'python', label: 'Python', ext: 'py', icon: 'file-terminal' },
  { id: 'c', label: 'C', ext: 'c', icon: 'file-text' },
  { id: 'cpp', label: 'C++', ext: 'cpp', icon: 'file-code' },
  { id: 'java', label: 'Java', ext: 'java', icon: 'file-code' },
  { id: 'go', label: 'Go', ext: 'go', icon: 'file-code-2' },
  { id: 'rust', label: 'Rust', ext: 'rs', icon: 'file-cog' },
  { id: 'kotlin', label: 'Kotlin', ext: 'kt', icon: 'file-code' },
  { id: 'swift', label: 'Swift', ext: 'swift', icon: 'file-code' },
  { id: 'html', label: 'HTML', ext: 'html', icon: 'file-type-2' },
  { id: 'css', label: 'CSS', ext: 'css', icon: 'palette' },
  { id: 'sql', label: 'SQL', ext: 'sql', icon: 'database' },
  { id: 'json', label: 'JSON', ext: 'json', icon: 'file-json' },
  { id: 'markdown', label: 'Markdown', ext: 'md', icon: 'file-text' },
  { id: 'bash', label: 'Bash', ext: 'sh', icon: 'terminal' }
];

const styles = `
.kf-cursor-workspace {
  display: flex;
  height: calc(100vh - 64px);
  background-color: var(--surface-0);
  color: var(--color-text-primary);
  font-family: var(--font-mono, 'JetBrains Mono', monospace);
  overflow: hidden;
}

.kf-dev-sidebar {
  width: 240px;
  background-color: var(--surface-1);
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  user-select: none;
}

.kf-sidebar-header {
  padding: 0.75rem 1rem;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-secondary);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.kf-file-tree {
  padding: 0.5rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  overflow-y: auto;
  flex: 1;
}

.kf-file-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 1rem;
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.kf-file-item:hover {
  background: rgba(255, 255, 255, 0.04);
  color: var(--color-text-primary);
}

.kf-file-item.active {
  background: rgba(240, 169, 104, 0.1);
  color: var(--color-accent);
  border-left: 2px solid var(--color-accent);
}

.kf-dev-main-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.kf-dev-topbar {
  display: flex;
  background-color: var(--surface-1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.kf-dev-tabs {
  display: flex;
  overflow-x: auto;
}

.kf-dev-tab {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.25rem;
  background-color: var(--surface-0);
  border-right: 1px solid rgba(255, 255, 255, 0.06);
  border-top: 2px solid var(--color-accent);
  color: var(--color-text-primary);
  font-size: 0.85rem;
}

.kf-dev-breadcrumbs {
  padding: 0.4rem 1rem;
  font-size: 0.75rem;
  color: var(--color-text-tertiary);
  background: var(--surface-0);
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.kf-dev-editor-body {
  flex: 1;
  display: flex;
  position: relative;
  overflow: auto;
  padding: 1.5rem 0;
}

.kf-dev-line-numbers {
  display: flex;
  flex-direction: column;
  padding: 0 1.25rem;
  color: var(--color-text-tertiary);
  text-align: right;
  user-select: none;
  font-size: 1rem;
  line-height: 1.6;
  min-width: 3.5rem;
}

.kf-dev-code-area {
  flex: 1;
  position: relative;
  font-size: 1rem;
  line-height: 1.6;
  outline: none;
  cursor: text;
}

.kf-dev-syntax-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  white-space: pre;
}

.kf-dev-syntax-layer span.keyword { color: var(--color-accent); font-weight: 600; }
.kf-dev-syntax-layer span.string { color: var(--color-success); }
.kf-dev-syntax-layer span.comment { color: var(--color-text-secondary); font-style: italic; }
.kf-dev-syntax-layer span.function { color: var(--color-info); }
.kf-dev-syntax-layer span.number { color: var(--color-accent); }
.kf-dev-syntax-layer span.operator { color: var(--color-text-secondary); }
.kf-dev-syntax-layer span.identifier { color: var(--color-text-primary); }

#kf-dev-render-area {
  position: relative;
  z-index: 10;
  white-space: pre;
}

.kf-dev-code-area .keyflow-char.pending { opacity: 0.45; }
.kf-dev-code-area .keyflow-char.correct { color: var(--color-text-primary); opacity: 1; }
.kf-dev-code-area .keyflow-char.incorrect { color: var(--color-error); background: rgba(255, 59, 48, 0.2); }
.kf-dev-code-area .keyflow-char.extra { color: var(--color-error); background: rgba(255, 59, 48, 0.2); }

.kf-caret {
  position: absolute;
  width: 2px;
  height: 1.6rem;
  background-color: var(--color-accent);
  box-shadow: 0 0 8px var(--color-accent);
  transition: transform 0.08s var(--ease-apple);
  animation: kf-blink 1s infinite step-end;
  z-index: 20;
}

@keyframes kf-blink { 50% { opacity: 0; } }

.kf-dev-statusbar {
  display: flex;
  justify-content: space-between;
  padding: 0.35rem 1rem;
  background-color: var(--surface-1);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  color: var(--color-text-secondary);
  font-size: 0.75rem;
}

.kf-status-group {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.kf-status-pill {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.15rem 0.5rem;
  border-radius: 0.25rem;
  background: rgba(255, 255, 255, 0.04);
}
`;

export function render(container) {
  const styleEl = document.createElement('style');
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);

  let currentLangId = localStorage.getItem('keyflow_dev_lang') || 'javascript';

  const getLangObj = (id) => ALL_LANGUAGES.find(l => l.id === id) || ALL_LANGUAGES[0];

  container.innerHTML = html`
    <div class="kf-cursor-workspace" id="kf-dev-workspace">
      <!-- File Explorer Sidebar -->
      <aside class="kf-dev-sidebar">
        <div class="kf-sidebar-header">
          <span>Languages (${ALL_LANGUAGES.length})</span>
          <i data-lucide="folder-tree" size="14"></i>
        </div>
        <div class="kf-file-tree">
          ${ALL_LANGUAGES.map(lang => `
            <div class="kf-file-item ${lang.id === currentLangId ? 'active' : ''}" data-lang="${lang.id}">
              <i data-lucide="${lang.icon}" size="14"></i> ${lang.label} <span style="font-size: 0.7rem; color: var(--color-text-secondary); margin-left: auto;">.${lang.ext}</span>
            </div>
          `).join('')}
        </div>
      </aside>

      <!-- Main Editor Container -->
      <div class="kf-dev-main-panel">
        <div class="kf-dev-topbar" style="display: flex; align-items: center; justify-content: space-between;">
          <div class="kf-dev-tabs" id="kf-active-tab-container">
            <div class="kf-dev-tab">
              <i data-lucide="${getLangObj(currentLangId).icon}" size="14" style="color: var(--color-accent)"></i>
              <span id="kf-active-filename">${getLangObj(currentLangId).label}.${getLangObj(currentLangId).ext}</span>
            </div>
          </div>
          <button class="refresh-btn" id="kf-dev-refresh-btn" style="margin-right: 1rem; padding: 0.35rem 0.75rem; font-size: 0.75rem;" title="Get New Snippet (Disabled while typing)">
            <i data-lucide="rotate-cw" size="12"></i>
            <span>New Snippet</span>
          </button>
        </div>

        <div class="kf-dev-breadcrumbs" id="kf-breadcrumbs">
          <span>src</span> &gt; <span>snippets</span> &gt; <span style="color: var(--color-text-primary)" id="kf-breadcrumb-active">${getLangObj(currentLangId).label}.${getLangObj(currentLangId).ext}</span>
        </div>

        <div class="kf-dev-editor-body">
          <div class="kf-dev-line-numbers" id="kf-line-numbers"></div>
          
          <div class="kf-dev-code-area" id="kf-dev-target" tabindex="0">
            <div class="kf-dev-syntax-layer" id="kf-syntax-layer"></div>
            <div class="kf-caret" id="kf-caret"></div>
            <div id="kf-dev-render-area"></div>
          </div>
        </div>

        <!-- Editor Status Bar -->
        <footer class="kf-dev-statusbar">
          <div class="kf-status-group">
            <div class="kf-status-pill"><i data-lucide="git-branch" size="12"></i> main*</div>
            <div class="kf-status-pill"><i data-lucide="check-circle-2" size="12" style="color: var(--color-success)"></i> 0 Errors</div>
            <div class="kf-status-pill" id="kf-live-wpm">0 WPM</div>
            <div class="kf-status-pill" id="kf-live-acc">100% Acc</div>
          </div>
          <div class="kf-status-group">
            <div id="kf-ln-col">Ln 1, Col 1</div>
            <div>UTF-8</div>
            <div id="kf-status-lang">${getLangObj(currentLangId).label}</div>
          </div>
        </footer>
      </div>
    </div>
  `;

  setTimeout(() => {
    if (window.lucide) window.lucide.createIcons();
  }, 20);

  const workspace = container.querySelector('#kf-dev-workspace');
  const targetEl = container.querySelector('#kf-dev-target');
  const renderArea = container.querySelector('#kf-dev-render-area');
  const caretEl = container.querySelector('#kf-caret');
  const syntaxLayer = container.querySelector('#kf-syntax-layer');
  const lineNumbersEl = container.querySelector('#kf-line-numbers');
  const wpmEl = container.querySelector('#kf-live-wpm');
  const accEl = container.querySelector('#kf-live-acc');
  const lnColEl = container.querySelector('#kf-ln-col');
  const statusLangEl = container.querySelector('#kf-status-lang');
  const activeFilenameEl = container.querySelector('#kf-active-filename');
  const breadcrumbActiveEl = container.querySelector('#kf-breadcrumb-active');

  let inputEngine = null;
  let renderEngine = new RenderEngine(renderArea, caretEl);
  let statsEngine = new StatsEngine();
  let adapter = null;
  let isSessionLocked = false;

  async function startSession(langId = currentLangId) {
    currentLangId = langId;
    localStorage.setItem('keyflow_dev_lang', langId);
    isSessionLocked = false;

    const langObj = getLangObj(langId);
    if (activeFilenameEl) activeFilenameEl.textContent = `${langObj.label}.${langObj.ext}`;
    if (breadcrumbActiveEl) breadcrumbActiveEl.textContent = `${langObj.label}.${langObj.ext}`;
    if (statusLangEl) statusLangEl.textContent = langObj.label;

    const devRefreshBtn = container.querySelector('#kf-dev-refresh-btn');
    if (devRefreshBtn) devRefreshBtn.disabled = false;

    if (inputEngine) inputEngine.stop();
    statsEngine.reset();
    targetEl.focus();

    const code = await getText(MODES.CODE, 'medium', { language: langId });
    adapter = new CodeAdapter(code);
    
    renderSyntaxHighlighting(code, langId);
    renderLineNumbers(adapter.lines.length);

    const { renderState, caretPosition } = adapter.getRenderState ? { renderState: adapter.getRenderState(), caretPosition: adapter.getCaretPosition() } : { renderState: [], caretPosition: { lineIndex:0, charIndex:0 } };
    renderEngine.render(renderState);
    requestAnimationFrame(() => updateCaretAndStatus(caretPosition));

    inputEngine = new InputEngine(targetEl, 
      (inputEvent) => {
        isSessionLocked = true; // LOCK SESSION mid-typing
        if (devRefreshBtn) devRefreshBtn.disabled = true;
        const isCorrect = isInputCorrect(inputEvent, adapter);
        const targetChar = getTargetChar(adapter);
        statsEngine.recordKeystroke(inputEvent.key, targetChar, isCorrect);

        const { renderState, caretPosition } = adapter.processInput(inputEvent);
        renderEngine.render(renderState); 
        requestAnimationFrame(() => updateCaretAndStatus(caretPosition));
        updateLiveStats();
        
        if (checkCompletion(adapter)) endSession();
      },
      (violationMsg) => console.warn("Fair play:", violationMsg)
    );
    inputEngine.start();
  }

  function renderSyntaxHighlighting(code, langId) {
    try {
      const langDef = langId === 'python' ? python : javascript;
      const tokens = tokenize(code, langDef);
      let htmlStr = '';
      tokens.forEach(token => {
        const val = token.value.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        if (token.type === 'text' || token.type === 'whitespace') {
          htmlStr += val;
        } else {
          htmlStr += `<span class="${token.type}">${val}</span>`;
        }
      });
      syntaxLayer.innerHTML = htmlStr;
    } catch (e) {
      syntaxLayer.textContent = code;
    }
  }

  function renderLineNumbers(count) {
    lineNumbersEl.innerHTML = Array.from({ length: count }, (_, i) => `<div>${i + 1}</div>`).join('');
  }

  function updateCaretAndStatus(caretPosition) {
    renderEngine.updateCaretPosition(caretPosition.lineIndex, caretPosition.charIndex);
    lnColEl.textContent = `Ln ${caretPosition.lineIndex + 1}, Col ${caretPosition.charIndex + 1}`;
  }

  function isInputCorrect(inputEvent, adapter) {
    const targetLine = adapter.lines[adapter.currentLineIndex] || "";
    const typedLine = adapter.typedLines[adapter.currentLineIndex] || "";
    if (inputEvent.isBackspace || inputEvent.key === 'Tab') return false;
    if (inputEvent.key === 'Enter') return typedLine === targetLine;
    return targetLine[typedLine.length] === inputEvent.key;
  }
  
  function getTargetChar(adapter) {
    const targetLine = adapter.lines[adapter.currentLineIndex] || "";
    const typedLine = adapter.typedLines[adapter.currentLineIndex] || "";
    return targetLine[typedLine.length] || '\n';
  }

  function checkCompletion(adapter) {
    return adapter.currentLineIndex >= adapter.lines.length - 1 && 
           (adapter.typedLines[adapter.currentLineIndex] || "").length >= adapter.lines[adapter.currentLineIndex].length;
  }

  function updateLiveStats() {
    const stats = statsEngine.getDetailedStats();
    wpmEl.textContent = `${stats.wpm} WPM`;
    accEl.textContent = `${stats.accuracy.toFixed(0)}% Acc`;
  }

  function endSession() {
    inputEngine.stop();
    statsEngine.finish();
    const stats = statsEngine.getDetailedStats();
    
    sessionStorage.setItem('lastSession', JSON.stringify({
      wpm: stats.wpm,
      accuracy: stats.accuracy,
      duration: Math.round(stats.totalTimeMs / 1000),
      mode: MODES.CODE,
      timestamp: Date.now()
    }));
    
    window.location.hash = '#/results';
  }

  // File tree language selection handler
  const fileItems = container.querySelectorAll('.kf-file-item');
  fileItems.forEach(item => {
    item.addEventListener('click', () => {
      const lang = item.getAttribute('data-lang');
      fileItems.forEach(fi => fi.classList.remove('active'));
      item.classList.add('active');
      startSession(lang);
    });
  });

  const devRefreshBtn = container.querySelector('#kf-dev-refresh-btn');
  if (devRefreshBtn) {
    devRefreshBtn.addEventListener('click', () => {
      if (!isSessionLocked) {
        startSession();
      }
    });
  }

  targetEl.addEventListener('click', () => targetEl.focus());
  startSession();

  container.dataset.destroy = () => {
    if (styleEl && styleEl.parentNode) styleEl.parentNode.removeChild(styleEl);
    if (inputEngine) inputEngine.stop();
  };
}

export function destroy(container) {
  if (container.dataset.destroy) container.dataset.destroy();
}
