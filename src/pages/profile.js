/**
 * Profile — identity plus a lifetime summary.
 *
 * Works signed-out: a guest still has local history worth showing, so this
 * page never gates the statistics behind an account.
 */

import { html } from '../utils/dom.js';
import { getStats, getSessions, getStreakInfo } from '../services/history.js';
import { getCurrentUser, signOut } from '../services/auth.js';
import { createLineChart } from '../components/chart.js';
import { getProfile, saveProfile, DEFAULT_PROFILE } from '../services/profile.js';
import { showToast } from '../components/toast.js';

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function formatDuration(seconds) {
  if (!seconds) return '0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h ? `${h}h ${m}m` : `${m}m`;
}

/** Speed band, so a number has a reference point. */
function tier(wpm) {
  if (wpm >= 120) return { label: 'Elite',        hint: 'Top-tier professional speed.' };
  if (wpm >= 90)  return { label: 'Advanced',     hint: 'Well above professional average.' };
  if (wpm >= 65)  return { label: 'Proficient',   hint: 'Comfortably above average.' };
  if (wpm >= 45)  return { label: 'Intermediate', hint: 'Around the typical office pace.' };
  if (wpm > 0)    return { label: 'Developing',   hint: 'Building fundamentals.' };
  return { label: 'Unranked', hint: 'Complete a test to get ranked.' };
}

function socialHref(kind, value) {
  if (!value) return '';
  const v = value.replace(/^@/, '').trim();
  switch (kind) {
    case 'twitter': return `https://twitter.com/${encodeURIComponent(v)}`;
    case 'github': return `https://github.com/${encodeURIComponent(v)}`;
    case 'mastodon': return v.startsWith('http') ? v : `https://${v}`;
    case 'linkedin': return v.startsWith('http') ? v : `https://www.linkedin.com/in/${encodeURIComponent(v)}`;
    default: return '';
  }
}

function socialLabel(kind) {
  return {
    twitter: 'Twitter / X',
    github: 'GitHub',
    mastodon: 'Mastodon',
    linkedin: 'LinkedIn',
  }[kind] || kind;
}

function socialIcon(kind) {
  return {
    twitter: 'twitter',
    github: 'github',
    mastodon: 'at-sign',
    linkedin: 'linkedin',
  }[kind] || 'link';
}

