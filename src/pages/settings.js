/**
 * Settings.
 *
 * Grouped by what each setting affects, not by data type. Every control writes
 * through immediately — there is no save button, because a preferences screen
 * whose changes can be lost by navigating away is a trap.
 */

import { html } from '../utils/dom.js';
import { getSettings, saveSettings, exportData, importData, clear } from '../services/storage.js';
import { getAppearance, setAppearance, getDevAccent, setDevAccent, DEV_ACCENTS } from '../services/theme.js';
import { showToast } from '../components/toast.js';
import { logger } from '../services/instrumentation.js';

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const APPEARANCES = [
  { id: 'light',  label: 'Light',  icon: 'sun' },
  { id: 'dark',   label: 'Dark',   icon: 'moon' },
  { id: 'system', label: 'System', icon: 'monitor' },
];

const SOUND_PROFILES = [
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
              <div class="setting-row__desc">Applies everywhere except the developer workspace, which is always dark.</div>
            </div>
            <div class="setting-row__control">
              <div class="segmented" role="radiogroup" aria-label="Theme">
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
                ${Object.entries(DEV_ACCENTS).map(([id, a]) => `
                  <button class="swatch ${getDevAccent() === id ? 'active' : ''}"
                          role="radio" data-accent="${esc(id)}"
                          aria-checked="${getDevAccent() === id}"
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
            <div class="setting-row__control">
              <select class="select" id="sound-profile" aria-label="Sound profile" style="width:170px">
                ${SOUND_PROFILES.map((p) => `
                  <option value="${p.id}" ${settings.soundProfile === p.id ? 'selected' : ''}>${p.label}</option>
                `).join('')}
              </select>
            </div>
          </div>

          <div class="setting-row">
            <div class="setting-row__text">
              <div class="setting-row__title">Volume</div>
              <div class="setting-row__desc"><span id="volume-readout">${Math.round((settings.soundVolume ?? 0.5) * 100)}</span>%</div>
            </div>
            <div class="setting-row__control" style="width:180px">
              <input type="range" class="range" id="volume" min="0" max="100"
                     value="${Math.round((settings.soundVolume ?? 0.5) * 100)}" aria-label="Volume">
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

  container.querySelectorAll('[data-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = btn.getAttribute('aria-checked') !== 'true';
      btn.setAttribute('aria-checked', String(next));
      update({ [btn.dataset.toggle]: next });
    });
  });

  $('#sound-profile').addEventListener('change', (e) => update({ soundProfile: e.target.value }));

  const volumeReadout = $('#volume-readout');
  $('#volume').addEventListener('input', (e) => {
    volumeReadout.textContent = e.target.value;
    update({ soundVolume: Number(e.target.value) / 100 });
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
      const ok = importData(await file.text());
      if (ok) {
        showToast({ message: 'Data imported. Reloading…', type: 'success' });
        setTimeout(() => location.reload(), 700);
      } else {
        showToast({ message: 'That file is not a valid KeyFlow backup.', type: 'error' });
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
