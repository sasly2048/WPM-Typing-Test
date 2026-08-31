/**
 * Practice workspace — Normal mode.
 *
 * The typing loop is built on the new foundation services (session,
 * input, timer, renderer, stats). Each owns one responsibility; the
 * page is just the wiring + UI.
 *
 *   keyboard event
 *      |
 *      v
 *   input engine         <-- normalises raw browser input
 *      |
 *      v
 *   session model        <-- the single source of truth (cursor,
 *      |                     originalText, typed[] per character)
 *      v
 *   timer + stats + renderer   <-- react to the new state
 *
 * The legacy WordsAdapter / CodeAdapter / RenderEngine are kept for
 * the developer page (which doesn't need the full session model) but
 * the practice page no longer touches them. This is the fix for the
 * cursor / completion / backspace bugs the audit flagged.
 */

import { html } from '../utils/dom.js';
import { getText } from '../services/text-provider.js';
import { createNormalSession } from '../services/normal-session.js';
import { createCompletionPolicy, COMPLETION } from '../services/completion.js';
import { contentEngine } from '../services/content-engine.js';
import { getStats, getPersonalBest } from '../services/history.js';
import { checkAchievements, publishSessionCompleted, publishMilestone } from '../services/achievements.js';
import { MODES, DIFFICULTIES } from '../constants/config.js';
import { showToast } from '../components/toast.js';
import { getSettings, saveSettings } from '../services/storage.js';
import { logger, recordInputLatency } from '../services/instrumentation.js';
import * as audio from '../services/audio.js';

const DURATIONS = [15, 30, 60, 120];
const WORD_COUNTS = [10, 25, 50, 75, 100];

/**
 * Modes a user picks between. We keep the list short deliberately:
 * four primary modes cover the realistic practice surface, and
 * advanced options (difficulty, punctuation, numbers) live in a
 * collapsed "more options" panel so the default view never shows
 * the full 4x4x2 permutation surface. Quote mode and weak-key
 * drill have been removed; the adaptive engine can target weak
 * keys without a dedicated mode on the screen.
 */
const MODE_OPTIONS = [
  { id: MODES.PARAGRAPH, label: 'Prose',   icon: 'align-left',  length: 'duration', hint: 'Full passages of natural prose',       completion: COMPLETION.PARAGRAPH },
  { id: MODES.TIME,      label: 'Time',    icon: 'timer',       length: 'duration', hint: 'Type until the clock runs out',         completion: COMPLETION.TIME },
  { id: MODES.WORDS,     label: 'Words',   icon: 'type',        length: 'words',    hint: 'Type a fixed number of words',          completion: COMPLETION.WORDS },
  { id: MODES.CODE,      label: 'Code',    icon: 'code-2',      length: 'none',     hint: 'Real source in 16 languages',           completion: COMPLETION.CODE },
  { id: MODES.CUSTOM,    label: 'Custom',  icon: 'pencil-line', length: 'none',     hint: 'Practise on your own text',             completion: COMPLETION.CUSTOM },
];

const DIFFICULTY_OPTIONS = [
  { id: DIFFICULTIES.EASY,   label: 'easy',   hint: 'Common, short words' },
  { id: DIFFICULTIES.MEDIUM, label: 'medium', hint: 'Everyday vocabulary' },
  { id: DIFFICULTIES.HARD,   label: 'hard',   hint: 'Longer and less common words' },
  { id: DIFFICULTIES.EXPERT, label: 'expert', hint: 'Technical and rare vocabulary' },
];