export function render(container) {
  const user = getCurrentUser();
  const stats = getStats();
  const sessions = getSessions() || [];
  const streak = getStreakInfo();
  const t = tier(stats.bestWpm);
  const profile = getProfile();

  const displayName = profile.displayName || user?.displayName || user?.email?.split('@')[0] || 'Guest';
  const initial = displayName.charAt(0).toUpperCase();
  const socials = (profile.social && Object.keys(profile.social).length)
    ? Object.entries(profile.social).filter(([, v]) => v)
    : [];

  container.innerHTML = html`
    <div class="page page--narrow profile">
      <header class="profile__header card">
        <div class="profile__avatar" aria-hidden="true">${esc(initial)}</div>
        <div class="profile__identity">
          <h1 class="profile__name">${esc(displayName)}</h1>
          <p class="profile__email">${esc(user?.email || 'Playing as a guest — progress is saved to this browser only.')}</p>
          <div class="profile__tags">
            <span class="badge badge--accent">${esc(t.label)}</span>
            <span class="badge">${stats.totalTests} tests</span>
            ${streak.currentStreak > 0 ? `<span class="badge">${streak.currentStreak}-day streak</span>` : ''}
          </div>
        </div>
        <div class="profile__actions">
          <button class="btn btn-secondary" id="profile-edit">
            <i data-lucide="pencil"></i> Edit profile
          </button>
          ${user
            ? '<button class="btn btn-secondary" id="profile-signout"><i data-lucide="log-out"></i> Sign out</button>'
            : '<a href="#/auth" class="btn btn-primary">Sign in to sync</a>'}
        </div>
      </header>

      ${profile.bio || profile.location || profile.website || socials.length ? `
        <section class="profile__about card">
          ${profile.bio ? `<p class="profile__bio">${esc(profile.bio)}</p>` : ''}
          <div class="profile__meta">
            ${profile.location ? `<span><i data-lucide="map-pin"></i> ${esc(profile.location)}</span>` : ''}
            ${profile.website ? `<a href="${esc(profile.website)}" target="_blank" rel="noopener noreferrer"><i data-lucide="link"></i> ${esc(profile.website.replace(/^https?:\/\//, ''))}</a>` : ''}
            ${socials.map(([kind, value]) => `
              <a href="${esc(socialHref(kind, value))}" target="_blank" rel="noopener noreferrer"
                 title="${esc(socialLabel(kind))}: ${esc(value)}">
                <i data-lucide="${esc(socialIcon(kind))}"></i> ${esc(socialLabel(kind))}
              </a>
            `).join('')}
          </div>
        </section>
      ` : ''}

      <p class="profile__tier-hint">${esc(t.hint)}</p>

      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat">
            <span class="stat__label">Best speed</span>
            <span class="stat__value">${Math.round(stats.bestWpm)}<span class="stat__unit">wpm</span></span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat">
            <span class="stat__label">Average speed</span>
            <span class="stat__value">${Math.round(stats.avgWpm)}<span class="stat__unit">wpm</span></span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat">
            <span class="stat__label">Accuracy</span>
            <span class="stat__value">${stats.avgAccuracy.toFixed(1)}<span class="stat__unit">%</span></span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat">
            <span class="stat__label">Time practised</span>
            <span class="stat__value">${formatDuration(stats.totalTime)}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat">
            <span class="stat__label">Longest streak</span>
            <span class="stat__value">${stats.bestStreak}<span class="stat__unit">days</span></span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat">
            <span class="stat__label">Focus index</span>
            <span class="stat__value">${stats.focusIndex ?? '—'}${stats.focusIndex != null ? '<span class="stat__unit">/100</span>' : ''}</span>
          </div>
        </div>
      </div>

      ${sessions.length >= 2 ? `
        <section class="section">
          <div class="chart-card">
            <div class="chart-card__header">
              <h2 class="card__title">Speed history</h2>
            </div>
            <div id="profile-chart"></div>
          </div>
        </section>
      ` : ''}

      <section class="section">
        <h2 class="section__label">Account</h2>
        <div class="card">
          <div class="setting-row">
            <div class="setting-row__text">
              <div class="setting-row__title">Manage your data</div>
              <div class="setting-row__desc">Export, import or reset your history.</div>
            </div>
            <div class="setting-row__control">
              <a href="#/settings" class="btn btn-secondary">Open settings</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;

  const chartHost = container.querySelector('#profile-chart');
  if (chartHost) {
    const recent = sessions.slice(-30);
    chartHost.appendChild(createLineChart({
      data: recent.map((s) => Math.round(s.wpm || 0)),
      xLabels: recent.map((s) =>
        new Date(s.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      ),
      label: 'WPM',
      color: 'var(--color-chart-wpm)',
    }));
  }

  // Edit profile — opens a modal-ish inline editor.
  container.querySelector('#profile-edit')?.addEventListener('click', () => {
    openProfileEditor(container, profile);
  });

  container.querySelector('#profile-signout')?.addEventListener('click', async () => {
    try {
      await signOut();
      window.location.hash = '#/';
    } catch {
      // onAuthChange in main.js reconciles UI state either way.
    }
  });

  if (window.lucide) window.lucide.createIcons();
}

/**
 * Inline profile editor. We render a card overlay with a small form
 * for display name, bio, location, website, and four social handles.
 * Save writes via the profile service; cancel re-renders the page.
 */
function openProfileEditor(container, current) {
  const existing = container.querySelector('.profile__about');
  const oldHtml = container.innerHTML;
  const profile = { ...DEFAULT_PROFILE, ...current, social: { ...DEFAULT_PROFILE.social, ...(current?.social || {}) } };

  const editor = document.createElement('div');
  editor.className = 'card profile__editor';
  editor.innerHTML = `
    <h2 class="card__title">Edit profile</h2>
    <form id="profile-form" class="profile__form">
      <label class="field field--block">
        <span class="field__label">Display name</span>
        <input class="input" name="displayName" type="text" maxlength="60" value="${esc(profile.displayName)}" placeholder="Your name or handle">
      </label>
      <label class="field field--block">
        <span class="field__label">Bio <span class="field__hint">${esc(String(profile.bio.length))} / 500</span></span>
        <textarea class="textarea" name="bio" rows="3" maxlength="500" placeholder="A line or two about you">${esc(profile.bio)}</textarea>
      </label>
      <label class="field field--block">
        <span class="field__label">Location</span>
        <input class="input" name="location" type="text" maxlength="80" value="${esc(profile.location)}" placeholder="City, country">
      </label>
      <label class="field field--block">
        <span class="field__label">Website</span>
        <input class="input" name="website" type="url" maxlength="200" value="${esc(profile.website)}" placeholder="https://yoursite.com">
      </label>
      <div class="profile__socials">
        <label class="field field--block">
          <span class="field__label">Twitter / X</span>
          <input class="input" name="twitter" type="text" maxlength="60" value="${esc(profile.social.twitter)}" placeholder="@handle">
        </label>
        <label class="field field--block">
          <span class="field__label">GitHub</span>
          <input class="input" name="github" type="text" maxlength="60" value="${esc(profile.social.github)}" placeholder="username">
        </label>
        <label class="field field--block">
          <span class="field__label">Mastodon</span>
          <input class="input" name="mastodon" type="text" maxlength="120" value="${esc(profile.social.mastodon)}" placeholder="@user@instance.social">
        </label>
        <label class="field field--block">
          <span class="field__label">LinkedIn</span>
          <input class="input" name="linkedin" type="text" maxlength="200" value="${esc(profile.social.linkedin)}" placeholder="in/username">
        </label>
      </div>
      <div class="profile__form-actions">
        <button class="btn btn-primary" type="submit">Save</button>
        <button class="btn btn-ghost" type="button" id="profile-cancel">Cancel</button>
      </div>
    </form>
  `;
  if (existing) {
    existing.replaceWith(editor);
  } else {
    container.querySelector('.profile').insertBefore(editor, container.querySelector('.profile__tier-hint'));
  }

  // Live char counter for bio
  const bio = editor.querySelector('textarea[name="bio"]');
  const bioLabel = editor.querySelector('label.field--block:nth-of-type(2) .field__hint');
  bio?.addEventListener('input', () => { if (bioLabel) bioLabel.textContent = `${bio.value.length} / 500`; });

  editor.querySelector('#profile-cancel')?.addEventListener('click', () => {
    container.innerHTML = oldHtml;
    if (window.lucide) window.lucide.createIcons();
  });
  editor.querySelector('#profile-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(editor.querySelector('form'));
    saveProfile({
      displayName: fd.get('displayName') || '',
      bio: fd.get('bio') || '',
      location: fd.get('location') || '',
      website: fd.get('website') || '',
      social: {
        twitter: fd.get('twitter') || '',
        github: fd.get('github') || '',
        mastodon: fd.get('mastodon') || '',
        linkedin: fd.get('linkedin') || '',
      },
    });
    showToast({ message: 'Profile saved.', type: 'success' });
    render(container);
    if (window.lucide) window.lucide.createIcons();
  });

  if (window.lucide) window.lucide.createIcons();
  editor.querySelector('input[name="displayName"]')?.focus();
}

export function destroy(container) { if (container && container._destroy) container._destroy(); }
