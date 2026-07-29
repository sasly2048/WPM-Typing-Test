import { $, createElement, html } from '../utils/dom.js';
import { getSettings, saveSettings, exportData, clear } from '../services/storage.js';
import { applyTheme } from '../services/theme.js';
import { showToast } from '../components/toast.js';

const styles = `
.settings-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 4rem 2rem;
}
.settings-layout {
  display: flex;
  gap: 3rem;
  background: var(--color-bg-secondary);
  border-radius: 16px;
  border: 1px solid var(--color-border);
  overflow: hidden;
  min-height: 600px;
  box-shadow: 0 10px 30px -10px rgba(0,0,0,0.2);
}
@media (max-width: 768px) {
  .settings-layout { flex-direction: column; gap: 0; min-height: auto; }
}

.settings-sidebar {
  width: 250px;
  background: var(--color-bg-tertiary);
  padding: 2rem 1rem;
  border-right: 1px solid var(--color-border);
}
@media (max-width: 768px) {
  .settings-sidebar { width: 100%; border-right: none; border-bottom: 1px solid var(--color-border); padding: 1rem; display: flex; overflow-x: auto; }
}
.nav-item {
  display: block;
  width: 100%;
  text-align: left;
  padding: 0.75rem 1rem;
  background: none;
  border: none;
  color: var(--color-text-secondary);
  font-size: 1rem;
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 0.25rem;
  transition: all 0.2s;
}
@media (max-width: 768px) {
  .nav-item { flex-shrink: 0; width: auto; margin-bottom: 0; margin-right: 0.5rem; }
}
.nav-item:hover {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
}
.nav-item.active {
  background: var(--color-accent);
  color: var(--color-bg-primary);
}

.settings-content {
  flex: 1;
  padding: 3rem 3rem 3rem 0;
}
@media (max-width: 768px) {
  .settings-content { padding: 2rem; }
}
.settings-section {
  display: none;
  animation: fadeIn 0.3s;
}
.settings-section.active {
  display: block;
}
.settings-section h2 {
  margin-top: 0;
  margin-bottom: 2rem;
  font-size: 1.5rem;
  color: var(--color-text-primary);
}

.setting-group {
  margin-bottom: 2rem;
}
.setting-label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--color-text-primary);
}
.setting-desc {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin-bottom: 1rem;
}
.control-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}
.toggle-switch input { opacity: 0; width: 0; height: 0; }
.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: var(--color-bg-tertiary);
  transition: .4s;
  border-radius: 24px;
  border: 1px solid var(--color-border);
}
.toggle-slider:before {
  position: absolute;
  content: "";
  height: 16px; width: 16px;
  left: 3px; bottom: 3px;
  background-color: var(--color-text-secondary);
  transition: .4s;
  border-radius: 50%;
}
input:checked + .toggle-slider { background-color: var(--color-accent); border-color: var(--color-accent); }
input:checked + .toggle-slider:before { transform: translateX(20px); background-color: var(--color-bg-primary); }

select, input[type="range"] {
  width: 100%;
  max-width: 300px;
  padding: 0.5rem;
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
  border-radius: 6px;
}
.btn {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: 1px solid var(--color-border);
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  cursor: pointer;
  font-weight: 500;
}
.btn:hover { background: var(--color-border); }
.btn-danger { color: #ef4444; border-color: #ef4444; }
.btn-danger:hover { background: #ef4444; color: white; }

.shortcut-grid {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 1rem;
  align-items: center;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 1rem;
  margin-bottom: 1rem;
}
kbd {
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 0.2rem 0.5rem;
  font-family: var(--font-mono);
  font-size: 0.85rem;
}
`;

let styleElement;

