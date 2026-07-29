const fs = require('fs');

// 7. button.js
let button = fs.readFileSync('src/components/button.js', 'utf8');
button = button.replace(
  /iconPosition = 'left',/,
  "iconPosition = 'left',\n  trailingIcon = null,\n  ariaLabel = null,"
);
button = button.replace(
  /id\n\s+\}\);/,
  "id\n  });\n  if (ariaLabel) el.setAttribute('aria-label', ariaLabel);"
);
button = button.replace(
  /if \(disabled\) el\.disabled = true;/,
  "if (disabled) {\n    el.disabled = true;\n    el.setAttribute('aria-disabled', 'true');\n  }"
);
button = button.replace(
  /contentHtml \+= `<span class="kf-btn-icon kf-btn-icon-right">\$\{icon\}<\/span>`;/,
  "contentHtml += `<span class=\"kf-btn-icon kf-btn-icon-right\">${icon}</span>`;\n    }\n    if (trailingIcon) {\n      contentHtml += `<span class=\"kf-btn-icon kf-btn-icon-right\">${trailingIcon}</span>`;"
);
button = button.replace(
  /el\.classList\.add\('kf-btn-loading'\);/,
  "el.style.width = el.offsetWidth + 'px';\n        el.classList.add('kf-btn-loading');"
);
button = button.replace(
  /el\.classList\.remove\('kf-btn-loading'\);/,
  "el.style.width = '';\n        el.classList.remove('kf-btn-loading');"
);
button = button.replace(
  /el\.disabled = isDisabled;/,
  "el.disabled = isDisabled;\n      if (isDisabled) el.setAttribute('aria-disabled', 'true');\n      else el.removeAttribute('aria-disabled');"
);
fs.writeFileSync('src/components/button.js', button);

