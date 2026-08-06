/**
 * Practice workspace — Normal mode.
 *
 * Distraction-free by construction: configuration is visible before you type
 * and recedes once you start, leaving only the text. All chrome derives from
 * the normal token scope.
 */

import { html } from '../utils/dom.js';
import { InputEngine } from '../engines/InputEngine.js';
import { RenderEngine } from '../engines/RenderEngine.js';
import { StatsEngine } from '../engines/StatsEngine.js';
import { WordsAdapter } from '../adapters/WordsAdapter.js';
import { getText } from '../services/text-provider.js';
import { contentEngine } from '../services/content-engine.js';
import { saveSession, getStats, getPersonalBest } from '../services/history.js';
import { checkAchievements } from '../services/achievements.js';
import { calculateConsistency } from '../services/stats-engine.js';
import { MODES, DIFFICULTIES } from '../constants/config.js';
import { showToast } from '../components/toast.js';
import { getSettings, saveSettings } from '../services/storage.js';
import { logger, recordInputLatency } from '../services/instrumentation.js';
import * as audio from '../services/audio.js';

const DURATIONS = [15, 30, 60, 120];
const WORD_COUNTS = [10, 25, 50, 100];

/**
 * Modes differ in what "length" means, so each declares which length control
 * it uses. `time` runs until the clock expires; `words` until a count is
 * reached; `paragraph` and `quote` use a passage sized to the duration.
 */
const MODE_OPTIONS = [
  { id: MODES.PARAGRAPH, label: 'prose',  icon: 'align-left',  length: 'duration', hint: 'Full passages of natural prose' },
  { id: MODES.TIME,      label: 'time',   icon: 'timer',       length: 'duration', hint: 'Type until the clock runs out' },
  { id: MODES.WORDS,     label: 'words',  icon: 'type',        length: 'words',    hint: 'Type a fixed number of words' },
  { id: MODES.CUSTOM,    label: 'custom', icon: 'pencil-line', length: 'none',     hint: 'Practise on your own text' },
];

const DIFFICULTY_OPTIONS = [
  { id: DIFFICULTIES.EASY,   label: 'easy',   hint: 'Common, short words' },
  { id: DIFFICULTIES.MEDIUM, label: 'medium', hint: 'Everyday vocabulary' },
  { id: DIFFICULTIES.HARD,   label: 'hard',   hint: 'Longer and less common words' },
  { id: DIFFICULTIES.EXPERT, label: 'expert', hint: 'Technical and rare vocabulary' },
];

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

