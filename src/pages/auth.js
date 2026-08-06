/**
 * Sign in / sign up.
 *
 * An account only syncs history across devices — it is never required to use
 * the app, so continuing as a guest is presented as a real choice rather than
 * buried under the form.
 */

import { html } from '../utils/dom.js';
import { showToast } from '../components/toast.js';
import { logger } from '../services/instrumentation.js';
import {
  describeAuthError,
  signInWithApple,
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
} from '../services/auth.js';

const GUEST_MODE_KEY = 'keyflow_guest_mode';

export function render(container) {
  let mode = 'signin'; // 'signin' | 'signup'
  let busy = false;

  container.innerHTML = html`
    <div class="page page--narrow auth">
      <div class="auth__card card">
        <header class="auth__header">
          <h1 class="auth__title" id="auth-title">Welcome back</h1>
          <p class="auth__subtitle" id="auth-subtitle">
            Sign in to sync your history across devices.
          </p>
        </header>

        <div class="auth__providers">
          <button class="btn btn-secondary btn-block" id="auth-google">
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"/>
              <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.82 6.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52Z"/>
            </svg>
            Continue with Google
          </button>

          <button class="btn btn-secondary btn-block" id="auth-apple">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M17.05 12.54c-.03-2.7 2.2-4 2.3-4.06-1.25-1.83-3.2-2.08-3.9-2.11-1.66-.17-3.24.98-4.08.98-.84 0-2.14-.96-3.52-.93-1.81.03-3.48 1.05-4.41 2.67-1.88 3.27-.48 8.1 1.35 10.75.9 1.3 1.97 2.75 3.38 2.7 1.36-.06 1.87-.88 3.51-.88 1.64 0 2.1.88 3.53.85 1.46-.03 2.38-1.32 3.27-2.63 1.03-1.5 1.46-2.96 1.48-3.04-.03-.01-2.84-1.09-2.87-4.32M14.4 4.6c.74-.9 1.24-2.15 1.1-3.4-1.07.05-2.36.71-3.13 1.61-.68.8-1.28 2.07-1.12 3.29 1.19.09 2.4-.6 3.15-1.5"/>
            </svg>
            Continue with Apple
          </button>
        </div>

        <div class="auth__divider"><span>or</span></div>

        <form class="auth__form" id="auth-form" novalidate>
          <div class="field">
            <label class="field__label" for="auth-email">Email</label>
            <input class="input" type="email" id="auth-email" name="email"
                   autocomplete="email" required placeholder="you@example.com">
            <span class="field__error" id="auth-email-error" hidden></span>
          </div>

          <div class="field">
            <label class="field__label" for="auth-password">Password</label>
            <input class="input" type="password" id="auth-password" name="password"
                   autocomplete="current-password" required minlength="6"
                   placeholder="At least 6 characters">
            <span class="field__error" id="auth-password-error" hidden></span>
          </div>

          <button class="btn btn-primary btn-block btn-lg" type="submit" id="auth-submit">
            <span id="auth-submit-text">Sign in</span>
          </button>
        </form>

        <p class="auth__switch">
          <span id="auth-switch-text">Don't have an account?</span>
          <button class="auth__switch-btn" id="auth-switch" type="button">Create one</button>
        </p>
      </div>

      <div class="auth__guest">
        <button class="btn btn-ghost" id="auth-guest">
          Continue without an account <i data-lucide="arrow-right"></i>
        </button>
        <p class="auth__guest-note">Your progress is saved locally in this browser.</p>
      </div>
    </div>
  `;

  const $ = (sel) => container.querySelector(sel);

  const emailEl = $('#auth-email');
  const passwordEl = $('#auth-password');
  const emailError = $('#auth-email-error');
  const passwordError = $('#auth-password-error');
  const submitBtn = $('#auth-submit');

  const setError = (el, errEl, message) => {
    if (message) {
      errEl.textContent = message;
      errEl.hidden = false;
      el.setAttribute('aria-invalid', 'true');
    } else {
      errEl.hidden = true;
      el.removeAttribute('aria-invalid');
    }
  };

  const setBusy = (on, label) => {
    busy = on;
    submitBtn.disabled = on;
    container.querySelectorAll('.auth__providers .btn').forEach((b) => { b.disabled = on; });
    $('#auth-submit-text').textContent = on ? (label || 'Working…') : (mode === 'signin' ? 'Sign in' : 'Create account');
  };

  /** Validate before hitting the network — a round trip to learn the email
      is malformed is a worse experience than an instant local check. */
  function validate() {
    let ok = true;
    const email = emailEl.value.trim();

    if (!email) {
      setError(emailEl, emailError, 'Enter your email address.');
      ok = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(emailEl, emailError, 'That does not look like a valid email address.');
      ok = false;
    } else {
      setError(emailEl, emailError, null);
    }

    if (passwordEl.value.length < 6) {
      setError(passwordEl, passwordError, 'Password must be at least 6 characters.');
      ok = false;
    } else {
      setError(passwordEl, passwordError, null);
    }

    return ok;
  }

  emailEl.addEventListener('input', () => setError(emailEl, emailError, null));
  passwordEl.addEventListener('input', () => setError(passwordEl, passwordError, null));

  /* Signing in clears guest mode so the two states can't both be active. */
  const onSuccess = () => {
    localStorage.removeItem(GUEST_MODE_KEY);
    showToast({ message: 'Signed in.', type: 'success' });
    window.location.hash = '#/practice';
  };

  const onFailure = (err) => {
    const message = describeAuthError(err);
    logger.warn('auth', message, { code: err?.code });
    showToast({ message, type: 'error' });
  };

  $('#auth-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (busy || !validate()) return;

    setBusy(true, mode === 'signin' ? 'Signing in…' : 'Creating account…');
    try {
      const fn = mode === 'signin' ? signInWithEmail : signUpWithEmail;
      await fn(emailEl.value.trim(), passwordEl.value);
      onSuccess();
    } catch (err) {
      onFailure(err);
    } finally {
      setBusy(false);
    }
  });

  const wireProvider = (id, fn, name) => {
    $(id).addEventListener('click', async () => {
      if (busy) return;
      setBusy(true);
      try {
        await fn();
        onSuccess();
      } catch (err) {
        onFailure(err);
      } finally {
        setBusy(false);
      }
    });
  };

  wireProvider('#auth-google', signInWithGoogle, 'Google');
  wireProvider('#auth-apple', signInWithApple, 'Apple');

  $('#auth-switch').addEventListener('click', () => {
    mode = mode === 'signin' ? 'signup' : 'signin';
    const signin = mode === 'signin';

    $('#auth-title').textContent = signin ? 'Welcome back' : 'Create your account';
    $('#auth-subtitle').textContent = signin
      ? 'Sign in to sync your history across devices.'
      : 'Sync your history across devices. Free, and you can delete it any time.';
    $('#auth-submit-text').textContent = signin ? 'Sign in' : 'Create account';
    $('#auth-switch-text').textContent = signin ? "Don't have an account?" : 'Already have an account?';
    $('#auth-switch').textContent = signin ? 'Create one' : 'Sign in';
    passwordEl.setAttribute('autocomplete', signin ? 'current-password' : 'new-password');

    setError(emailEl, emailError, null);
    setError(passwordEl, passwordError, null);
  });

  $('#auth-guest').addEventListener('click', () => {
    localStorage.setItem(GUEST_MODE_KEY, 'true');
    logger.info('auth', 'Continuing as guest');
    window.location.hash = '#/practice';
  });

  if (window.lucide) window.lucide.createIcons();
}

export function destroy() {}
