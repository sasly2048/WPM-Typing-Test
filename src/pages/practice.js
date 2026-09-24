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
import { getStats, getPersonalBest, saveSession } from '../services/history.js';
import { checkAchievements, publishSessionCompleted, publishMilestone } from '../services/achievements.js';
import { MODES, DIFFICULTIES } from '../constants/config.js';
import { showToast } from '../components/toast.js';
import { getSettings, saveSettings } from '../services/storage.js';
import { logger, recordInputLatency } from '../services/instrumentation.js';
import * as audio from '../services/audio.js';
import { createLiveGraph } from '../components/live-graph.js';
import { applyFromUrl, buildShareUrl } from '../utils/test-config.js';
import { createRace } from '../services/race.js';
import { createKeyboard } from '../components/keyboard.js';

const DURATIONS = [15, 30, 60, 120, 180, 300];
const WORD_COUNTS = [10, 25, 50, 75, 100, 150, 200];
/**
 * Modes a user picks between. The list is intentionally compact:
 * five preset modes cover the realistic practice surface, and
 * advanced options (difficulty, punctuation, numbers) live in a
 * collapsed "more options" panel so the default view never shows
 * the full mode x duration x modifier permutation surface.
 */
const MODE_OPTIONS = [
  { id: MODES.PARAGRAPH, label: 'Prose',     icon: 'align-left',  length: 'duration', hint: 'Full passages of natural prose',       completion: COMPLETION.PARAGRAPH, allowModifiers: true, allowLanguage: true },
  { id: MODES.TIME,      label: 'Time',      icon: 'timer',       length: 'duration', hint: 'Type until the clock runs out',         completion: COMPLETION.TIME,      allowModifiers: true, allowLanguage: true },
  { id: MODES.WORDS,     label: 'Words',     icon: 'type',        length: 'words',    hint: 'Type a fixed number of words',          completion: COMPLETION.WORDS,     allowModifiers: true },
  { id: MODES.QUOTE,     label: 'Quote',     icon: 'quote',       length: 'duration', hint: 'Words of wisdom, literature, famous lines', completion: COMPLETION.QUOTE,  allowModifiers: false },
  { id: MODES.ZEN,       label: 'Zen',       icon: 'infinity',    length: 'none',     hint: 'Endless. The page follows you.',         completion: COMPLETION.ZEN,       allowModifiers: true },
  { id: MODES.ADAPTIVE,  label: 'Adaptive',  icon: 'target',      length: 'words',    hint: 'Drill your weak keys',                  completion: COMPLETION.ADAPTIVE,  allowModifiers: false },
  { id: 'race',          label: 'Race',      icon: 'swords',      length: 'duration', hint: 'Local 1v1 race against another tab',     completion: COMPLETION.TIME,      allowModifiers: false, race: true },
  { id: MODES.CODE,      label: 'Code',      icon: 'code-2',      length: 'none',     hint: 'Real source in 16 languages',           completion: COMPLETION.CODE,      allowModifiers: false },
  { id: MODES.CUSTOM,    label: 'Custom',    icon: 'pencil-line', length: 'none',     hint: 'Practise on your own text',             completion: COMPLETION.CUSTOM,    allowModifiers: false },
];

const DIFFICULTY_OPTIONS = [
  { id: DIFFICULTIES.EASY,   label: 'easy',   hint: 'Common, short words' },
  { id: DIFFICULTIES.MEDIUM, label: 'medium', hint: 'Everyday vocabulary' },
  { id: DIFFICULTIES.HARD,   label: 'hard',   hint: 'Longer and less common words' },
  { id: DIFFICULTIES.EXPERT, label: 'expert', hint: 'Technical and rare vocabulary' },
];

