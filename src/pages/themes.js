/**
 * Appearance gallery.
 *
 * Two visual axes for the reading surface: theme (paper, carbon, dusk,
 * aurora, sunset, serif, mono) and appearance (light/dark/system). The
 * developer surface is its own world — it has its own identity and a
 * separate accent picker for that identity.
 *
 * Each theme gets a card with a real preview painted from the same tokens
 * the live page uses, so a choice can be judged before applying.
 */

import { html } from '../utils/dom.js';
import {
  getAppearance, setAppearance,
  getTheme, setTheme, THEMES,
  getDevAccent, setDevAccent, DEV_ACCENT_OPTIONS,
} from '../services/theme.js';

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Sample CSS for each theme preview. The cards paint themselves with these
 * inline --pv-* custom properties so a theme can be shown while the live
 * page is on a different one.
 */
const THEME_PREVIEWS = {
  paper:  { surface: '#FBFAF8', raised: '#FDFCFA', text: '#171614', muted: '#8C867D', accent: '#B4541E', border: '#E6E2DC', accent2: '#CC6A2E' },
  carbon: { surface: '#0C0C0D', raised: '#17171A', text: '#EDEBE8', muted: '#7C766E', accent: '#E08B4F', border: '#2A2A30', accent2: '#CC6A2E' },
  dusk:   { surface: '#11132A', raised: '#1A1D3D', text: '#E4E5F4', muted: '#9094BA', accent: '#A78BFA', border: '#2E3366', accent2: '#FF7EDB' },
  aurora: { surface: '#0A1A24', raised: '#0F2433', text: '#D8EBF0', muted: '#7C9CAB', accent: '#7DFFBA', border: '#1E3F4F', accent2: '#4FD6E0' },
  sunset: { surface: '#FCF6EE', raised: '#F8EFE3', text: '#3D1F18', muted: '#915243', accent: '#B14D3E', border: '#E5C9A3', accent2: '#D26A7C' },
  serif:  { surface: '#F5EFE3', raised: '#EFE5D2', text: '#2A201A', muted: '#7D5B4A', accent: '#8E2E2E', border: '#D2BC97', accent2: '#A66E22' },
  mono:   { surface: '#F2F1EE', raised: '#ECEBE7', text: '#1A1A1A', muted: '#707070', accent: '#1A1A1A', border: '#BFBBB1', accent2: '#2C6BB5' },
};

function previewCard(t, previewText = 'the quick brown fox jumps over the lazy dog') {
  const v = THEME_PREVIEWS[t.id] || THEME_PREVIEWS.paper;
  const vars = `--pv-bg:${v.surface}; --pv-surface:${v.raised}; --pv-text:${v.text}; --pv-muted:${v.muted}; --pv-accent:${v.accent}; --pv-accent-2:${v.accent2}; --pv-border:${v.border};`;
  return `
    <button class="theme-card" data-theme="${esc(t.id)}" style="${esc(vars)}"
            aria-pressed="false" title="${esc(t.hint)}">
      <span class="theme-card__canvas">
        <span class="theme-card__bar">
          <span class="theme-card__dot"></span>
          <span class="theme-card__line"></span>
        </span>
        <span class="theme-card__text">
          <span class="theme-card__typed theme-card__preview-typed">${esc(previewText)}</span><span class="theme-card__caret"></span>
        </span>
        <span class="theme-card__hud">
          <span class="theme-card__stat"></span>
          <span class="theme-card__stat theme-card__stat--sm"></span>
        </span>
      </span>
      <span class="theme-card__meta">
        <span class="theme-card__name">${esc(t.label)}</span>
        <span class="theme-card__desc">${esc(t.hint)}</span>
      </span>
    </button>
  `;
}

function devAccentCard(a) {
  return `
    <button class="theme-card theme-card--accent" data-accent="${esc(a.id)}" aria-pressed="false"
            style="--pv-bg:#05070A; --pv-surface:#0A0E14; --pv-text:#C3D0E0; --pv-muted:#3E4A5A; --pv-accent:${esc(a.accent)}; --pv-border:#1E2733;"
            title="${esc(a.hint)}">
      <span class="theme-card__canvas theme-card__canvas--code">
        <span class="theme-card__code-line"><span class="theme-card__kw"></span><span class="theme-card__id"></span></span>
        <span class="theme-card__code-line theme-card__code-line--indent"><span class="theme-card__str"></span></span>
        <span class="theme-card__code-line"><span class="theme-card__id theme-card__id--sm"></span><span class="theme-card__caret"></span></span>
      </span>
      <span class="theme-card__meta">
        <span class="theme-card__name">${esc(a.label)}</span>
        <span class="theme-card__desc">${esc(a.hint)}</span>
      </span>
    </button>
  `;
}