export function render(container) {
  const saved = getSettings();

  let mode = saved.mode || MODES.PARAGRAPH;
  let difficulty = saved.difficulty || DIFFICULTIES.MEDIUM;
  let duration = saved.duration || 30;
  let wordCount = saved.wordCount || 50;
  let punctuation = false;
  let numbers = false;
  let customText = '';

  // The new session model owns the typing state. The page just tracks
  // whether the user has started typing yet (for UI class) and
  // whether the audio engine is initialised.
  let started = false;
  let audioReady = false;

  const settings = saved;

  container.innerHTML = html`
    <div class="practice" id="practice">
      <div class="practice__config" id="practice-config">
        <!-- The four everyday modes. A fifth (custom) is reached from its
             own panel, not from this tablist, because picking "custom"
             is a different intent than picking a preset mode. -->
        <div class="segmented" role="tablist" aria-label="Test mode">
          ${MODE_OPTIONS.filter((m) => m.id !== MODES.CUSTOM).map((m) => `
            <button class="segmented__item ${m.id === mode ? 'active' : ''}"
                    role="tab" data-mode="${m.id}"
                    aria-selected="${m.id === mode}" title="${m.hint}">
              <i data-lucide="${m.icon}"></i> ${m.label}
            </button>
          `).join('')}
        </div>

        <span class="practice__config-divider" aria-hidden="true"></span>

        <!-- Length control. Which unit applies depends on the mode, so
             only the relevant one is shown rather than greying the
             other out. -->
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

        <span class="badge badge--accent" id="practice-pb" hidden></span>

        <button class="btn btn-ghost btn-sm" id="practice-restart" title="Restart (Tab)">
          <i data-lucide="rotate-cw"></i>
          <span>restart</span>
        </button>
      </div>

      <!-- Advanced controls. Hidden by default; expand to reveal. The
           default config (mode + length) is the only thing the average
           user has to think about. Everything else lives one click
           away for the power user, and never competes for attention
           with the typing surface. -->
      <details class="practice__advanced" id="practice-advanced">
        <summary class="practice__advanced-toggle">
          <i data-lucide="sliders-horizontal"></i> More options
        </summary>
        <div class="practice__advanced-body">
          <div class="segmented" role="tablist" aria-label="Difficulty" id="practice-difficulty">
            ${DIFFICULTY_OPTIONS.map((d) => `
              <button class="segmented__item ${d.id === difficulty ? 'active' : ''}"
                      role="tab" data-difficulty="${d.id}"
                      aria-selected="${d.id === difficulty}" title="${d.hint}">${d.label}</button>
            `).join('')}
          </div>

          <div class="segmented" role="group" aria-label="Text options" id="practice-options">
            <button class="segmented__item" data-toggle="punctuation" aria-pressed="false">
              <i data-lucide="pilcrow"></i> punctuation
            </button>
            <button class="segmented__item" data-toggle="numbers" aria-pressed="false">
              <i data-lucide="hash"></i> numbers
            </button>
          </div>

          <button class="btn btn-ghost btn-sm practice__custom-trigger" id="practice-custom-trigger"
                  data-mode="${MODES.CUSTOM}">
            <i data-lucide="pencil-line"></i> Use your own text
          </button>
        </div>
      </details>

      <!-- Custom mode panel. Hidden unless the user has selected Custom. -->
      <div class="practice__custom" id="practice-custom" hidden>
        <label class="field__label" for="practice-custom-input">Your text</label>
        <textarea class="textarea" id="practice-custom-input" rows="4"
                  placeholder="Paste or type the passage you want to practise on…"></textarea>
        <div class="practice__custom-actions">
          <button class="btn btn-primary btn-sm" id="practice-custom-apply">Use this text</button>
          <button class="btn btn-ghost btn-sm" id="practice-custom-cancel">Cancel</button>
        </div>
      </div>

      <!-- Countdown. Only present in time mode, and only once typing has
           started — a static number before the clock runs is just pressure. -->
      <div class="practice__clock" id="practice-clock" hidden
           role="timer" aria-live="off" aria-label="Time remaining">
        <span class="practice__clock-value" id="practice-clock-value">0</span>
        <span class="practice__clock-unit">s</span>
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
  const clockEl      = $('#practice-clock');
  const clockValueEl = $('#practice-clock-value');

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
    audio.setVolume(settings.soundVolume ?? 0.5);
    audio.setGroupVolume('typing', settings.typingVolume ?? 0.4);
    audio.setGroupVolume('feedback', settings.feedbackVolume ?? 0.7);
    audio.setGroupVolume('ui', settings.uiVolume ?? 0.3);
    if (settings.soundEnabled === false) audio.disable();
    else audio.enable();
  };
  targetEl.addEventListener('keydown', initAudio, { once: true });
  targetEl.addEventListener('click', initAudio, { once: true });

  /**
   * The new session wiring. The page owns the lifecycle; the foundation
   * services own the math and the timing. Note that the typing
   * surface (targetEl) hosts BOTH the rendered characters (renderEl)
   * and the caret (caretEl) — same coordinate context, which is the
   * one-container fix from the audit.
   */
  const handleEnd = (result) => {
    publishSessionCompleted(result.session, { mode, difficulty, duration, wordCount });
    if (result.stats.wpm >= 60) publishMilestone(result.stats.wpm, mode);
    try { saveSession(result.session); }
    catch (err) {
      logger.warn('history', 'Could not persist session', { error: err.message });
      showToast({ message: 'Could not save this session locally; results still visible.', type: 'warning' });
    }
    checkAchievements(result.session, getStats())
      .then((unlocked) => {
        if (unlocked.length) sessionStorage.setItem('newAchievements', JSON.stringify(unlocked));
      })
      .catch((err) => logger.warn('achievements', 'Check failed', { error: err.message }));
    window.location.hash = '#/results';
  };

  let normalSession = createNormalSession({
    container: renderEl,
    caret: caretEl,
    typingSurface: targetEl,
    onSessionChange: () => { /* HUD reads via snapshot */ },
    onStatsChange: (snap) => {
      wpmEl.textContent = snap.wpm;
      accEl.textContent = snap.acc;
      progEl.textContent = `${snap.progress}%`;
      if ('remainingMs' in snap) {
        clockEl.hidden = false;
        const sec = Math.max(0, Math.ceil(snap.remainingMs / 1000));
        clockValueEl.textContent = sec;
        clockEl.classList.toggle('is-urgent', sec <= 5 && sec > 0);
      } else {
        clockEl.hidden = true;
      }
    },
    onSessionEnd: handleEnd,
  });

  /**
   * Start a new typing run. Generation-token protection: a faster
   * second start() invalidates a slow first one so the UI never
   * displays mode A's text while the underlying session is mode B.
   */
  let startGeneration = 0;
  async function startSession() {
    const gen = ++startGeneration;
    contentEngine.unlockSession();
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
      const opts = { duration, wordCount, punctuation, numbers, customText };
      text = await getText(mode, difficulty, opts);
    } catch (err) {
      logger.error('session', 'Failed to load text', { error: err.message });
      showToast({ message: 'Could not load a passage. Try again.', type: 'error' });
      return;
    }
    if (gen !== startGeneration) return; // a newer start() has superseded us

    let timeLimit = 0;
    if (mode === MODES.TIME) timeLimit = duration;
    else if (mode === MODES.PARAGRAPH) timeLimit = duration;

    await normalSession.start(text, { timeLimit });
    if (gen !== startGeneration) return;
    targetEl.focus();
  }

  // ---- legacy helper functions removed: the new foundation (session +
  // input + timer + renderer + stats) owns the typing loop. The
  // page's only remaining responsibility is config UI and lifecycle.

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

  $('#practice-custom-trigger').addEventListener('click', () => {
    mode = MODES.CUSTOM;
    persist({ mode });
    syncConfigForMode();
    $('#practice-custom-input').focus();
  });

  $('#practice-custom-cancel').addEventListener('click', () => {
    // Cancel: revert to the previous non-custom mode.
    mode = saved.mode && saved.mode !== MODES.CUSTOM ? saved.mode : MODES.PARAGRAPH;
    persist({ mode });
    syncConfigForMode();
  });

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

  /**
   * Tab: restart the run. The audit flagged two real problems with
   * the previous Tab handler:
   *   - it caught Tab globally, including when a button or select
   *     inside the page was focused
   *   - it competed with the input engine's own Tab handling
   *
   * We now only handle Tab when:
   *   - the typing surface or document.body is the active focus
   *   - the user has already started a session (i.e. a real restart
   *     is meaningful, not a no-op for a brand-new page)
   *   - no other text input or button is currently focused
   */
  const onKeyDown = (e) => {
    if (e.key !== 'Tab') return;
    if (!e.altKey && !e.ctrlKey && !e.metaKey) {
      const a = document.activeElement;
      const tag = a ? a.tagName : '';
      // Do not steal Tab from form controls inside the page.
      if (['INPUT', 'BUTTON', 'SELECT', 'TEXTAREA'].includes(tag)) return;
      // Only restart once the user has actually started typing in
      // this session. (A fresh-page Tab should still focus the next
      // control, not a phantom restart.)
      if (!started) return;
    }
    e.preventDefault();
    startSession();
  };
  document.addEventListener('keydown', onKeyDown);
  targetEl.addEventListener('click', () => targetEl.focus());

  if (window.lucide) window.lucide.createIcons();

  startSession();

  // Single source of cleanup. The new session model has its own
  // destroy() that tears down the input engine, the timer, and the
  // renderer; the page only needs to drop the document-level
  // shortcut and the audio-init one-shot.
  container._destroy = () => {
    document.removeEventListener('keydown', onKeyDown);
    targetEl.removeEventListener('keydown', initAudio);
    targetEl.removeEventListener('click', initAudio);
    targetEl.removeEventListener('click', () => targetEl.focus());
    if (normalSession) normalSession.destroy();
    if (window.lucide) { try { window.lucide.createIcons(); } catch (e) {} }
  };
}

export function destroy(container) {
  if (container._destroy) container._destroy();
}
