import { html, createElement } from '../utils/dom.js';
import { InputEngine } from '../engines/InputEngine.js';
import { RenderEngine } from '../engines/RenderEngine.js';
import { StatsEngine } from '../engines/StatsEngine.js';
import { WordsAdapter } from '../adapters/WordsAdapter.js';
import { getText } from '../services/text-provider.js';
import { contentEngine } from '../services/content-engine.js';
import { createModeSelector } from '../components/mode-selector.js';
import { createDifficultySelector } from '../components/difficulty-selector.js';
import { saveSession, getStats } from '../services/history.js';
import { checkAchievements } from '../services/achievements.js';
import { calculateConsistency } from '../services/stats-engine.js';
import { MODES, DIFFICULTIES } from '../constants/config.js';
import { showToast } from '../components/toast.js';
import { getSettings } from '../services/storage.js';
import * as audio from '../services/audio.js';

function computeConsistency(speedCurve) {
  if (!speedCurve || speedCurve.length < 2) return 100;
  return Math.round(calculateConsistency(speedCurve));
}

function countCharBreakdown(timeline) {
  const breakdown = { correct: 0, incorrect: 0, extra: 0, missed: 0 };
  for (const entry of timeline) {
    if (entry.correct) breakdown.correct++;
    else if (entry.expected === null || entry.expected === undefined) breakdown.extra++;
    else breakdown.incorrect++;
  }
  return breakdown;
}

const styles = `
.kf-workspace-practice {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
  min-height: calc(100vh - 64px);
  font-family: var(--font-sans, system-ui, sans-serif);
}

.kf-practice-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
  opacity: 0.85;
  transition: opacity 0.3s ease;
  flex-wrap: wrap;
  justify-content: center;
}

.kf-workspace-practice.is-typing .kf-practice-header {
  opacity: 0.1;
  pointer-events: none;
}

.kf-typing-container {
  width: 100%;
  position: relative;
  font-size: 1.5rem;
  line-height: 1.6;
  font-family: var(--font-mono, 'JetBrains Mono', monospace);
  color: var(--color-text-secondary);
  outline: none;
  border-radius: 8px;
  padding: 1.5rem;
  background: var(--surface-2, #13131A);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.kf-typing-container .keyflow-line {
  display: flex;
  flex-wrap: wrap;
}

.kf-typing-container .keyflow-char {
  position: relative;
  border-radius: 2px;
}

.kf-typing-container .keyflow-char.correct { color: var(--color-text-primary, #e2e8f0); }
.kf-typing-container .keyflow-char.incorrect { color: var(--color-error, #ef4444); background: rgba(239, 68, 68, 0.2); }
.kf-typing-container .keyflow-char.extra { color: var(--color-error, #ef4444); background: rgba(239, 68, 68, 0.2); }
.kf-typing-container .keyflow-char.missed { border-bottom: 2px solid var(--color-error, #ef4444); }
.kf-typing-container .keyflow-char.pending { color: var(--color-text-tertiary, #64748b); }

.kf-caret {
  position: absolute;
  width: 2px;
  height: 1.5rem;
  background-color: var(--color-accent, #f0a968);
  box-shadow: 0 0 8px var(--color-accent, #f0a968);
  transition: transform 0.08s var(--ease-apple);
  animation: kf-blink 1s infinite step-end;
  pointer-events: none;
}

.is-typing .kf-caret {
  animation: none;
  opacity: 1;
}

@keyframes kf-blink { 50% { opacity: 0; } }

.kf-stats-bar-live {
  display: flex;
  gap: 2rem;
  font-family: var(--font-mono, monospace);
  font-size: 1.25rem;
  color: var(--color-accent, #f0a968);
  margin-top: 2rem;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.is-typing .kf-stats-bar-live { opacity: 1; }

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--surface-2, #13131A);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  color: var(--color-text-primary, #e2e2e2);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.08);
  border-color: var(--color-accent, #f0a968);
}

.refresh-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
`;