export function render(container) {
  let previewText = 'the quick brown fox jumps over the lazy dog';

  const paintPreview = () => {
    container.querySelectorAll('.theme-card__preview-typed').forEach((el) => {
      el.textContent = previewText;
    });
  };

  container.innerHTML = html`
    <div class="page page--narrow themes">
      <header class="page-header">
        <div>
          <h1 class="page-header__title">Appearance</h1>
          <p class="page-header__desc">
            Choose a visual identity for the reading surface. The developer
            workspace stays a separate terminal — pick its accent below.
          </p>
        </div>
      </header>

      <section class="section">
        <h2 class="section__label">Theme</h2>
        <label class="field field--inline" for="theme-preview-text">
          <span class="field__label">Preview text</span>
          <input class="input" id="theme-preview-text" type="text" value="${previewText}" maxlength="60" style="width:380px">
        </label>
        <div class="theme-grid" id="theme-grid">${THEMES.map((t) => previewCard(t, previewText)).join('')}</div>
      </section>

      <section class="section">
        <h2 class="section__label">Light or dark</h2>
        <p class="themes__note">Most themes pick their own. This only affects Paper.</p>
        <div class="theme-grid theme-grid--accents">
          ${[
            { id: 'light',  label: 'Light',  hint: 'Always light surfaces' },
            { id: 'dark',   label: 'Dark',   hint: 'Always dark surfaces' },
            { id: 'system', label: 'System', hint: 'Follow your OS setting' }
          ].map((a) => `
            <button class="theme-card theme-card--compact" data-appearance="${esc(a.id)}"
                    style="--pv-bg:#FBFAF8; --pv-surface:#FDFCFA; --pv-text:#171614; --pv-muted:#8C867D; --pv-accent:#B4541E; --pv-border:#E6E2DC;"
                    aria-pressed="false">
              <span class="theme-card__canvas">
                <span class="theme-card__bar">
                  <span class="theme-card__dot"></span>
                </span>
                <span class="theme-card__text">
                  <span class="theme-card__typed">${esc(a.label)}</span>
                </span>
              </span>
              <span class="theme-card__meta">
                <span class="theme-card__name">${esc(a.label)}</span>
                <span class="theme-card__desc">${esc(a.hint)}</span>
              </span>
            </button>
          `).join('')}
        </div>
      </section>

      <section class="section">
        <h2 class="section__label">Developer accent</h2>
        <p class="themes__note">
          Used for the caret, active file and status highlights in the developer workspace.
        </p>
        <div class="theme-grid theme-grid--accents">
          ${DEV_ACCENT_OPTIONS.map(devAccentCard).join('')}
        </div>
      </section>

      <p class="themes__footnote">
        Sound, blind mode and data controls live in <a href="#/settings">Settings</a>.
      </p>
    </div>
  `;

  const sync = (attr, current) => {
    container.querySelectorAll(`[data-${attr}]`).forEach((el) => {
      const on = el.dataset[attr] === current();
      el.classList.toggle('is-selected', on);
      el.setAttribute('aria-pressed', String(on));
    });
  };

  container.querySelectorAll('[data-theme]').forEach((card) => {
    card.addEventListener('click', () => {
      setTheme(card.dataset.theme);
      sync('theme', getTheme);
    });
  });

  container.querySelectorAll('[data-appearance]').forEach((card) => {
    card.addEventListener('click', () => {
      setAppearance(card.dataset.appearance);
      sync('appearance', getAppearance);
    });
  });

  container.querySelectorAll('[data-accent]').forEach((card) => {
    card.addEventListener('click', () => {
      setDevAccent(card.dataset.accent);
      sync('accent', getDevAccent);
    });
  });

  const previewInput = container.querySelector('#theme-preview-text');
  if (previewInput) {
    previewInput.addEventListener('input', (e) => {
      previewText = e.target.value || ' ';
      paintPreview();
    });
  }

  sync('theme', getTheme);
  sync('appearance', getAppearance);
  sync('accent', getDevAccent);

  if (window.lucide) window.lucide.createIcons();
}

export function destroy(container) { if (container && container._destroy) container._destroy(); }
