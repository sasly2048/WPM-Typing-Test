import { html } from '../utils/dom.js';
import { navigate } from '../utils/router.js';
import { showToast } from '../components/toast.js';
import {
  describeAuthError,
  getCurrentUser,
  signInWithApple,
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
} from '../services/auth.js';

const styles = `
.auth-page {
  max-width: 420px;
  margin: 0 auto;
  padding: 5rem 1.5rem 6rem;
}

.auth-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.auth-title {
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin-bottom: 0.5rem;
}

.auth-subtitle {
  color: var(--color-text-secondary);
  font-size: 0.95rem;
}

.auth-card {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.auth-provider-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  width: 100%;
  height: 46px;
  border-radius: 0.625rem;
  border: 1px solid var(--color-border);
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}

.auth-provider-btn:hover:not(:disabled) {
  background: var(--color-surface-hover);
  border-color: var(--color-text-tertiary);
}

.auth-provider-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.auth-provider-btn svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.auth-divider {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--color-text-tertiary);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0.25rem 0;
}

.auth-divider::before,
.auth-divider::after {
  content: "";
  flex: 1;
  height: 1px;
  background: var(--color-border);
}

.auth-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.auth-field label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.auth-field input {
  height: 44px;
  border-radius: 0.625rem;
  border: 1px solid var(--color-border);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  padding: 0 0.875rem;
  font-size: 0.95rem;
}

.auth-field input:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 1px;
}

.auth-submit-btn {
  height: 46px;
  border-radius: 0.625rem;
  border: none;
  background: var(--color-accent);
  color: var(--color-bg-primary);
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  margin-top: 0.25rem;
}

.auth-submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.auth-switch {
  text-align: center;
  font-size: 0.85rem;
  color: var(--color-text-secondary);
}

.auth-switch button {
  background: none;
  border: none;
  color: var(--color-accent);
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  font-size: inherit;
}

.auth-error {
  font-size: 0.82rem;
  color: var(--color-error);
  text-align: center;
}
`;

