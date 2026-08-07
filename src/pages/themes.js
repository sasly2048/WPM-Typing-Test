/**
 * Appearance gallery.
 *
 * The old multi-theme list is gone: appearance is now two axes (light/dark
 * plus a developer accent). This page previews them at a glance; Settings
 * holds the same controls alongside everything else.
 */

import { html } from '../utils/dom.js';
import {
  getAppearance, setAppearance,
  getDevAccent, setDevAccent, DEV_ACCENTS,
} from '../services/theme.js';

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const MODES = [
  {
    id: 'light',
    name: 'Light',
    description: 'Warm paper and ink. Best for long sessions in daylight.',
    sample: ['the quick brown ', 'fox jumps over'],
    vars: '--pv-bg:#FBFAF8; --pv-surface:#FDFCFA; --pv-text:#171614; --pv-muted:#ADA69C; --pv-accent:#B4541E; --pv-border:#E6E2DC;',
  },
  {
    id: 'dark',
    name: 'Dark',
    description: 'Carbon surfaces with an amber accent. Low glare at night.',
    sample: ['the quick brown ', 'fox jumps over'],
    vars: '--pv-bg:#0C0C0D; --pv-surface:#101011; --pv-text:#EDEBE8; --pv-muted:#5C574F; --pv-accent:#E08B4F; --pv-border:#2A2A30;',
  },
  {
    id: 'system',
    name: 'System',
    description: 'Follows your operating system setting automatically.',
    sample: ['the quick brown ', 'fox jumps over'],
    vars: '--pv-bg:#FBFAF8; --pv-surface:#FDFCFA; --pv-text:#171614; --pv-muted:#ADA69C; --pv-accent:#B4541E; --pv-border:#E6E2DC;',
  },
];

/** Miniature of the typing surface, so a choice can be judged before applying. */
function preview({ id, name, description, vars, sample }) {
  return `
    <button class="theme-card" data-appearance="${esc(id)}" style="${esc(vars)}"
            aria-pressed="false">
      <span class="theme-card__canvas">
        <span class="theme-card__bar">
          <span class="theme-card__dot"></span>
          <span class="theme-card__line"></span>
        </span>
        <span class="theme-card__text">
          <span class="theme-card__typed">${esc(sample[0])}</span><span class="theme-card__caret"></span><span class="theme-card__pending">${esc(sample[1])}</span>
        </span>
        <span class="theme-card__hud">
          <span class="theme-card__stat"></span>
          <span class="theme-card__stat theme-card__stat--sm"></span>
        </span>
      </span>
      <span class="theme-card__meta">
        <span class="theme-card__name">${esc(name)}</span>
        <span class="theme-card__desc">${esc(description)}</span>
      </span>
    </button>
  `;
}

export function render(container) {
  container.innerHTML = html`
    <div class="page page--narrow themes">
      <header class="page-header">
        <div>
          <h1 class="page-header__title">Appearance</h1>
          <p class="page-header__desc">
            KeyFlow has two identities: a calm reading surface for prose, and a terminal
            workspace for code. Choose how the reading surface looks — the developer
            workspace is always dark.
          </p>
        </div>
      </header>

      <section class="section">
        <h2 class="section__label">Reading surface</h2>
        <div class="theme-grid">${MODES.map(preview).join('')}</div>
      </section>

      <section class="section">
        <h2 class="section__label">Developer accent</h2>
        <p class="themes__note">
          Used for the caret, active file and status highlights in the developer workspace.
        </p>
        <div class="theme-grid theme-grid--accents">
          ${Object.entries(DEV_ACCENTS).map(([id, a]) => `
            <button class="theme-card theme-card--accent" data-accent="${esc(id)}" aria-pressed="false"
                    style="--pv-bg:#05070A; --pv-surface:#0A0E14; --pv-text:#C3D0E0; --pv-muted:#3E4A5A; --pv-accent:${esc(a.accent)}; --pv-border:#1E2733;">
              <span class="theme-card__canvas theme-card__canvas--code">
                <span class="theme-card__code-line"><span class="theme-card__kw"></span><span class="theme-card__id"></span></span>
                <span class="theme-card__code-line theme-card__code-line--indent"><span class="theme-card__str"></span></span>
                <span class="theme-card__code-line"><span class="theme-card__id theme-card__id--sm"></span><span class="theme-card__caret"></span></span>
              </span>
              <span class="theme-card__meta">
                <span class="theme-card__name">${esc(a.label)}</span>
              </span>
            </button>
          `).join('')}
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

  sync('appearance', getAppearance);
  sync('accent', getDevAccent);

  if (window.lucide) window.lucide.createIcons();
}

export function destroy() {}