// 8. modal.js
let modal = fs.readFileSync('src/components/modal.js', 'utf8');
modal = modal.replace(
  /const overlay = createElement\('div', \{ className: 'modal-overlay'/,
  "const overlay = createElement('div', { className: 'modal-overlay', style: 'background: var(--overlay-bg);',"
);
modal = modal.replace(
  /on\(document, 'keydown', \(e\) => \{\n    if \(e\.key === 'Escape'\) close\(\);\n  \}\);/,
  "const handleEsc = (e) => {\n    if (e.key === 'Escape') close();\n  };\n  document.addEventListener('keydown', handleEsc);\n\n  const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex=\"-1\"])';\n  on(overlay, 'keydown', (e) => {\n    if (e.key === 'Tab') {\n      const focusableContent = overlay.querySelectorAll(focusableElements);\n      if (focusableContent.length === 0) return;\n      const first = focusableContent[0];\n      const last = focusableContent[focusableContent.length - 1];\n      if (e.shiftKey) {\n        if (document.activeElement === first) {\n          last.focus();\n          e.preventDefault();\n        }\n      } else {\n        if (document.activeElement === last) {\n          first.focus();\n          e.preventDefault();\n        }\n      }\n    }\n  });"
);
modal = modal.replace(
  /let previousFocus = null;/g,
  ""
);
modal = modal.replace(
  /const open = \(\) => \{/,
  "let previousFocus = null;\n  const open = () => {\n    previousFocus = document.activeElement;"
);
modal = modal.replace(
  /overlay\.classList\.remove\('modal-visible'\);/,
  "document.removeEventListener('keydown', handleEsc);\n    if (previousFocus) previousFocus.focus();\n    overlay.classList.remove('modal-visible');"
);
fs.writeFileSync('src/components/modal.js', modal);

// 9. toast.js
let toast = fs.readFileSync('src/components/toast.js', 'utf8');
toast = toast.replace(
  /duration = 4000,/,
  "duration,"
);
toast = toast.replace(
  /const container = getToastContainer\(\);/,
  "const container = getToastContainer();\n  const defaultDurations = { success: 3000, info: 4000, warning: 6000, error: 0, loading: 0 };\n  const actualDuration = duration !== undefined ? duration : (defaultDurations[type] ?? 4000);\n  duration = actualDuration;"
);
toast = toast.replace(
  /role: type === 'error' \? 'alert' : 'status'/,
  "role: type === 'error' ? 'alert' : 'status',\n    'aria-live': type === 'error' ? 'assertive' : 'polite',\n    style: 'max-width: 420px;'"
);
fs.writeFileSync('src/components/toast.js', toast);

// 10. skeleton.js
let skeleton = fs.readFileSync('src/components/skeleton.js', 'utf8');
skeleton = skeleton.replace(
  /className: `skeleton skeleton-\$\{type\}`/,
  "className: `skeleton skeleton-${type} skeleton-shimmer`"
);
fs.writeFileSync('src/components/skeleton.js', skeleton);

// 11. confetti.js
let confetti = fs.readFileSync('src/components/confetti.js', 'utf8');
confetti = confetti.replace(
  /export function fireConfetti\(\{ colors = \['#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'\], particleCount = 100, duration = 3000 \} = \{\}\) \{/,
  "export function fireConfetti({ colors = ['#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'], particleCount = 100, duration = 3000 } = {}) {\n  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;"
);
fs.writeFileSync('src/components/confetti.js', confetti);

// 12. timer.js
let timer = fs.readFileSync('src/components/timer.js', 'utf8');
timer = timer.replace(
  /interval = setInterval\(\(\) => \{/,
  "let lastTime = performance.now();\n    interval = setInterval(() => {\n      const now = performance.now();\n      const delta = now - lastTime;\n      if (delta >= 1000) {\n        lastTime = now;"
);
timer = timer.replace(
  /if \(onTick\) onTick\(time\);\n    \}, 1000\);/,
  "if (onTick) onTick(time);\n      }\n    }, 100);"
); // we run interval every 100ms but only tick every 1000ms delta to prevent drift
fs.writeFileSync('src/components/timer.js', timer);

// 13. theme-switcher.js
let theme = fs.readFileSync('src/components/theme-switcher.js', 'utf8');
theme = theme.replace(
  /localStorage\.setItem\('keyflow-theme', theme\.id\);/,
  "localStorage.setItem('kf_theme', theme.id);" // standardizing storage key based on PRD/context usually it's kf_theme
);
fs.writeFileSync('src/components/theme-switcher.js', theme);

// 14. stats-bar.js
let stats = fs.readFileSync('src/components/stats-bar.js', 'utf8');
stats = stats.replace(
  /Math\.round\(accuracy\)/,
  "accuracy.toFixed(1)"
);
fs.writeFileSync('src/components/stats-bar.js', stats);

// 15. typing-engine.js
let engine = fs.readFileSync('src/components/typing-engine.js', 'utf8');
engine = engine.replace(
  /const destroy = \(\) => \{\n    \/\/ cleanup\n  \};/,
  "const destroy = () => {\n    hiddenInput.removeEventListener('input', handleInput);\n    hiddenInput.removeEventListener('keydown', handleKeydown);\n    container.remove();\n  };"
);
fs.writeFileSync('src/components/typing-engine.js', engine);

// 16. command-palette.js
let cmd = fs.readFileSync('src/components/command-palette.js', 'utf8');
cmd = cmd.replace(
  /\/\/ Global shortcut to open\n  on\(window, 'keydown', \(e\) => \{/,
  "const handleGlobalKey = (e) => {"
);
cmd = cmd.replace(
  /  \}\);\n\n  return \{ el: overlay, open, close, toggle, updateCommands/,
  "  };\n  window.addEventListener('keydown', handleGlobalKey);\n\n  const destroy = () => {\n    window.removeEventListener('keydown', handleGlobalKey);\n    if (overlay.parentNode) overlay.remove();\n  };\n\n  return { el: overlay, open, close, toggle, destroy, updateCommands"
);
cmd = cmd.replace(
  /const open = \(\) => \{/,
  "const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex=\"-1\"])';\n  on(palette, 'keydown', (e) => {\n    if (e.key === 'Tab') {\n      const focusableContent = palette.querySelectorAll(focusableElements);\n      if (focusableContent.length === 0) return;\n      const first = focusableContent[0];\n      const last = focusableContent[focusableContent.length - 1];\n      if (e.shiftKey && document.activeElement === first) {\n        last.focus();\n        e.preventDefault();\n      } else if (!e.shiftKey && document.activeElement === last) {\n        first.focus();\n        e.preventDefault();\n      }\n    }\n  });\n\n  const open = () => {"
);
fs.writeFileSync('src/components/command-palette.js', cmd);