export function render(container) {
  const saved = getSettings();

  let mode = saved.mode || MODES.PARAGRAPH;
  let difficulty = saved.difficulty || DIFFICULTIES.MEDIUM;
  let duration = saved.duration || 30;
  let wordCount = saved.wordCount || 50;
  let punctuation = false;
  let numbers = false;
  let customText = '';

  let inputEngine = null;
  let adapter = null;
  let started = false;

  const statsEngine = new StatsEngine();
  const settings = saved;
  let audioReady = false;

  container.innerHTML = html`
    <div class="practice" id="practice">
      <div class="practice__config" id="practice-config">
        <div class="segmented" role="tablist" aria-label="Test mode">
          ${MODE_OPTIONS.map((m) => `
            <button class="segmented__item ${m.id === mode ? 'active' : ''}"
                    role="tab" data-mode="${m.id}"
                    aria-selected="${m.id === mode}" title="${m.hint}">
              <i data-lucide="${m.icon}"></i> ${m.label}
            </button>
          `).join('')}
        </div>

        <span class="practice__config-divider" aria-hidden="true"></span>

        <!-- Length control. Which unit applies depends on the mode, so only
             the relevant one is shown rather than greying the other out. -->
        <div class="segmented" role="tablist" aria-label="Test length" id="practice-length">
          ${DURATIONS.map((d) => `
            <button class="segmented__item ${d === duration ? 'active' : ''}"
                    role="tab" data-duration="${d}"
                    aria-selected="${d === duration}">${d}s</button>
          `).join('')}
        </div>

        <div class="segmented" role="tablist" aria-label="Word count" id="practice-words" hidden>
          ${WORD_COUNTS.map((w) => `
            <button class="segmented__item ${w === wordCount ? 'active' : ''}"
                    role="tab" data-words="${w}"
                    aria-selected="${w === wordCount}">${w}</button>
          `).join('')}
        </div>

        <span class="practice__config-divider" aria-hidden="true"></span>

        <div class="segmented" role="tablist" aria-label="Difficulty">
          ${DIFFICULTY_OPTIONS.map((d) => `
            <button class="segmented__item ${d.id === difficulty ? 'active' : ''}"
                    role="tab" data-difficulty="${d.id}"
                    aria-selected="${d.id === difficulty}" title="${d.hint}">${d.label}</button>
          `).join('')}
        </div>

        <span class="practice__config-divider" aria-hidden="true"></span>

        <div class="segmented" role="group" aria-label="Text options" id="practice-options">
          <button class="segmented__item" data-toggle="punctuation" aria-pressed="false">
            <i data-lucide="pilcrow"></i> punctuation
          </button>
          <button class="segmented__item" data-toggle="numbers" aria-pressed="false">
            <i data-lucide="hash"></i> numbers
          </button>
        </div>

        <span class="practice__config-divider" aria-hidden="true"></span>

        <span class="badge badge--accent" id="practice-pb" hidden></span>

        <button class="btn btn-ghost btn-sm" id="practice-restart" title="Restart (Tab)">
          <i data-lucide="rotate-cw"></i>
          <span>restart</span>
        </button>
      </div>

      <!-- Custom mode needs its own text, so it gets a panel instead of a
           control strip. Hidden unless that mode is active. -->
      <div class="practice__custom" id="practice-custom" hidden>
        <label class="field__label" for="practice-custom-input">Your text</label>
        <textarea class="textarea" id="practice-custom-input" rows="4"
                  placeholder="Paste or type the passage you want to practise on…"></textarea>
        <button class="btn btn-primary btn-sm" id="practice-custom-apply">Use this text</button>
      </div>

      <div class="practice__surface">
        <div class="typing-surface" id="practice-target" tabindex="0"
             role="textbox" aria-label="Typing test text">
          <div class="caret" id="practice-caret"></div>
          <div id="practice-render"></div>
        </div>
      </div>

      <div class="practice__footer">
        <div class="live-hud" id="practice-hud">
          <div class="live-hud__item">
            <span class="live-hud__value" id="practice-wpm">0</span>
            <span class="live-hud__label">wpm</span>
          </div>
          <div class="live-hud__item">
            <span class="live-hud__value" id="practice-acc">100</span>
            <span class="live-hud__label">acc</span>
          </div>
          <div class="live-hud__item">
            <span class="live-hud__value" id="practice-progress">0%</span>
            <span class="live-hud__label">done</span>
          </div>
        </div>

        <p class="practice__hint">
          Start typing to begin · <kbd>Tab</kbd> to restart
        </p>
      </div>
    </div>
  `;

  const $ = (sel) => container.querySelector(sel);

  const root     = $('#practice');
  const targetEl = $('#practice-target');
  const renderEl = $('#practice-render');
  const caretEl  = $('#practice-caret');
  const wpmEl    = $('#practice-wpm');
  const accEl    = $('#practice-acc');
  const progEl   = $('#practice-progress');
  const pbEl     = $('#practice-pb');

  const renderEngine = new RenderEngine(renderEl, caretEl);

  /** Remember the configuration so the next visit opens where you left off. */
  const persist = (patch) => {
    Object.assign(settings, patch);
    saveSettings(settings);
  };

  /* Audio needs a user gesture before it can start on most browsers. */
  const initAudio = () => {
    if (audioReady) return;
    audioReady = true;
    audio.init();
    audio.setVolume(settings.soundVolume);
  };
  targetEl.addEventListener('keydown', initAudio, { once: true });
  targetEl.addEventListener('click', initAudio, { once: true });

  /* ── session ─────────────────────────────────────────────────────────── */

  async function startSession() {
    contentEngine.unlockSession();
    if (inputEngine) inputEngine.stop();

    statsEngine.reset();
    renderEngine.resetDiffState();
    started = false;
    root.classList.remove('is-typing');
    root.classList.toggle('blind-mode', !!settings.blindMode);

    const pb = getPersonalBest(mode, { targetDuration: duration, targetWordCount: wordCount });
    if (pb > 0) {
      pbEl.textContent = `PB ${pb} wpm`;
      pbEl.hidden = false;
    } else {
      pbEl.hidden = true;
    }

    let text;
    try {
      text = await getText(mode, difficulty, {
        duration, wordCount, punctuation, numbers, customText,
      });
    } catch (err) {
      logger.error('session', 'Failed to load text', { error: err.message });
      showToast({ message: 'Could not load a passage. Try again.', type: 'error' });
      return;
    }

    adapter = new WordsAdapter(text);
    renderEngine.render(adapter.getRenderState());
    requestAnimationFrame(() => {
      const c = adapter.getCaretPosition();
      renderEngine.updateCaretPosition(c.lineIndex, c.charIndex);
    });

    logger.info('session', `Practice ready — ${adapter.words.length} words`);

    inputEngine = new InputEngine(
      targetEl,
      (inputEvent) => {
        const t0 = performance.now();

        if (!started) {
          started = true;
          root.classList.add('is-typing');
          contentEngine.lockSession();
        }

        const correct = isCorrect(inputEvent);
        statsEngine.recordKeystroke(inputEvent.key, targetChar(), correct);

        if (settings.soundEnabled && !inputEvent.isBackspace) {
          if (correct) audio.playKeyClick(settings.soundProfile);
          else audio.playError();
        }

        const { renderState, caretPosition } = adapter.processInput(inputEvent);
        renderEngine.render(renderState);
        requestAnimationFrame(() =>
          renderEngine.updateCaretPosition(caretPosition.lineIndex, caretPosition.charIndex)
        );

        updateHud();
        recordInputLatency(t0);

        if (isComplete()) endSession();
      },
      (violation) => showToast({ message: violation, type: 'warning' })
    );
    inputEngine.start();
    targetEl.focus();
  }

  function isCorrect(inputEvent) {
    const word = adapter.words[adapter.currentWordIndex] || '';
    const typed = adapter.typedWords[adapter.currentWordIndex] || '';
    if (inputEvent.isBackspace) return false;
    if (inputEvent.isSpace) return word === typed;
    return word[typed.length] === inputEvent.key;
  }

  function targetChar() {
    const word = adapter.words[adapter.currentWordIndex];
    if (!word) return ' ';
    const typed = adapter.typedWords[adapter.currentWordIndex] || '';
    return word[typed.length] || ' ';
  }

  function isComplete() {
    const last = adapter.words.length - 1;
    return (
      adapter.currentWordIndex >= last &&
      (adapter.typedWords[last] || '').length >= (adapter.words[last] || '').length
    );
  }

  function updateHud() {
    const s = statsEngine.getDetailedStats();
    wpmEl.textContent = s.wpm;
    accEl.textContent = s.accuracy.toFixed(0);
    progEl.textContent = `${Math.round((adapter.currentWordIndex / adapter.words.length) * 100)}%`;
  }

  function endSession() {
    inputEngine.stop();
    statsEngine.finish();
    contentEngine.unlockSession();
    if (settings.soundEnabled) audio.playComplete();

    const s = statsEngine.getDetailedStats();
    const session = {
      wpm: s.wpm,
      rawWpm: s.rawWpm,
      accuracy: s.accuracy,
      errors: s.errors,
      consistency: computeConsistency(s.speedCurve),
      duration: Math.round(s.totalTimeMs / 1000),
      mode,
      difficulty,
      targetDuration: duration,
      targetWordCount: wordCount,
      chars: countCharBreakdown(s.timeline),
      pauseCount: s.pauses.length,
      totalStrokes: s.totalStrokes,
      timestamp: Date.now(),
    };

    logger.info('session', `Complete — ${session.wpm} wpm`, { accuracy: session.accuracy });

    sessionStorage.setItem('lastSession', JSON.stringify(session));
    saveSession(session);

    checkAchievements(session, getStats())
      .then((unlocked) => {
        if (unlocked.length) {
          sessionStorage.setItem('newAchievements', JSON.stringify(unlocked));
        }
      })
      .catch((err) => logger.warn('achievements', 'Check failed', { error: err.message }));

    window.location.hash = '#/results';
  }

  /* ── config interactions ─────────────────────────────────────────────── */

  /** Show only the length control that applies to the active mode. */
  function syncConfigForMode() {
    const spec = MODE_OPTIONS.find((m) => m.id === mode) || MODE_OPTIONS[0];
    $('#practice-length').hidden = spec.length !== 'duration';
    $('#practice-words').hidden = spec.length !== 'words';
    $('#practice-custom').hidden = mode !== MODES.CUSTOM;
    // Generated text options are meaningless for text the user supplied.
    $('#practice-options').hidden = mode === MODES.CUSTOM;
  }

  /**
   * Wire a segmented control. Selecting an option updates state, persists it,
   * repaints selection, and restarts — config changes always start a clean
   * run rather than mutating one in progress.
   */
  function wireGroup(attr, apply, { restart = true } = {}) {
    const items = container.querySelectorAll(`[data-${attr}]`);
    items.forEach((btn) => {
      btn.addEventListener('click', () => {
        if (contentEngine.isSessionLocked) return;
        apply(btn.dataset[attr]);
        items.forEach((b) => {
          const on = b === btn;
          b.classList.toggle('active', on);
          b.setAttribute('aria-selected', String(on));
        });
        syncConfigForMode();
        if (restart) startSession();
      });
    });
  }

  // Mode is wired with restart:false and restarts conditionally below —
  // switching to Custom must not start a session before text is supplied.
  wireGroup('mode', (v) => {
    mode = v;
    persist({ mode });
    if (mode !== MODES.CUSTOM || customText.trim()) startSession();
  }, { restart: false });

  wireGroup('duration', (v) => { duration = Number(v); persist({ duration }); });
  wireGroup('words', (v) => { wordCount = Number(v); persist({ wordCount }); });
  wireGroup('difficulty', (v) => { difficulty = v; persist({ difficulty }); });

  container.querySelectorAll('[data-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (contentEngine.isSessionLocked) return;
      const key = btn.dataset.toggle;
      const next = btn.getAttribute('aria-pressed') !== 'true';
      btn.setAttribute('aria-pressed', String(next));
      btn.classList.toggle('active', next);
      if (key === 'punctuation') punctuation = next;
      if (key === 'numbers') numbers = next;
      startSession();
    });
  });

  $('#practice-custom-apply').addEventListener('click', () => {
    const value = $('#practice-custom-input').value.trim();
    if (!value) {
      showToast({ message: 'Enter some text to practise on.', type: 'warning' });
      return;
    }
    customText = value;
    startSession();
  });

  $('#practice-restart').addEventListener('click', () => {
    if (!contentEngine.isSessionLocked) startSession();
  });

  syncConfigForMode();

  const onKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      startSession();
    }
  };
  document.addEventListener('keydown', onKeyDown);
  targetEl.addEventListener('click', () => targetEl.focus());

  if (window.lucide) window.lucide.createIcons();

  startSession();

  container._destroy = () => {
    document.removeEventListener('keydown', onKeyDown);
    if (inputEngine) inputEngine.stop();
  };
}

export function destroy(container) {
  if (container._destroy) container._destroy();
}
