/**
 * Settings.
 *
 * Grouped by what each setting affects, not by data type. Every control writes
 * through immediately — there is no save button, because a preferences screen
 * whose changes can be lost by navigating away is a trap.
 */

import { html } from '../utils/dom.js';
import { getSettings, saveSettings, exportData, importData, clear } from '../services/storage.js';
import {
  getAppearance, setAppearance,
  getTheme, setTheme, THEMES,
  getDevAccent, setDevAccent, DEV_ACCENTS, DEV_ACCENT_OPTIONS,
} from '../services/theme.js';
import { showToast } from '../components/toast.js';
import { logger } from '../services/instrumentation.js';
import * as audio from '../services/audio.js';

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const APPEARANCES = [
  { id: 'light',  label: 'Light',  icon: 'sun' },
  { id: 'dark',   label: 'Dark',   icon: 'moon' },
  { id: 'system', label: 'System', icon: 'monitor' },
];

const SOUND_PROFILES = [
  { id: 'none',       label: 'Silent' },
  { id: 'mechanical', label: 'Mechanical' },
  { id: 'soft',       label: 'Soft' },
  { id: 'typewriter', label: 'Typewriter' },
];

export function render(container) {
  const settings = getSettings();

  const update = (patch) => {
    Object.assign(settings, patch);
    saveSettings(settings);
  };

  container.innerHTML = html`
    <div class="page page--narrow settings">
      <header class="page-header">
        <div>
          <h1 class="page-header__title">Settings</h1>
          <p class="page-header__desc">Preferences are saved automatically to this browser.</p>
        </div>
      </header>

      <section class="section">
        <h2 class="section__label">Appearance</h2>
        <div class="card">
          <div class="setting-row">
            <div class="setting-row__text">
              <div class="setting-row__title">Theme</div>
              <div class="setting-row__desc">Visual identity for the reading surface. See all of them on the <a href="#/themes">Appearance</a> page.</div>
            </div>
            <div class="setting-row__control">
              <select class="select" id="theme-select" aria-label="Theme" style="width:200px">
                ${THEMES.map((t) => `
                  <option value="${esc(t.id)}" ${getTheme() === t.id ? 'selected' : ''}>${esc(t.label)}</option>
                `).join('')}
              </select>
            </div>
          </div>

          <div class="setting-row">
            <div class="setting-row__text">
              <div class="setting-row__title">Light or dark</div>
              <div class="setting-row__desc">Only Paper follows this. Other themes carry their own light/dark identity.</div>
            </div>
            <div class="setting-row__control">
              <div class="segmented" role="radiogroup" aria-label="Appearance">
                ${APPEARANCES.map((a) => `
                  <button class="segmented__item ${getAppearance() === a.id ? 'active' : ''}"
                          role="radio" data-appearance="${a.id}"
                          aria-checked="${getAppearance() === a.id}">
                    <i data-lucide="${a.icon}"></i> ${a.label}
                  </button>
                `).join('')}
              </div>
            </div>
          </div>

          <div class="setting-row">
            <div class="setting-row__text">
              <div class="setting-row__title">Developer accent</div>
              <div class="setting-row__desc">Terminal highlight colour in the developer workspace.</div>
            </div>
            <div class="setting-row__control">
              <div class="swatch-row" role="radiogroup" aria-label="Developer accent">
                ${DEV_ACCENT_OPTIONS.map((a) => `
                  <button class="swatch ${getDevAccent() === a.id ? 'active' : ''}"
                          role="radio" data-accent="${esc(a.id)}"
                          aria-checked="${getDevAccent() === a.id}"
                          title="${esc(a.label)}" aria-label="${esc(a.label)}"
                          style="--swatch:${esc(a.accent)}"></button>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="section">
        <h2 class="section__label">Typing</h2>
        <div class="card">
          <div class="setting-row">
            <div class="setting-row__text">
              <div class="setting-row__title">Blind mode</div>
              <div class="setting-row__desc">Hide live speed and accuracy while typing to reduce pressure.</div>
            </div>
            <div class="setting-row__control">
              <button class="switch" role="switch" data-toggle="blindMode"
                      aria-checked="${!!settings.blindMode}" aria-label="Blind mode"></button>
            </div>
          </div>

          <div class="setting-row">
            <div class="setting-row__text">
              <div class="setting-row__title">Fair play detection</div>
              <div class="setting-row__desc">Warn on paste and other input that would invalidate a result.</div>
            </div>
            <div class="setting-row__control">
              <button class="switch" role="switch" data-toggle="fairPlay"
                      aria-checked="${settings.fairPlay !== false}" aria-label="Fair play detection"></button>
            </div>
          </div>

          <div class="setting-row">
            <div class="setting-row__text">
              <div class="setting-row__title">Stop on error</div>
              <div class="setting-row__desc">Block further input until a mistyped character is corrected.</div>
            </div>
            <div class="setting-row__control">
              <button class="switch" role="switch" data-toggle="stopOnError"
                      aria-checked="${!!settings.stopOnError}" aria-label="Stop on error"></button>
            </div>
          </div>
        </div>
      </section>

      <section class="section">
        <h2 class="section__label">Sound</h2>
        <div class="card">
          <div class="setting-row">
            <div class="setting-row__text">
              <div class="setting-row__title">Keystroke sound</div>
              <div class="setting-row__desc">Audible feedback on each key.</div>
            </div>
            <div class="setting-row__control">
              <button class="switch" role="switch" data-toggle="soundEnabled"
                      aria-checked="${!!settings.soundEnabled}" aria-label="Keystroke sound"></button>
            </div>
          </div>

          <div class="setting-row">
            <div class="setting-row__text">
              <div class="setting-row__title">Sound profile</div>
              <div class="setting-row__desc">Character of the keystroke sound.</div>
            </div>
            <div class="setting-row__control" style="display:flex; align-items:center; gap: var(--space-2)">
              <select class="select" id="sound-profile" aria-label="Sound profile" style="width:170px">
                ${SOUND_PROFILES.map((p) => `
                  <option value="${p.id}" ${settings.soundProfile === p.id ? 'selected' : ''}>${p.label}</option>
                `).join('')}
              </select>
              <button class="btn btn-ghost btn-sm" id="sound-test" type="button" aria-label="Test sound">
                <i data-lucide="play"></i> Test
              </button>
            </div>
          </div>

          <div class="setting-row">
            <div class="setting-row__text">
              <div class="setting-row__title">Master volume</div>
              <div class="setting-row__desc">Overall loudness. 0% mutes everything.</div>
            </div>
            <div class="setting-row__control" style="width:180px">
              <input type="range" class="range" id="volume" min="0" max="100"
                     value="${Math.round((settings.soundVolume ?? 0.5) * 100)}" aria-label="Master volume">
            </div>
          </div>

          <div class="setting-row">
            <div class="setting-row__text">
              <div class="setting-row__title">Keystroke sound</div>
              <div class="setting-row__desc">Per-key click. Set to 0% to silence keystrokes without losing feedback.</div>
            </div>
            <div class="setting-row__control" style="width:180px">
              <input type="range" class="range" id="volume-typing" min="0" max="100"
                     value="${Math.round((settings.typingVolume ?? 0.4) * 100)}" aria-label="Typing sound">
            </div>
          </div>

          <div class="setting-row">
            <div class="setting-row__text">
              <div class="setting-row__title">Feedback sound</div>
              <div class="setting-row__desc">Errors, completion, milestones, achievements.</div>
            </div>
            <div class="setting-row__control" style="width:180px">
              <input type="range" class="range" id="volume-feedback" min="0" max="100"
                     value="${Math.round((settings.feedbackVolume ?? 0.7) * 100)}" aria-label="Feedback sound">
            </div>
          </div>
        </div>
      </section>

      <section class="section">
        <h2 class="section__label">Your data</h2>
        <div class="card">
          <div class="setting-row">
            <div class="setting-row__text">
              <div class="setting-row__title">Export</div>
              <div class="setting-row__desc">Download your history and preferences as JSON.</div>
            </div>
            <div class="setting-row__control">
              <button class="btn btn-secondary" id="export-btn">
                <i data-lucide="download"></i> Export
              </button>
            </div>
          </div>

          <div class="setting-row">
            <div class="setting-row__text">
              <div class="setting-row__title">Import</div>
              <div class="setting-row__desc">Restore from a previously exported file. Merges with existing data.</div>
            </div>
            <div class="setting-row__control">
              <button class="btn btn-secondary" id="import-btn">
                <i data-lucide="upload"></i> Import
              </button>
              <input type="file" id="import-file" accept="application/json,.json" hidden>
            </div>
          </div>

          <div class="setting-row">
            <div class="setting-row__text">
              <div class="setting-row__title">Reset everything</div>
              <div class="setting-row__desc">Permanently deletes all sessions, records and preferences on this device.</div>
            </div>
            <div class="setting-row__control">
              <button class="btn btn-danger" id="reset-btn">
                <i data-lucide="trash-2"></i> Reset
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;

  const $ = (sel) => container.querySelector(sel);

  /** Shared radio-group behaviour for the segmented + swatch pickers. */
  const wireRadioGroup = (attr, apply) => {
    const items = container.querySelectorAll(`[data-${attr}]`);
    items.forEach((btn) => {
      btn.addEventListener('click', () => {
        apply(btn.dataset[attr]);
        items.forEach((b) => {
          const on = b === btn;
          b.classList.toggle('active', on);
          b.setAttribute('aria-checked', String(on));
        });
      });
    });
  };

  wireRadioGroup('appearance', setAppearance);
  wireRadioGroup('accent', setDevAccent);

  $('#theme-select').addEventListener('change', (e) => setTheme(e.target.value));

  container.querySelectorAll('[data-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = btn.getAttribute('aria-checked') !== 'true';
      btn.setAttribute('aria-checked', String(next));
      update({ [btn.dataset.toggle]: next });
    });
  });

  $('#sound-profile').addEventListener('change', (e) => {
    update({ soundProfile: e.target.value });
    audio.init();
    audio.playKeyClick(e.target.value);
  });

  const volumeReadout = $('#volume-readout');
  // Per-group volumes: typing click and feedback (errors, completion,
  // milestones). Each group has its own slider so the user can silence
  // the per-key click without losing the helpful feedback.
  const wireVolume = (suffix, fn) => {
    const el = $('#volume-' + suffix);
    if (!el) return;
    el.addEventListener('input', (e) => {
      const level = Number(e.target.value) / 100;
      update({ [suffix + 'Volume']: level });
      fn(level);
    });
  };

  wireVolume('typing', (level) => audio.setGroupVolume('typing', level));
  wireVolume('feedback', (level) => audio.setGroupVolume('feedback', level));

  // Master volume (back-compat — controls the global level).
  const volumeEl = $('#volume');
  volumeEl.addEventListener('input', (e) => {
    update({ soundVolume: Number(e.target.value) / 100 });
    audio.setVolume(Number(e.target.value) / 100);
  });

  $('#sound-test').addEventListener('click', () => {
    audio.init();
    const profile = settings.soundProfile || 'mechanical';
    // Play one of each role so the user can hear all three groups
    // in sequence. The sequence matches what they'll hear during a
    // session: keystroke -> space -> milestone.
    audio.playKeyClick(profile);
    setTimeout(() => audio.playSpace(profile), 110);
    setTimeout(() => audio.playMilestone(60), 220);
  });

  /* ── data management ─────────────────────────────────────────────────── */

  $('#export-btn').addEventListener('click', () => {
    try {
      const blob = new Blob([exportData()], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `keyflow-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast({ message: 'Backup downloaded.', type: 'success' });
    } catch (err) {
      logger.error('settings', 'Export failed', { error: err.message });
      showToast({ message: 'Export failed.', type: 'error' });
    }
  });

  const fileInput = $('#import-file');
  $('#import-btn').addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    try {
      const result = importData(await file.text());
      if (result.accepted > 0) {
        const skippedNote = result.rejected > 0
          ? ` (${result.rejected} entries skipped)`
          : '';
        showToast({
          message: `Imported ${result.accepted} entries${skippedNote}. Reloading…`,
          type: 'success',
        });
        setTimeout(() => location.reload(), 700);
      } else {
        showToast({
          message: result.issues[0] || 'That file is not a valid KeyFlow backup.',
          type: 'error',
        });
      }
    } catch (err) {
      logger.error('settings', 'Import failed', { error: err.message });
      showToast({ message: 'Could not read that file.', type: 'error' });
    } finally {
      fileInput.value = '';
    }
  });

  /* Destructive and irreversible with no server-side copy, so it takes a
     typed confirmation rather than a single click. */
  $('#reset-btn').addEventListener('click', () => {
    const answer = window.prompt(
      'This permanently deletes every session, record and preference on this device.\n\nType RESET to confirm.'
    );
    if (answer !== 'RESET') {
      showToast({ message: 'Reset cancelled.', type: 'info' });
      return;
    }
    clear();
    showToast({ message: 'All data cleared. Reloading…', type: 'success' });
    setTimeout(() => location.reload(), 700);
  });

  if (window.lucide) window.lucide.createIcons();
}

export function destroy() {}