export function render(container) {
  const saved = getSettings();

  // Apply URL-querystring config first (shareable test URLs override
  // saved preferences). This is the only way to load a quote,
  // zen, or adaptive run from a link.
  const urlConfig = applyFromUrl(saved, window.location.search);

  let mode = urlConfig.mode || saved.mode || MODES.PARAGRAPH;
  let difficulty = urlConfig.difficulty || saved.difficulty || DIFFICULTIES.MEDIUM;
  let duration = urlConfig.duration || saved.duration || 30;
  let wordCount = urlConfig.wordCount || saved.wordCount || 50;
  let language = urlConfig.language || saved.language || 'en';
  let punctuation = urlConfig.punctuation ?? saved.punctuation ?? false;
  let numbers = urlConfig.numbers ?? saved.numbers ?? false;
  let customText = urlConfig.customText || saved.customText || '';
  let zenStartedAt = 0;
  let zenWordsTyped = 0;

  // The new session model owns the typing state. The page just tracks
  // whether the user has started typing yet (for UI class) and
  // whether the audio engine is initialised.
  let started = false;
  let audioReady = false;
  let currentText = '';
  let currentName = '';
  let liveGraph = null;
  let rafLoop = 0;
  let replayTimeline = [];
  let replayStartAt = 0;

  const settings = saved;

  // Apply typography + accessibility settings to the document so they
  // affect the practice surface and the rest of the page uniformly.
  (function applySettings() {
    const root = document.documentElement;
    const families = {
      monospace: 'var(--font-mono)',
      sans: 'var(--font-sans)',
      serif: 'var(--font-serif)',
      dyslexic: '"OpenDyslexic", monospace',
      fira: '"Fira Code", monospace',
      jetbrains: '"JetBrains Mono", monospace',
    };
    const family = families[settings.fontFamily] || families.monospace;
    root.style.setProperty('--typing-font-family', family);
    // fontSize in settings is in pixels (user picks 16-48). The design
    // tokens use rem, so convert.
    const sizePx = settings.fontSize || 24;
    root.style.setProperty('--typing-font-size', `${sizePx / 10}rem`);
    root.setAttribute('data-caret', settings.caretStyle || 'line');
    root.setAttribute('data-smooth-caret', settings.smoothCaret === false ? 'off' : 'on');
    if (settings.reducedMotion) root.classList.add('reduce-motion');
    if (settings.highContrast) root.classList.add('high-contrast');
    if (settings.colorBlindSafe) root.setAttribute('data-cb-safe', 'on');
  })();

  container.innerHTML = html`
    <div class="practice" id="practice">
      <div class="practice__config" id="practice-config">
        <div class="segmented segmented--scroll" role="tablist" aria-label="Test mode">
          ${MODE_OPTIONS.filter((m) => m.id !== MODES.CUSTOM).map((m) => `
            <button class="segmented__item ${m.id === mode ? 'active' : ''}"
                    role="tab" data-mode="${m.id}"
                    aria-selected="${m.id === mode}" title="${m.hint}">
              <i data-lucide="${m.icon}"></i> ${m.label}
            </button>
          `).join('')}
        </div>

        <span class="practice__config-divider" aria-hidden="true"></span>

        <div class="segmented" role="tablist" aria-label="Test length" id="practice-length">
          ${DURATIONS.map((d) => `
            <button class="segmented__item ${d === duration ? 'active' : ''}"
                    role="tab" data-duration="${d}"
                    aria-selected="${d === duration}">${d < 60 ? d + 's' : Math.floor(d / 60) + 'm'}</button>
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
          <span class="hide-sm">restart</span>
        </button>

        <button class="btn btn-ghost btn-sm" id="practice-share" title="Copy a shareable test link">
          <i data-lucide="link"></i>
          <span class="hide-sm">share</span>
        </button>
      </div>

      <details class="practice__advanced" id="practice-advanced">
        <summary class="practice__advanced-toggle">
          <i data-lucide="sliders-horizontal"></i> More options
        </summary>
        <div class="practice__advanced-body">
          <label class="field field--inline" for="practice-language">
            <span class="field__label">Language</span>
            <select class="select select--narrow" id="practice-language" aria-label="Language">
              ${[
                { id: 'en', label: 'English' },
                { id: 'fr', label: 'Français' },
                { id: 'de', label: 'Deutsch' },
                { id: 'it', label: 'Italiano' },
                { id: 'pt', label: 'Português' },
                { id: 'sv', label: 'Svenska' },
                { id: 'pl', label: 'Polski' },
                { id: 'cs', label: 'Čeština' },
                { id: 'tr', label: 'Türkçe' },
                { id: 'ro', label: 'Română' },
              ].map((l) => `
                <option value="${l.id}" ${l.id === language ? 'selected' : ''}>${l.label}</option>
              `).join('')}
            </select>
          </label>

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
            <button class="segmented__item ${settings.showKeyboard ? 'active' : ''}" data-toggle="showKeyboard" aria-pressed="${!!settings.showKeyboard}" title="Show on-screen keyboard">
              <i data-lucide="keyboard"></i> <span class="hide-sm">keyboard</span>
            </button>
          </div>

          <div class="segmented" role="group" aria-label="Behaviour" id="practice-behaviours">
            <button class="segmented__item" data-toggle="stopOnError" aria-pressed="${!!settings.stopOnError}" title="Block input until a wrong character is corrected">
              <i data-lucide="octagon-x"></i> stop on error
            </button>
            <button class="segmented__item ${settings.freedom === false ? 'active' : ''}" data-toggle="freedom" aria-pressed="${settings.freedom === false ? 'true' : 'false'}" title="Force backspace before moving on">
              <i data-lucide="undo-2"></i> strict
            </button>
            <button class="segmented__item" data-toggle="confidence" aria-pressed="${!!settings.confidence}" title="Reveal each word as you finish the previous one">
              <i data-lucide="eye"></i> confidence
            </button>
            <button class="segmented__item" data-toggle="easyMode" aria-pressed="${!!settings.easyMode}" title="Auto-correct the previous mistake on the next keystroke">
              <i data-lucide="wand"></i> easy
            </button>
          </div>

          <button class="btn btn-ghost btn-sm practice__custom-trigger" id="practice-custom-trigger"
                  data-mode="${MODES.CUSTOM}">
            <i data-lucide="pencil-line"></i> <span class="hide-sm">Use your own text</span><span class="show-sm">Custom</span>
          </button>
        </div>
      </details>

      <div class="practice__custom" id="practice-custom" hidden>
        <label class="field__label" for="practice-custom-input">Your text</label>
        <textarea class="textarea" id="practice-custom-input" rows="4"
                  placeholder="Paste or type the passage you want to practise on…">${customText ? customText.replace(/</g, '&lt;') : ''}</textarea>
        <div class="practice__custom-actions">
          <button class="btn btn-primary btn-sm" id="practice-custom-apply">Use this text</button>
          <button class="btn btn-ghost btn-sm" id="practice-custom-cancel">Cancel</button>
        </div>
      </div>

      <div class="practice__clock" id="practice-clock" hidden
           role="timer" aria-live="off" aria-label="Time remaining">
        <span class="practice__clock-value" id="practice-clock-value">0</span>
        <span class="practice__clock-unit">s</span>
      </div>

      <!-- Race lobby. Visible only when race mode is selected. -->
      <div class="practice__race" id="practice-race" hidden>
        <div class="practice__race-row">
          <button class="btn btn-secondary btn-sm" id="race-host">Host a race</button>
          <span class="practice__race-or">or</span>
          <input type="text" class="input" id="race-code" placeholder="Room code" maxlength="5" style="width:120px">
          <button class="btn btn-secondary btn-sm" id="race-join">Join</button>
        </div>
        <p class="practice__race-hint">Open a second KeyFlow tab to play. Race text and progress sync live between the two tabs.</p>
      </div>

      <!-- Race strip: visible only in race mode -->
      <div class="race-strip" id="race-strip" hidden>
        <div class="race-strip__lane race-strip__lane--you" id="race-lane-you">
          <span class="race-strip__name" id="race-name-you">You</span>
          <div class="race-strip__track"><div class="race-strip__bar" id="race-bar-you"></div></div>
          <span class="race-strip__wpm" id="race-wpm-you">0</span>
        </div>
        <div class="race-strip__lane race-strip__lane--opp" id="race-lane-opp">
          <span class="race-strip__name" id="race-name-opp">Opponent</span>
          <div class="race-strip__track"><div class="race-strip__bar" id="race-bar-opp"></div></div>
          <span class="race-strip__wpm" id="race-wpm-opp">0</span>
        </div>
      </div>

      <div class="practice__surface">
        <div class="typing-surface" id="practice-target" tabindex="0"
             role="textbox" aria-label="Typing test text" aria-describedby="practice-source">
          <div class="caret" id="practice-caret"></div>
          <div id="practice-render"></div>
        </div>
      </div>

      <!-- On-screen keyboard. Off by default; toggle from the practice
           options. Useful for touch typing learners and for confirming
           layout remaps. -->
      <div class="practice__keyboard" id="practice-keyboard" hidden>
        <div class="practice__keyboard-head">
          <span class="practice__keyboard-title">Keyboard</span>
          <select class="select select--narrow" id="practice-layout" aria-label="Keyboard layout">
            <option value="qwerty">QWERTY</option>
            <option value="dvorak">Dvorak</option>
            <option value="colemak">Colemak</option>
          </select>
        </div>
        <div id="practice-keyboard-host"></div>
      </div>

      <div class="practice__footer">
        <div class="live-hud" id="practice-hud">
          <div class="live-hud__item live-hud__item--primary">
            <span class="live-hud__value" id="practice-wpm">0</span>
            <span class="live-hud__label">wpm</span>
          </div>
          <div class="live-hud__item">
            <span class="live-hud__value" id="practice-raw">0</span>
            <span class="live-hud__label">raw</span>
          </div>
          <div class="live-hud__item">
            <span class="live-hud__value" id="practice-acc">100</span>
            <span class="live-hud__label">acc</span>
          </div>
          <div class="live-hud__item">
            <span class="live-hud__value" id="practice-burst">0</span>
            <span class="live-hud__label">burst</span>
          </div>
          <div class="live-hud__item">
            <span class="live-hud__value" id="practice-focus">—</span>
            <span class="live-hud__label">focus</span>
          </div>
          <!-- Screen-reader mirror of the live stats. The visual tiles update
               every frame (too chatty for AT); this polite region is updated
               about once a second with a spoken summary. -->
          <p class="sr-only" id="practice-live-announce" role="status" aria-live="polite" aria-atomic="true"></p>
          <div class="live-hud__item live-hud__item--graph">
            <div class="live-graph" id="practice-graph" aria-label="WPM over time"></div>
          </div>
          <div class="live-hud__item live-hud__item--graph">
            <div class="live-graph" id="practice-acc-graph" aria-label="Accuracy over time"></div>
          </div>
        </div>

        <p class="practice__hint">
          <span class="practice__hint-keys">
            <kbd>Tab</kbd> restart · <kbd>Esc</kbd> command bar
          </span>
          <span class="practice__hint-text">Click or start typing to begin</span>
        </p>
      </div>
    </div>
  `;

  const $ = (sel) => container.querySelector(sel);

  const root     = $('#practice');
  const targetEl = $('#practice-target');
  const renderEl = $('#practice-render');
  const caretEl  = $('#practice-caret');
  const announceEl = $('#practice-live-announce');
  let lastAnnounceAt = 0;
  const wpmEl    = $('#practice-wpm');
  const rawEl    = $('#practice-raw');
  const accEl    = $('#practice-acc');
  const burstEl  = $('#practice-burst');
  const focusEl  = $('#practice-focus');
  const clockEl      = $('#practice-clock');
  const clockValueEl = $('#practice-clock-value');
  const sourceEl = $('#practice-source');
  const pbEl     = $('#practice-pb');
  const graphEl  = $('#practice-graph');
  const accGraphEl = $('#practice-acc-graph');
  const keyboardEl = $('#practice-keyboard');
  const keyboardHostEl = $('#practice-keyboard-host');
  const layoutSel = $('#practice-layout');

  // Build the live WPM graph
  liveGraph = createLiveGraph(graphEl, { maxSamples: 60 });

  // Build the live accuracy graph. We use a fixed 0-100 scale so the
  // visual cost of a single mistake is visible at a glance — and a
  // 95% target line so the user has a reference point.
  let accGraph = createLiveGraph(accGraphEl, {
    maxSamples: 60,
    color: 'rgba(120, 220, 180, 0.95)',
    fillColor: 'rgba(120, 220, 180, 0.18)',
    targetLine: 95,
    minY: 60,
    maxY: 100,
  });
  // Focus index: 0-100, derived from pause frequency.
  let liveFocus = null;

  // On-screen keyboard (lazy — only constructed when the user
  // toggles it on, so it doesn't add cost to the default view).
  let keyboard = null;
  const ensureKeyboard = () => {
    if (keyboard) return keyboard;
    keyboard = createKeyboard(keyboardHostEl, { layout: settings.layout || 'qwerty' });
    return keyboard;
  };
  if (settings.showKeyboard) {
    ensureKeyboard();
    keyboardEl.hidden = false;
  } else {
    keyboardEl.hidden = true;
  }

  const persist = (patch) => {
    Object.assign(settings, patch);
    saveSettings(settings);
  };

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
  targetEl.addEventListener('touchstart', initAudio, { once: true, passive: true });

  const handleEnd = (result) => {
    if (result.stats.wpm >= 60) publishMilestone(result.stats.wpm, mode);
    let finalSession;
    try {
      finalSession = {
        ...result.session,
        // One stable timestamp shared by every persist path so the two
        // writers (saveSession + publishSessionCompleted) collapse to a
        // single history row instead of one bare + one complete row.
        timestamp: Date.now(),
        wpm: result.stats.wpm,
        rawWpm: result.stats.rawWpm,
        accuracy: result.stats.accuracy,
        consistency: result.stats.stability,
        errors: result.stats.errors,
        mode,
        difficulty,
        duration,
        wordCount,
        language,
        source: currentName,
        chars: {
          correct: result.stats.correct,
          incorrect: result.stats.incorrect,
          extra: result.stats.extra,
          missed: result.stats.missed,
        },
        mistakesByKey: result.stats.mistakesByKey,
        speedCurve: result.stats.speedCurve,
        backspaceCount: result.stats.backspaceCount,
        correctedErrors: result.stats.correctedErrors,
        totalStrokes: result.stats.totalStrokes,
        // Fair-play: how many synthetic (untrusted) input events were dropped.
        // >0 means the run may have been (partly) automated; surfaced on results.
        untrustedEvents: (normalSession.getUntrustedEventCount
          ? normalSession.getUntrustedEventCount() : 0),
      };
      sessionStorage.setItem('lastSession', JSON.stringify(finalSession));
      if (replayTimeline.length > 0) {
        const lastT = replayTimeline[replayTimeline.length - 1]?.timestamp || 0;
        sessionStorage.setItem('lastReplay', JSON.stringify({
          text: currentText,
          timeline: replayTimeline,
          totalTimeMs: lastT,
          isCode: mode === MODES.CODE,
          source: currentName,
        }));
      }
      saveSession(finalSession);
      // Publish the completion event with the SAME record + timestamp. The
      // publisher persists too but dedups on timestamp, so this only emits the
      // event and refreshes achievements -- it no longer writes a second
      // (wpm-less) row the way `result.session` did.
      publishSessionCompleted(finalSession, { mode, difficulty, duration, wordCount });
    } catch (err) {
      logger.warn('history', 'Could not persist session', { error: err.message });
      showToast({ message: 'Could not save this session locally; results still visible.', type: 'warning' });
      // Still emit the event so achievements/results update even if the
      // history write failed.
      publishSessionCompleted(result.session, { mode, difficulty, duration, wordCount });
    }
    checkAchievements(finalSession || result.session, getStats())
      .then((unlocked) => {
        if (unlocked.length) sessionStorage.setItem('newAchievements', JSON.stringify(unlocked));
      })
      .catch((err) => logger.warn('achievements', 'Check failed', { error: err.message }));
    window.location.hash = '#/results';
  };

  const normalSession = createNormalSession({
    container: renderEl,
    caret: caretEl,
    typingSurface: targetEl,
    layout: settings.layout || 'qwerty',
    requireTrusted: settings.fairPlay !== false,
    onSessionChange: (session) => {
      if (!session) return;
      // Record a replay frame. Format expected by replay.js:
      //   { timestamp, char, correct, backspace }
      // Compact enough for thousands of frames; we cap to keep
      // sessionStorage bounded.
      const recent = session.lastInput;
      if (recent && recent.kind === 'character') {
        const i = Math.max(0, session.cursor - 1);
        const ok = i < session.originalText.length
          && session.typed[i] === session.originalText[i];
        replayTimeline.push({
          timestamp: performance.now() - (replayStartAt || 0),
          char: recent.key || '',
          correct: !!ok,
        });
        if (replayTimeline.length > 5000) replayTimeline.shift();
        // Light up the keyboard: last pressed key, next expected key.
        if (keyboard) {
          keyboard.setLast({ key: recent.key, correct: ok });
          const nextCh = session.originalText[session.cursor] || '';
          keyboard.setExpected(nextCh);
        }
      } else if (recent && recent.kind === 'backspace') {
        replayTimeline.push({
          timestamp: performance.now() - (replayStartAt || 0),
          char: 'Backspace',
        });
        if (keyboard) {
          keyboard.setLast({ key: 'backspace', correct: true });
          const nextCh = session.originalText[session.cursor] || '';
          keyboard.setExpected(nextCh);
        }
      } else {
        // Other input kinds (arrow, etc): just refresh the next-key
        // indicator to whatever the cursor is at.
        if (keyboard) {
          const nextCh = session.originalText[session.cursor] || '';
          keyboard.setExpected(nextCh);
        }
      }

      // Zen mode: when the user reaches the end, append more text
      // smoothly so the run feels endless.
      if (mode === MODES.ZEN && session.cursor >= session.originalText.length - 5) {
        appendZenChunk(session);
      }
    },
    onStatsChange: (snap) => {
      wpmEl.textContent = snap.wpm;
      rawEl.textContent = snap.rawWpm ?? 0;
      accEl.textContent = snap.acc;
      burstEl.textContent = snap.burstWpm ?? 0;
      // Live focus: 0-100, lower when there are many pauses.
      const f = liveFocus != null ? liveFocus : computeLiveFocus(snap);
      if (f != null) {
        focusEl.textContent = f;
        liveFocus = f;
      } else {
        focusEl.textContent = '—';
      }
      // Announce a compact spoken summary at most once per second so AT
      // users get live feedback without a torrent of interruptions.
      const nowMs = performance.now();
      if (announceEl && nowMs - lastAnnounceAt >= 1000) {
        lastAnnounceAt = nowMs;
        announceEl.textContent = `${snap.wpm} words per minute, ${snap.acc}% accuracy`;
      }
      liveGraph.push(snap.wpm);
      accGraph.push(snap.acc);
      if ('remainingMs' in snap) {
        clockEl.hidden = false;
        const sec = Math.max(0, Math.ceil(snap.remainingMs / 1000));
        clockValueEl.textContent = sec;
        clockEl.classList.toggle('is-urgent', sec <= 5 && sec > 0);
      } else if (mode === MODES.ZEN) {
        clockEl.hidden = false;
        const elapsed = Math.floor((performance.now() - zenStartedAt) / 1000);
        clockValueEl.textContent = elapsed;
        clockEl.classList.remove('is-urgent');
      } else {
        clockEl.hidden = true;
      }
    },
    onSessionEnd: handleEnd,
  });

  // Push current mode flags into the session. The settings store is
  // the source of truth; we re-sync on every start.
  const syncModeFlags = () => {
    normalSession.setMode({
      stopOnError: !!settings.stopOnError,
      freedom: settings.freedom !== false, // default true
      confidence: !!settings.confidence,
      easy: !!settings.easyMode,
    });
  };
  syncModeFlags();

  const appendZenChunk = async (session) => {
    // Generate more text and append to the typing surface.
    // The session model is immutable; instead we update the
    // renderer's view of the source text by injecting new spans
    // for the appended text. This is a soft append — the existing
    // session state is preserved up to where it was.
    const more = await getText(MODES.ZEN, difficulty, { zenTarget: 200 });
    const oldLen = session.originalText.length;
    const appended = more.code;
    currentText = currentText + ' ' + appended;
    // Patch the underlying session by recreating it with the new
    // text but preserving typed[] for the first part.
    const newSession = {
      originalText: currentText,
      typed: session.typed.slice().concat(new Array(appended.length + 1).fill(null)),
      cursor: session.cursor,
      state: session.state === 'completed' ? 'running' : session.state,
      lastInput: null,
    };
    // Re-render the additional characters only
    const tokens = new Array(appended.length);
    for (let i = 0; i < appended.length; i++) {
      tokens[i] = { char: appended[i], status: 'pending' };
    }
    normalSession.appendText(appended, tokens);
  };

  /**
   * Live focus index. Mirrors the lifetime focus index formula
   * (pauses per 100 strokes; lower = worse) but runs on the in-flight
   * session. Returns null when there isn't enough signal yet.
   */
  const computeLiveFocus = (snap) => {
    // Read strokes + pauses straight from the live snapshot. The previous
    // version read them off normalSession.getStats(), which returns the stats
    // controller (no totalStrokes/pauseCount fields), so `pauses` was always 0
    // and focus was pinned at 100 once 20 strokes were reached.
    if (!snap) return null;
    const strokes = snap.totalStrokes || 0;
    if (strokes < 20) return null;
    const pauses = snap.pauseCount || 0;
    const pausesPer100 = (pauses / strokes) * 100;
    return Math.max(0, Math.min(100, Math.round(100 - pausesPer100 * 4)));
  };

  let startGeneration = 0;
  async function startSession() {
    const gen = ++startGeneration;
    contentEngine.unlockSession();
    started = false;
    liveGraph.clear();
    accGraph.clear();
    liveFocus = null;
    replayTimeline = [];
    replayStartAt = performance.now();
    root.classList.remove('is-typing');
    root.classList.toggle('blind-mode', !!settings.blindMode);

    const pb = getPersonalBest(mode, { targetDuration: duration, targetWordCount: wordCount });
    if (pb > 0 && mode !== MODES.ZEN && mode !== MODES.ADAPTIVE) {
      pbEl.textContent = `PB ${pb} wpm`;
      pbEl.hidden = false;
    } else {
      pbEl.hidden = true;
    }

    let text;
    try {
      // Only forward the human-language selection to modes that actually use
      // it (Prose/Time). Words/Zen/Adaptive have no multilingual pools, and
      // Code reads its own programming-language from keyflow_dev_lang -- passing
      // e.g. 'fr' here made Code silently fall back to JavaScript.
      const spec = MODE_OPTIONS.find((m) => m.id === mode);
      const opts = { duration, wordCount, punctuation, numbers, customText };
      if (spec && spec.allowLanguage) opts.language = language;
      text = await getText(mode, difficulty, opts);
    } catch (err) {
      logger.error('session', 'Failed to load text', { error: err.message });
      showToast({ message: 'Could not load a passage. Try again.', type: 'error' });
      return;
    }
    if (gen !== startGeneration) return;

    if (typeof text === 'object' && text !== null) {
      currentText = text.code || '';
      currentName = text.name || '';
    } else {
      currentText = text || '';
      currentName = '';
    }

    if (currentName && (mode === MODES.QUOTE || mode === MODES.CODE)) {
      sourceEl.textContent = mode === MODES.QUOTE ? `— ${currentName}` : currentName;
      sourceEl.hidden = false;
    } else if (currentName && mode === MODES.ADAPTIVE) {
      sourceEl.textContent = currentName;
      sourceEl.hidden = false;
    } else if (currentName && mode === MODES.PARAGRAPH) {
      sourceEl.textContent = currentName;
      sourceEl.hidden = false;
    } else {
      sourceEl.hidden = true;
    }

    let timeLimit = 0;
    if (mode === MODES.TIME || mode === MODES.PARAGRAPH || mode === MODES.QUOTE) timeLimit = duration;
    // Zen has no time limit; the timer counts up.
    if (mode === MODES.ZEN) {
      zenStartedAt = performance.now();
    }

    await normalSession.start(currentText, { timeLimit });
    if (gen !== startGeneration) return;
    // Prime the keyboard with the first expected key.
    if (keyboard) {
      keyboard.setLast(null);
      keyboard.setExpected(currentText[0] || '');
    }
    targetEl.focus();
  }

  function syncConfigForMode() {
    const spec = MODE_OPTIONS.find((m) => m.id === mode) || MODE_OPTIONS[0];
    $('#practice-length').hidden = spec.length !== 'duration';
    $('#practice-words').hidden = spec.length !== 'words';
    $('#practice-custom').hidden = mode !== MODES.CUSTOM;
    $('#practice-options').hidden = !spec.allowModifiers || mode === MODES.CUSTOM;
    $('#practice-race').hidden = !spec.race;
    $('#race-strip').hidden = !spec.race;
    // Disable language for code and zen
    const langEl = $('#practice-language');
    if (langEl) {
      langEl.disabled = !spec.allowLanguage;
      langEl.parentElement.style.opacity = spec.allowLanguage ? '' : '0.4';
    }
  }

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

  // If the page was opened from a shareable URL, strip the ?c=
  // query so a refresh shows the user's normal config rather than
  // the shared one. The user can always re-share to get a link back.
  if (window.location.search.includes('c=')) {
    const clean = window.location.origin + window.location.pathname + window.location.hash;
    window.history.replaceState({}, '', clean);
  }
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

  wireGroup('mode', (v) => { mode = v; persist({ mode }); });
  wireGroup('duration', (v) => { duration = Number(v); persist({ duration }); });
  wireGroup('words', (v) => { wordCount = Number(v); persist({ wordCount }); });
  wireGroup('difficulty', (v) => { difficulty = v; persist({ difficulty }); });

  const languageEl = $('#practice-language');
  if (languageEl) {
    languageEl.addEventListener('change', () => {
      if (contentEngine.isSessionLocked) return;
      language = languageEl.value;
      persist({ language });
      startSession();
    });
  }

  container.querySelectorAll('[data-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (contentEngine.isSessionLocked) return;
      const key = btn.dataset.toggle;
      const next = btn.getAttribute('aria-pressed') !== 'true';
      btn.setAttribute('aria-pressed', String(next));
      btn.classList.toggle('active', next);
      if (key === 'punctuation') { punctuation = next; persist({ punctuation }); }
      if (key === 'numbers') { numbers = next; persist({ numbers }); }
      if (key === 'showKeyboard') {
        persist({ showKeyboard: next });
        if (next) {
          ensureKeyboard();
          keyboardEl.hidden = false;
        } else {
          keyboardEl.hidden = true;
        }
      }
      if (key === 'stopOnError') { persist({ stopOnError: next }); syncModeFlags(); }
      if (key === 'freedom') { persist({ freedom: next }); syncModeFlags(); }
      if (key === 'confidence') { persist({ confidence: next }); syncModeFlags(); }
      if (key === 'easyMode') { persist({ easyMode: next }); syncModeFlags(); }
      startSession();
    });
  });

  if (layoutSel) {
    layoutSel.value = settings.layout || 'qwerty';
    layoutSel.addEventListener('change', () => {
      const id = layoutSel.value;
      persist({ layout: id });
      if (keyboard) keyboard.setLayout(id);
      if (normalSession && normalSession.setLayout) normalSession.setLayout(id);
    });
  }

  $('#practice-custom-apply').addEventListener('click', () => {
    const value = $('#practice-custom-input').value.trim();
    if (!value) {
      showToast({ message: 'Enter some text to practise on.', type: 'warning' });
      return;
    }
    customText = value;
    persist({ customText });
    startSession();
  });

  $('#practice-custom-cancel').addEventListener('click', () => {
    mode = saved.mode && saved.mode !== MODES.CUSTOM ? saved.mode : MODES.PARAGRAPH;
    persist({ mode });
    syncConfigForMode();
  });

  $('#practice-restart').addEventListener('click', () => {
    if (!contentEngine.isSessionLocked) startSession();
  });

  $('#practice-share').addEventListener('click', async () => {
    const cfg = { mode, difficulty, duration, wordCount, language };
    if (punctuation) cfg.punctuation = true;
    if (numbers) cfg.numbers = true;
    if (mode === MODES.CUSTOM && customText) cfg.customText = customText;
    const url = buildShareUrl(window.location.origin + window.location.pathname + '#/practice', cfg);
    try {
      await navigator.clipboard.writeText(url);
      const btn = $('#practice-share');
      const orig = btn.innerHTML;
      btn.innerHTML = '<i data-lucide="check"></i> Copied';
      if (window.lucide) window.lucide.createIcons();
      setTimeout(() => { btn.innerHTML = orig; if (window.lucide) window.lucide.createIcons(); }, 1500);
    } catch {
      showToast({ message: 'Copy failed — share URL in address bar.', type: 'warning' });
    }
  });

  // ---- Race mode wiring -------------------------------------------------
  let race = null;
  if (typeof BroadcastChannel !== 'undefined') {
    race = createRace({ name: 'You' });
    const paintRaceStrip = (s) => {
      if (!s || s.role === 'idle') return;
      const you = s.racer || { cursor: 0, wpm: 0 };
      const opp = s.opponent || { cursor: 0, wpm: 0 };
      const total = (s.text || '').length || 1;
      const youPct = Math.min(100, Math.round((you.cursor / total) * 100));
      const oppPct = Math.min(100, Math.round((opp.cursor / total) * 100));
      const yBar = $('#race-bar-you'); if (yBar) yBar.style.width = youPct + '%';
      const oBar = $('#race-bar-opp'); if (oBar) oBar.style.width = oppPct + '%';
      const yWpm = $('#race-wpm-you'); if (yWpm) yWpm.textContent = you.wpm;
      const oWpm = $('#race-wpm-opp'); if (oWpm) oWpm.textContent = opp.wpm;
      const oName = $('#race-name-opp'); if (oName) oName.textContent = opp.name || 'Opponent';
    };
    race.on(paintRaceStrip);

    $('#race-host').addEventListener('click', async () => {
      const text = await getText(MODES.PARAGRAPH, difficulty, { duration, language });
      const room = (Math.random().toString(36).slice(2, 7)).toUpperCase();
      race.startAsHost({ text, duration, room });
      const codeInput = $('#race-code');
      if (codeInput) codeInput.value = room;
      showToast({ message: `Race room: ${room}. Open another tab and join.`, type: 'info' });
      setTimeout(() => race.startCountdown(), 200);
    });

    $('#race-join').addEventListener('click', () => {
      const code = ($('#race-code').value || '').toUpperCase().trim();
      if (!code) { showToast({ message: 'Enter a room code.', type: 'warning' }); return; }
      race.joinRoom(code);
    });
  } else {
    $('#practice-race').innerHTML = '<p class="practice__race-hint">Race requires a browser that supports BroadcastChannel. Try Chrome, Edge, Firefox, or Safari 15.4+.</p>';
  }

  syncConfigForMode();

  // Detect first keystroke for "is-typing" class
  const markStarted = () => { started = true; root.classList.add('is-typing'); };
  targetEl.addEventListener('keydown', () => { if (!started) markStarted(); }, { once: true });

  // Tab restart (existing behavior, scoped)
  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      // Open the command bar if one is registered globally.
      if (window.kfOpenCommandBar) { e.preventDefault(); window.kfOpenCommandBar(); return; }
    }
    if (e.key !== 'Tab') return;
    if (!e.altKey && !e.ctrlKey && !e.metaKey) {
      const a = document.activeElement;
      const tag = a ? a.tagName : '';
      if (['INPUT', 'BUTTON', 'SELECT', 'TEXTAREA'].includes(tag)) return;
      if (!started) return;
    }
    e.preventDefault();
    startSession();
  };
  document.addEventListener('keydown', onKeyDown);
  targetEl.addEventListener('click', () => targetEl.focus());

  // Mobile swipe-to-restart. A 200px horizontal swipe on the typing
  // surface triggers a restart. Vertical scrolls pass through.
  let touchStartX = 0, touchStartY = 0, touchT = 0;
  targetEl.addEventListener('touchstart', (e) => {
    const t = e.touches[0];
    if (!t) return;
    touchStartX = t.clientX; touchStartY = t.clientY; touchT = Date.now();
  }, { passive: true });
  targetEl.addEventListener('touchend', (e) => {
    const t = e.changedTouches[0];
    if (!t) return;
    const dx = t.clientX - touchStartX;
    const dy = t.clientY - touchStartY;
    const dt = Date.now() - touchT;
    if (Math.abs(dx) > 200 && Math.abs(dx) > Math.abs(dy) * 2 && dt < 600 && started) {
      startSession();
    }
  }, { passive: true });

  if (window.lucide) window.lucide.createIcons();

  startSession();

  container._destroy = () => {
    document.removeEventListener('keydown', onKeyDown);
    targetEl.removeEventListener('keydown', initAudio);
    targetEl.removeEventListener('click', initAudio);
    targetEl.removeEventListener('touchstart', initAudio);
    if (liveGraph) liveGraph.destroy();
    if (accGraph) accGraph.destroy();
    if (keyboard) keyboard.destroy();
    if (normalSession) normalSession.destroy();
    if (window.lucide) { try { window.lucide.createIcons(); } catch (e) {} }
  };
}

export function destroy(container) {
  if (container._destroy) container._destroy();
}
