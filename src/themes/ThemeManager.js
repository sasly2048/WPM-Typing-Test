// src/themes/ThemeManager.js

export class ThemeManager {
  constructor(defaultTheme = 'obsidian-ritualist') {
    this.currentThemeId = defaultTheme;
    this.themes = new Map();
    this.activeStyles = document.createElement('style');
    this.activeStyles.id = 'theme-variables';
    document.head.appendChild(this.activeStyles);
  }

  registerTheme(theme) {
    this.themes.set(theme.id, theme);
  }

  applyTheme(themeId) {
    const theme = this.themes.get(themeId);
    if (!theme) {
      console.warn(`Theme ${themeId} not found.`);
      return;
    }

    this.currentThemeId = themeId;
    
    // Construct CSS variables
    let cssString = ':root {\n';
    
    // Colors
    for (const [key, value] of Object.entries(theme.colors)) {
      cssString += `  --color-${key}: ${value};\n`;
    }
    
    // Syntax
    for (const [key, value] of Object.entries(theme.syntax)) {
      cssString += `  --syntax-${key}: ${value};\n`;
    }

    // Typography
    for (const [key, value] of Object.entries(theme.typography)) {
      cssString += `  --font-${key}: ${value};\n`;
    }

    // Shadows & Effects
    cssString += `  --shadow-soft: ${theme.effects.shadowSoft};\n`;
    cssString += `  --shadow-hard: ${theme.effects.shadowHard};\n`;
    cssString += `  --glow-primary: ${theme.effects.glowPrimary};\n`;
    
    // Cursor
    cssString += `  --cursor-style: ${theme.cursor.style};\n`;
    cssString += `  --cursor-color: ${theme.cursor.color};\n`;
    cssString += `  --cursor-blink: ${theme.cursor.blink};\n`;

    // Animations
    cssString += `  --ease-primary: ${theme.animations.easePrimary};\n`;
    cssString += `  --duration-fast: ${theme.animations.durationFast};\n`;

    cssString += '}\n';
    
    this.activeStyles.innerHTML = cssString;

    // Apply specific document classes if needed for backgrounds
    document.body.style.background = theme.colors.background;
    document.body.style.color = theme.colors.textPrimary;
    
    // Dispatch event for components that need JS-level theme awareness (e.g. Canvas)
    window.dispatchEvent(new CustomEvent('themechanged', { detail: theme }));
  }

  getCurrentTheme() {
    return this.themes.get(this.currentThemeId);
  }
}

export const themeManager = new ThemeManager();
