// src/themes/github-dark.js

export const githubDark = {
  id: 'github-dark',
  name: 'GitHub Dark',
  type: 'dark',
  colors: {
    background: '#0d1117',
    surface: '#161b22',
    surfaceElevated: '#21262d',
    textPrimary: '#c9d1d9',
    textSecondary: '#8b949e',
    textTertiary: '#484f58',
    primary: '#58a6ff', 
    error: '#f85149',
    success: '#2ea043',
  },
  typography: {
    display: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace'
  },
  syntax: {
    keyword: '#ff7b72',
    string: '#a5d6ff',
    function: '#d2a8ff',
    comment: '#8b949e',
    number: '#79c0ff',
    operator: '#c9d1d9',
    punctuation: '#c9d1d9',
    property: '#79c0ff',
  },
  effects: {
    shadowSoft: '0 4px 12px rgba(0, 0, 0, 0.5)',
    shadowHard: '0 1px 3px rgba(0, 0, 0, 0.9), 0 8px 16px rgba(0, 0, 0, 0.7)',
    glowPrimary: '0 0 16px rgba(88, 166, 255, 0.1)',
  },
  cursor: {
    style: 'block', 
    color: '#58a6ff',
    blink: 'none', 
  },
  animations: {
    easePrimary: 'ease-out',
    durationFast: '0.1s',
  },
  sounds: {
    keypress: 'silent', 
    completion: 'silent',
  }
};