export function render(container) {
  styleElement = document.createElement('style');
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);

  container.innerHTML = html`
    <main id="main-content" class="settings-page">
      <div class="settings-layout">
        <aside class="settings-sidebar">
          <button class="nav-item active" data-target="general">General</button>
          <button class="nav-item" data-target="typing">Typing</button>
          <button class="nav-item" data-target="appearance">Appearance</button>
          <button class="nav-item" data-target="audio">Audio</button>
          <button class="nav-item" data-target="data">Data</button>
          <button class="nav-item" data-target="shortcuts">Shortcuts</button>
        </aside>
        
        <div class="settings-content">
          <!-- General -->
          <section id="general" class="settings-section active">
            <h2>General</h2>
            <div class="setting-group">
              <span class="setting-label">Language</span>
              <p class="setting-desc">Primary language for typing tests.</p>
              <select name="language">
                <option value="en">English</option>
              </select>
            </div>
          </section>

          <!-- Typing -->
          <section id="typing" class="settings-section">
            <h2>Typing Behavior</h2>
            <div class="setting-group">
              <span class="setting-label">Stop on Error</span>
              <p class="setting-desc">Force fixing typos before continuing to the next word.</p>
              <label class="toggle-switch">
                <input type="checkbox" name="stopOnError">
                <span class="toggle-slider"></span>
              </label>
            </div>
            <div class="setting-group">
              <span class="setting-label">Blind Mode</span>
              <p class="setting-desc">Hide all text except the current word you are typing.</p>
              <label class="toggle-switch">
                <input type="checkbox" name="blindMode">
                <span class="toggle-slider"></span>
              </label>
            </div>
            <div class="setting-group">
              <span class="setting-label">Default Mode</span>
              <select name="defaultMode">
                <option value="paragraph">Paragraph</option>
                <option value="time">Time</option>
                <option value="words">Words</option>
              </select>
            </div>
          </section>

          <!-- Appearance -->
          <section id="appearance" class="settings-section">
            <h2>Appearance</h2>
            <div class="setting-group">
              <span class="setting-label">Theme</span>
              <p class="setting-desc">Choose your preferred color scheme.</p>
              <select name="theme">
                <option value="midnight">Midnight</option>
                <option value="nord">Nord</option>
                <option value="tokyo-night">Tokyo Night</option>
                <option value="dracula">Dracula</option>
                <option value="gruvbox">Gruvbox</option>
                <option value="catppuccin">Catppuccin</option>
                <option value="github-dark">GitHub Dark</option>
                <option value="monokai">Monokai Pro</option>
              </select>
            </div>
            <div class="setting-group">
              <span class="setting-label">Font Family</span>
              <select name="fontFamily">
                <option value="inter">Inter (Sans)</option>
                <option value="jetbrains">JetBrains Mono</option>
                <option value="fira">Fira Code</option>
              </select>
            </div>
            <div class="setting-group">
              <span class="setting-label">Caret Style</span>
              <select name="caretStyle">
                <option value="line">Line (|)</option>
                <option value="block">Block (█)</option>
                <option value="underline">Underline (_)</option>
              </select>
            </div>
            <div class="setting-group">
              <span class="setting-label">Smooth Caret</span>
              <label class="toggle-switch">
                <input type="checkbox" name="smoothCaret">
                <span class="toggle-slider"></span>
              </label>
            </div>
          </section>

          <!-- Audio -->
          <section id="audio" class="settings-section">
            <h2>Audio</h2>
            <div class="setting-group">
              <span class="setting-label">Typing Sounds</span>
              <label class="toggle-switch">
                <input type="checkbox" name="typingSounds">
                <span class="toggle-slider"></span>
              </label>
            </div>
            <div class="setting-group">
              <span class="setting-label">Sound Profile</span>
              <select name="soundProfile">
                <option value="mech">Mechanical</option>
                <option value="membrane">Membrane</option>
                <option value="typewriter">Typewriter</option>
              </select>
            </div>
          </section>

          <!-- Data -->
          <section id="data" class="settings-section">
            <h2>Data Management</h2>
            <div class="setting-group">
              <span class="setting-label">Export Data</span>
              <p class="setting-desc">Download your typing history and settings as a JSON file.</p>
              <button class="btn" id="export-btn">Export JSON</button>
            </div>
            <div class="setting-group">
              <span class="setting-label">Danger Zone</span>
              <p class="setting-desc">Permanently delete all local data. This cannot be undone.</p>
              <button class="btn btn-danger" id="clear-data-btn">Clear All Data</button>
            </div>
          </section>

          <!-- Shortcuts -->
          <section id="shortcuts" class="settings-section">
            <h2>Keyboard Shortcuts</h2>
            <div class="shortcut-grid">
              <span>Restart Test</span>
              <kbd>Tab</kbd>
            </div>
            <div class="shortcut-grid">
              <span>Pause Test</span>
              <kbd>Esc</kbd>
            </div>
            <div class="shortcut-grid">
              <span>Quick Settings</span>
              <kbd>Ctrl</kbd> + <kbd>K</kbd>
            </div>
          </section>
        </div>
      </div>
    </main>
  `;

  // Navigation Logic
  const navItems = container.querySelectorAll('.nav-item');
  const sections = container.querySelectorAll('.settings-section');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      navItems.forEach(n => n.classList.remove('active'));
      sections.forEach(s => s.classList.remove('active'));
      
      item.classList.add('active');
      const targetId = item.getAttribute('data-target');
      container.querySelector(`#${targetId}`).classList.add('active');
    });
  });

  // Attach change listeners to save settings mock
  const currentSettings = getSettings();
  
  container.querySelectorAll('input[name], select[name]').forEach(input => {
    const key = input.getAttribute('name');
    if (!key) return;
    
    // Set initial value
    if (input.type === 'checkbox') {
      input.checked = !!currentSettings[key];
    } else {
      input.value = currentSettings[key] || input.options[0].value;
    }

    // Save on change
    input.addEventListener('change', () => {
      const value = input.type === 'checkbox' ? input.checked : input.value;
      const newSettings = { ...getSettings(), [key]: value };
      saveSettings(newSettings);
      showToast({ message: 'Setting saved', type: 'success' });
      
      if (key === 'theme') {
        applyTheme(value);
      }
    });
  });

  const exportBtn = container.querySelector('#export-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const data = exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `keyflow_export_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast({ message: 'Data exported successfully', type: 'success' });
    });
  }

  const clearBtn = container.querySelector('#clear-data-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to permanently delete all data?')) {
        clear();
        showToast({ message: 'All data cleared', type: 'success' });
        setTimeout(() => location.reload(), 1000);
      }
    });
  }
}

export function destroy() {
  if (styleElement && styleElement.parentNode) {
    styleElement.parentNode.removeChild(styleElement);
  }
}