const GOOGLE_ICON = `<svg viewBox="0 0 24 24"><path fill="#4285F4" d="M23.52 12.27c0-.82-.07-1.42-.22-2.05H12v3.72h6.6c-.13 1.06-.85 2.66-2.45 3.73l-.02.15 3.56 2.75.25.02c2.26-2.08 3.58-5.14 3.58-8.32z"/><path fill="#34A853" d="M12 23.5c3.24 0 5.96-1.07 7.95-2.9l-3.79-2.93c-1.02.7-2.4 1.19-4.16 1.19-3.18 0-5.88-2.1-6.84-5H1.26v2.98A11.5 11.5 0 0012 23.5z"/><path fill="#FBBC05" d="M5.16 13.86A6.93 6.93 0 014.8 12c0-.64.11-1.27.35-1.86V7.16H1.26A11.5 11.5 0 000 12c0 1.85.44 3.6 1.26 5.14z"/><path fill="#EA4335" d="M12 4.75c2.26 0 3.79.98 4.66 1.8l3.4-3.32C17.95 1.24 15.24 0 12 0 7.31 0 3.26 2.69 1.26 6.86l3.9 3.02c.96-2.9 3.66-5.13 6.84-5.13z"/></svg>`;
const APPLE_ICON = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.365 1.43c0 1.14-.468 2.187-1.229 2.943-.849.86-2.021 1.53-3.183 1.43-.14-1.114.428-2.263 1.19-2.98.849-.816 2.309-1.42 3.222-1.393zM20.68 17.29c-.501 1.15-.74 1.665-1.383 2.68-.897 1.41-2.163 3.17-3.732 3.184-1.393.013-1.752-.907-3.644-.897-1.891.01-2.286.91-3.68.897-1.568-.014-2.767-1.6-3.664-3.01C2.13 16.98 1.7 12.32 3.376 9.62c1.19-1.913 3.07-3.03 4.84-3.03 1.8 0 2.933 1 4.423 1 1.443 0 2.325-1.003 4.404-1.003 1.578 0 3.253.86 4.446 2.343-3.91 2.14-3.276 7.72.19 9.36z"/></svg>`;
const MAIL_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>`;

export function render(container) {
  const styleEl = document.createElement('style');
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);

  if (getCurrentUser()) {
    navigate('/practice');
    return;
  }

  // 'providers': the initial Google/Apple/Email choice screen.
  // 'signin' / 'signup': the email+password form, in either direction.
  let mode = 'providers';
  let loading = false;

  const draw = () => {
    const showingSignup = mode === 'signup';
    container.innerHTML = html`
      <main id="main-content" class="auth-page">
        <header class="auth-header">
          <h1 class="auth-title">${showingSignup ? 'Create your account' : 'Welcome back'}</h1>
          <p class="auth-subtitle">${showingSignup ? 'Start tracking your typing progress.' : 'Sign in to continue to KeyFlow.'}</p>
        </header>

        <div class="auth-card">
          ${mode === 'signin' || mode === 'signup'
            ? `
            <form id="auth-email-form" novalidate>
              <div class="auth-field">
                <label for="auth-email-input">Email</label>
                <input id="auth-email-input" type="email" autocomplete="email" required />
              </div>
              <div class="auth-field" style="margin-top: 1rem;">
                <label for="auth-password-input">Password</label>
                <input id="auth-password-input" type="password" autocomplete="${mode === 'signup' ? 'new-password' : 'current-password'}" required minlength="6" />
              </div>
              <div id="auth-error" class="auth-error" style="margin-top: 0.75rem; display: none;"></div>
              <button type="submit" class="auth-submit-btn" style="width: 100%; margin-top: 1rem;" ${loading ? 'disabled' : ''}>
                ${loading ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Continue'}
              </button>
            </form>
            <p class="auth-switch">
              ${mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}
              <button type="button" id="auth-toggle-mode">${mode === 'signup' ? 'Sign in' : 'Sign up'}</button>
            </p>
            <p class="auth-switch"><button type="button" id="auth-back">&larr; Back</button></p>
          `
            : `
            <button type="button" class="auth-provider-btn" id="auth-google-btn" ${loading ? 'disabled' : ''}>
              ${GOOGLE_ICON} Continue with Google
            </button>
            <button type="button" class="auth-provider-btn" id="auth-apple-btn" ${loading ? 'disabled' : ''}>
              ${APPLE_ICON} Continue with Apple
            </button>
            <div class="auth-divider">or</div>
            <button type="button" class="auth-provider-btn" id="auth-email-btn" ${loading ? 'disabled' : ''}>
              ${MAIL_ICON} Continue with Email
            </button>
            <div id="auth-error" class="auth-error" style="display: none;"></div>
          `}
        </div>
      </main>
    `;

    attachHandlers();
  };

  const showError = (message) => {
    const el = container.querySelector('#auth-error');
    if (el) {
      el.textContent = message;
      el.style.display = 'block';
    }
  };

  const completeSignIn = () => {
    localStorage.removeItem('keyflow_guest_mode');
    showToast({ message: 'Signed in.', type: 'success' });
    navigate('/practice');
  };

  const attachHandlers = () => {
    const googleBtn = container.querySelector('#auth-google-btn');
    const appleBtn = container.querySelector('#auth-apple-btn');
    const emailBtn = container.querySelector('#auth-email-btn');
    const backBtn = container.querySelector('#auth-back');
    const toggleModeBtn = container.querySelector('#auth-toggle-mode');
    const emailForm = container.querySelector('#auth-email-form');

    if (googleBtn) {
      googleBtn.addEventListener('click', async () => {
        loading = true;
        draw();
        try {
          await signInWithGoogle();
          completeSignIn();
        } catch (err) {
          loading = false;
          draw();
          showError(describeAuthError(err));
        }
      });
    }

    if (appleBtn) {
      appleBtn.addEventListener('click', async () => {
        loading = true;
        draw();
        try {
          await signInWithApple();
          completeSignIn();
        } catch (err) {
          loading = false;
          draw();
          showError(describeAuthError(err));
        }
      });
    }

    if (emailBtn) {
      emailBtn.addEventListener('click', () => {
        mode = 'signin';
        draw();
      });
    }

    if (backBtn) {
      backBtn.addEventListener('click', () => {
        mode = 'providers';
        draw();
      });
    }

    if (toggleModeBtn) {
      toggleModeBtn.addEventListener('click', () => {
        mode = mode === 'signup' ? 'signin' : 'signup';
        draw();
      });
    }

    if (emailForm) {
      emailForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = container.querySelector('#auth-email-input').value.trim();
        const password = container.querySelector('#auth-password-input').value;
        loading = true;
        draw();
        try {
          if (mode === 'signup') {
            await signUpWithEmail(email, password);
          } else {
            await signInWithEmail(email, password);
          }
          completeSignIn();
        } catch (err) {
          loading = false;
          draw();
          showError(describeAuthError(err));
        }
      });
    }
  };

  draw();

  container.dataset.destroy = () => {
    if (styleEl && styleEl.parentNode) styleEl.parentNode.removeChild(styleEl);
  };
}

export function destroy(container) {
  if (container.dataset.destroy) container.dataset.destroy();
}
