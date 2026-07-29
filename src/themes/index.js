// src/themes/index.js
import { themeManager } from './ThemeManager.js';
import { obsidianRitualist } from './obsidian-ritualist.js';
import { githubDark } from './github-dark.js';

// Register built-in themes
themeManager.registerTheme(obsidianRitualist);
themeManager.registerTheme(githubDark);

export { themeManager };