export function render(container) {
  const styleEl = document.createElement('style');
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);

  let currentMode = MODES.PARAGRAPH;
  let currentDifficulty = DIFFICULTIES.MEDIUM;
  let currentDuration = 30;
  let currentWordCount = 50;

  container.innerHTML = html`
    <div class="kf-workspace-practice" id="kf-practice-workspace">
      <div class="kf-practice-header" id="kf-config-header">
        <div id="kf-mode-selector-mount"></div>
        <button class="refresh-btn" id="kf-refresh-btn" title="Get New Snippet (Disabled while typing)">
          <i data-lucide="rotate-cw" size="14"></i>
          <span>New Snippet</span>
        </button>
      </div>

      <div class="kf-typing-container" id="kf-target" tabindex="0">
        <div class="kf-caret" id="kf-caret"></div>
        <div id="kf-render-area"></div>
      </div>

      <div class="kf-stats-bar-live">
        <div><span id="kf-wpm">0</span> WPM</div>
        <div><span id="kf-acc">100</span>% ACC</div>
      </div>
    </div>
  `;

  setTimeout(() => {
    if (window.lucide) window.lucide.createIcons();
  }, 20);

  const workspace = container.querySelector('#kf-practice-workspace');
  const targetEl = container.querySelector('#kf-target');
  const renderArea = container.querySelector('#kf-render-area');
  const caretEl = container.querySelector('#kf-caret');
  const wpmEl = container.querySelector('#kf-wpm');
  const accEl = container.querySelector('#kf-acc');
  const refreshBtn = container.querySelector('#kf-refresh-btn');
  const modeMount = container.querySelector('#kf-mode-selector-mount');

  let inputEngine = null;
  let renderEngine = new RenderEngine(renderArea, caretEl);
  let statsEngine = new StatsEngine();
  let adapter = null;
  let soundSettings = getSettings();
  let audioInitialized = false;

  const initAudioOnce = () => {
    if (audioInitialized) return;
    audioInitialized = true;
    audio.init();
    audio.setVolume(soundSettings.soundVolume);
  };
  targetEl.addEventListener('keydown', initAudioOnce, { once: true });
  targetEl.addEventListener('click', initAudioOnce, { once: true });

  const modeSelector = createModeSelector({
    activeMode: currentMode,
    activeDuration: currentDuration,
    activeWordCount: currentWordCount,
    onChange: ({ mode, duration, wordCount }) => {
      currentMode = mode;
      currentDuration = duration;
      currentWordCount = wordCount;
      startSession();
    }
  });
  modeMount.appendChild(modeSelector);

  const diffSelector = createDifficultySelector({
    difficulty: currentDifficulty,
    onChange: (diff) => {
      currentDifficulty = diff;
      startSession();
    }
  });
  modeMount.appendChild(diffSelector);

  async function startSession() {
    contentEngine.unlockSession();
    if (refreshBtn) refreshBtn.disabled = false;

    if (inputEngine) inputEngine.stop();
    statsEngine.reset();
    renderEngine.resetDiffState();
    workspace.classList.remove('is-typing');
    targetEl.focus();

    const text = await getText(currentMode, currentDifficulty, {
      duration: currentDuration,
      wordCount: currentWordCount
    });

    adapter = new WordsAdapter(text);
    const { renderState, caretPosition } = adapter.getRenderState ? { renderState: adapter.getRenderState(), caretPosition: adapter.getCaretPosition() } : { renderState: [], caretPosition: { lineIndex:0, charIndex:0 } };
    renderEngine.render(renderState);
    requestAnimationFrame(() => renderEngine.updateCaretPosition(caretPosition.lineIndex, caretPosition.charIndex));

    inputEngine = new InputEngine(targetEl,
      (inputEvent) => {
        if (!workspace.classList.contains('is-typing')) {
          workspace.classList.add('is-typing');
          contentEngine.lockSession();
          if (refreshBtn) refreshBtn.disabled = true; // DISABLE REFRESH WHILE TYPING
        }

        const isCorrect = isInputCorrect(inputEvent, adapter);
        const targetChar = getTargetChar(adapter);
        statsEngine.recordKeystroke(inputEvent.key, targetChar, isCorrect);

        if (soundSettings.soundEnabled && !inputEvent.isBackspace) {
          if (isCorrect) audio.playKeyClick(soundSettings.soundProfile);
          else audio.playError();
        }

        const { renderState, caretPosition } = adapter.processInput(inputEvent);
        renderEngine.render(renderState); 
        requestAnimationFrame(() => renderEngine.updateCaretPosition(caretPosition.lineIndex, caretPosition.charIndex));
        updateLiveStats();
        
        if (checkCompletion(adapter)) endSession();
      },
      (violationMsg) => showToast({ message: violationMsg, type: 'warning' })
    );
    inputEngine.start();
  }

  function isInputCorrect(inputEvent, adapter) {
    const currentWord = adapter.words[adapter.currentWordIndex] || "";
    const typedWord = adapter.typedWords[adapter.currentWordIndex] || "";
    if (inputEvent.isBackspace) return false;
    if (inputEvent.isSpace) return currentWord === typedWord;
    return currentWord[typedWord.length] === inputEvent.key;
  }
  
  function getTargetChar(adapter) {
    if (adapter.words[adapter.currentWordIndex]) {
      return adapter.words[adapter.currentWordIndex][adapter.typedWords[adapter.currentWordIndex]?.length || 0] || ' ';
    }
    return ' ';
  }

  function checkCompletion(adapter) {
    return adapter.currentWordIndex >= adapter.words.length - 1 && 
           (adapter.typedWords[adapter.currentWordIndex] || "").length >= adapter.words[adapter.currentWordIndex].length;
  }

  function updateLiveStats() {
    const stats = statsEngine.getDetailedStats();
    wpmEl.textContent = stats.wpm;
    accEl.textContent = stats.accuracy.toFixed(0);
  }

  function endSession() {
    inputEngine.stop();
    statsEngine.finish();
    contentEngine.unlockSession();
    if (refreshBtn) refreshBtn.disabled = false;
    if (soundSettings.soundEnabled) audio.playComplete();

    const stats = statsEngine.getDetailedStats();
    const sessionData = {
      wpm: stats.wpm,
      rawWpm: stats.rawWpm,
      accuracy: stats.accuracy,
      errors: stats.errors,
      consistency: computeConsistency(stats.speedCurve),
      duration: Math.round(stats.totalTimeMs / 1000),
      mode: currentMode,
      difficulty: currentDifficulty,
      chars: countCharBreakdown(stats.timeline),
      pauseCount: stats.pauses.length,
      totalStrokes: stats.totalStrokes,
      timestamp: Date.now()
    };
    sessionStorage.setItem('lastSession', JSON.stringify(sessionData));
    saveSession(sessionData);

    // Check for newly unlocked achievements against the just-saved history,
    // stash them for results.js to surface — don't block navigation on it.
    checkAchievements(sessionData, getStats())
      .then((newlyUnlocked) => {
        if (newlyUnlocked.length > 0) {
          sessionStorage.setItem('newAchievements', JSON.stringify(newlyUnlocked));
        }
      })
      .catch((err) => console.warn('Achievement check failed:', err));

    window.location.hash = '#/results';
  }

  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      if (!contentEngine.isSessionLocked) {
        startSession();
      }
    });
  }

  const keyHandler = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      startSession();
    }
  };
  document.addEventListener('keydown', keyHandler);
  targetEl.addEventListener('click', () => targetEl.focus());
  
  startSession();

  container.dataset.destroy = () => {
    if (styleEl && styleEl.parentNode) styleEl.parentNode.removeChild(styleEl);
    if (inputEngine) inputEngine.stop();
    document.removeEventListener('keydown', keyHandler);
  };
}

export function destroy(container) {
  if (container.dataset.destroy) container.dataset.destroy();
}
