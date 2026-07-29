import { createElement, on, html } from '../utils/dom.js';

export function createCommandPalette({ commands = [], onExecute }) {
  const overlay = createElement('div', { className: 'kf-cmd-overlay', 'aria-hidden': 'true' });
  const palette = createElement('div', { 
    className: 'kf-cmd-palette', 
    role: 'dialog', 
    'aria-modal': 'true', 
    'aria-label': 'Command Palette' 
  });
  
  palette.innerHTML = html`
    <div class="kf-cmd-header">
      <svg class="kf-cmd-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
      </svg>
      <input type="text" class="kf-cmd-input" placeholder="Type a command or search..." aria-autocomplete="list" aria-controls="kf-cmd-listbox">
      <div class="kf-cmd-spinner" style="display:none;">
        <svg viewBox="0 0 24 24" class="kf-spinner"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"></circle></svg>
      </div>
    </div>
    <div class="kf-cmd-results" id="kf-cmd-listbox" role="listbox"></div>
    <div class="kf-cmd-footer">
      <div class="kf-cmd-footer-group">
        <kbd class="kf-kbd">↑</kbd> <kbd class="kf-kbd">↓</kbd> <span>Navigate</span>
      </div>
      <div class="kf-cmd-footer-group">
        <kbd class="kf-kbd">↵</kbd> <span>Select</span>
      </div>
      <div class="kf-cmd-footer-group">
        <kbd class="kf-kbd">Esc</kbd> <span>Close</span>
      </div>
    </div>
  `;
  
  overlay.appendChild(palette);
  
  const input = palette.querySelector('.kf-cmd-input');
  const resultsEl = palette.querySelector('.kf-cmd-results');
  let selectedIndex = 0;
  let filteredCommands = [...commands];
  
  const renderResults = () => {
    resultsEl.innerHTML = '';
    if (filteredCommands.length === 0) {
      resultsEl.innerHTML = '<div class="kf-cmd-empty">No commands found.</div>';
      return;
    }
    
    // Group commands by category if present
    const categories = {};
    filteredCommands.forEach(cmd => {
      const cat = cmd.category || 'General';
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(cmd);
    });

    let globalIdx = 0;

    Object.entries(categories).forEach(([cat, cmds]) => {
      const groupEl = createElement('div', { className: 'kf-cmd-group', role: 'group', 'aria-label': cat });
      const groupLabel = createElement('div', { className: 'kf-cmd-group-label', textContent: cat });
      groupEl.appendChild(groupLabel);

      cmds.forEach(cmd => {
        const idx = globalIdx++;
        const isSelected = idx === selectedIndex;
        const item = createElement('div', {
          className: `kf-cmd-item ${isSelected ? 'kf-cmd-item-selected' : ''} ${cmd.disabled ? 'kf-cmd-item-disabled' : ''}`,
          role: 'option',
          'aria-selected': isSelected,
          id: `kf-cmd-item-${idx}`
        });
        
        let iconHtml = cmd.icon;
        if (!iconHtml) {
          iconHtml = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>';
        } else if (!iconHtml.includes('<svg')) {
          iconHtml = `<span>${iconHtml}</span>`;
        }
        
        item.innerHTML = html`
          <div class="kf-cmd-item-icon">${iconHtml}</div>
          <div class="kf-cmd-item-content">
            <div class="kf-cmd-item-label">${cmd.label}</div>
            ${cmd.description ? `<div class="kf-cmd-item-desc">${cmd.description}</div>` : ''}
          </div>
          ${cmd.shortcut ? `<div class="kf-cmd-item-shortcut">${cmd.shortcut.map(s => `<kbd class="kf-kbd">${s}</kbd>`).join(' ')}</div>` : ''}
        `;
        
        on(item, 'click', () => {
          if (!cmd.disabled) executeCommand(cmd);
        });
        
        on(item, 'mouseenter', () => {
          if (!cmd.disabled) {
            selectedIndex = idx;
            updateSelection();
          }
        });
        
        groupEl.appendChild(item);
      });
      
      resultsEl.appendChild(groupEl);
    });

    updateSelection();
  };
  
  const updateSelection = () => {
    const items = resultsEl.querySelectorAll('.kf-cmd-item');
    items.forEach((item, idx) => {
      if (idx === selectedIndex) {
        item.classList.add('kf-cmd-item-selected');
        item.setAttribute('aria-selected', 'true');
        input.setAttribute('aria-activedescendant', item.id);
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('kf-cmd-item-selected');
        item.setAttribute('aria-selected', 'false');
      }
    });
  };

  const executeCommand = (cmd) => {
    close();
    if (onExecute) onExecute(cmd);
    if (cmd.action) cmd.action();
  };
  
  on(input, 'input', () => {
    const q = input.value.toLowerCase();
    filteredCommands = commands.filter(c => 
      c.label.toLowerCase().includes(q) || 
      (c.description && c.description.toLowerCase().includes(q)) ||
      (c.category && c.category.toLowerCase().includes(q))
    );
    selectedIndex = 0;
    renderResults();
  });
  
  on(input, 'keydown', (e) => {
    const selectableCount = filteredCommands.length;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = (selectedIndex + 1) % selectableCount;
      updateSelection();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = (selectedIndex - 1 + selectableCount) % selectableCount;
      updateSelection();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const cmd = filteredCommands[selectedIndex];
      if (cmd && !cmd.disabled) {
        executeCommand(cmd);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close();
    }
  });
  
  const close = () => {
    overlay.classList.remove('kf-overlay-visible');
    overlay.setAttribute('aria-hidden', 'true');
    setTimeout(() => {
      if (overlay.parentNode) overlay.remove();
    }, 200);
  };
  
  const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  on(palette, 'keydown', (e) => {
    if (e.key === 'Tab') {
      const focusableContent = palette.querySelectorAll(focusableElements);
      if (focusableContent.length === 0) return;
      const first = focusableContent[0];
      const last = focusableContent[focusableContent.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        last.focus();
        e.preventDefault();
      } else if (!e.shiftKey && document.activeElement === last) {
        first.focus();
        e.preventDefault();
      }
    }
  });

  const open = () => {
    document.body.appendChild(overlay);
    input.value = '';
    filteredCommands = [...commands];
    selectedIndex = 0;
    renderResults();
    
    // Trigger reflow
    void overlay.offsetWidth;
    overlay.classList.add('kf-overlay-visible');
    overlay.setAttribute('aria-hidden', 'false');
    setTimeout(() => input.focus(), 50);
  };
  
  const toggle = () => {
    if (overlay.parentNode) close();
    else open();
  };
  
  on(overlay, 'click', (e) => {
    if (e.target === overlay) close();
  });
  
  const handleGlobalKey = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      toggle();
    }
  };
  window.addEventListener('keydown', handleGlobalKey);

  const destroy = () => {
    window.removeEventListener('keydown', handleGlobalKey);
    if (overlay.parentNode) overlay.remove();
  };

  return { el: overlay, open, close, toggle, destroy, updateCommands: (newCmds) => { commands = newCmds; } };
}
