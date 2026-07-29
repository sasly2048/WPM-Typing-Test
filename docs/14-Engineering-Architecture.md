# 14 - Engineering Architecture

Version: 1.0  
Project: KeyFlow  
Status: Draft  
Owner: Engineering  

---

## Architecture Overview

KeyFlow is built around the decoupled **"One Engine, Multiple Adapters"** pattern:

```
Input Engine (handles raw keystrokes, fair play prevention)
      ↓
Mode Adapter (applies rules: Code? Words? Quotes?)
      ↓
Render Engine (handles DOM, caret positioning, scroll, syntax highlighting)
```

### Folder Structure
```
src/
  core/          # Global state, routing, initialization
  engines/       # Core mechanics (InputEngine, RenderEngine, StatsEngine)
  adapters/      # Mode-specific logic (WordsAdapter, CodeAdapter)
  syntax/        # Bespoke tokenizer, language definitions, syntax themes
  content/       # Extensible content packs (words, quotes, developer/16-languages)
  analysis/      # Modular AI coach rules (accuracy, hesitation, patterns)
  components/    # Universal UI library (Hover, Focus, Loading, Keyboard-ready)
  services/      # APIs, local storage, gamification, audio
  themes/        # Comprehensive theme experiences (colors, sounds, cursors)
  pages/         # High-level route views
```
