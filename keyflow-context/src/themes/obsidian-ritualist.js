// src/themes/obsidian-ritualist.js

export const obsidianRitualist = {
  id: 'obsidian-ritualist',
  name: 'Obsidian Ritualist',
  type: 'dark',
  colors: {
    background: '#0A0A0A',
    surface: '#111111',
    surfaceElevated: '#181818',
    textPrimary: '#E2E2E2',
    textSecondary: '#9A9A9A',
    textTertiary: '#404040',
    primary: '#F0A968', // Ember
    error: '#FF3B30',   // Breach Red
    success: '#34D399', // Pulse Green
  },
  typography: {
    display: '"Inter", sans-serif',
    body: '"Inter", sans-serif',
    mono: '"JetBrains Mono", monospace'
  },
  syntax: {
    keyword: '#F0A968', // Ember
    string: '#34D399',
    function: '#E2E2E2',
    comment: '#404040',
    number: '#FF3B30',
    operator: '#9A9A9A',
    punctuation: '#404040',
    property: '#E2E2E2',
  },
  effects: {
    shadowSoft: '0 4px 24px rgba(0, 0, 0, 0.4)',
    shadowHard: '0 1px 3px rgba(0, 0, 0, 0.8), 0 8px 16px rgba(0, 0, 0, 0.6)',
    glowPrimary: '0 0 20px rgba(240, 169, 104, 0.15)',
  },
  cursor: {
    style: 'line', // line, block, underline
    color: '#F0A968',
    blink: 'smooth', // smooth, hard, none
  },
  animations: {
    easePrimary: 'cubic-bezier(0.32, 0.72, 0, 1)',
    durationFast: '0.15s',
  },
  sounds: {
    keypress: 'creamy', // ID referencing an audio pack
    completion: 'chime',
  }
};
