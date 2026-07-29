<div align="center">

# ⌨️ KeyFlow

### Type faster. Think sharper.

A premium, open-source typing test platform built with zero dependencies.

[![License: MIT](https://img.shields.io/badge/License-MIT-7c5cfc.svg)](LICENSE)
[![Built with Vite](https://img.shields.io/badge/Built%20with-Vite-646CFF.svg)](https://vitejs.dev)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen.svg)](CONTRIBUTING.md)

[**Try it live →**](#) · [Report Bug](https://github.com/sasly2048/WPM-Typing-Test/issues) · [Request Feature](https://github.com/sasly2048/WPM-Typing-Test/issues)

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| ⚡ **Multiple Modes** | Time, Words, Quote, Code, Zen, and Custom text |
| 📊 **Real-time Analytics** | Live WPM, accuracy, consistency, and character stats |
| 🎨 **9 Premium Themes** | Arctic, Aurora, Forest, Graphite, Midnight, Monokai, Ocean, Sand, Terminal |
| 📈 **Progress Dashboard** | WPM trends, accuracy charts, activity heatmap |
| 🏆 **7 Achievements** | Unlock milestones as you improve |
| 🎵 **Keyboard Sounds** | Mechanical, membrane, and typewriter sound profiles |
| ⌨️ **Command Palette** | Ctrl+K for instant access to any action |
| 🌙 **Dark & Light Modes** | Auto-detects system preference |
| ♿ **Accessible** | WCAG AA compliant, keyboard navigable, reduced motion |
| 📱 **Responsive** | Works on desktop, tablet, and mobile |
| 🔒 **Private** | All data stored locally — nothing sent to servers |
| 🚀 **Fast** | Zero runtime dependencies, lazy-loaded pages |

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/sasly2048/WPM-Typing-Test.git
cd WPM-Typing-Test

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The dev server starts at `http://localhost:3000`.

## 🏗️ Architecture

```
src/
├── main.js              # App entry point & router setup
├── components/          # 22 reusable UI components (incl. fx/ subfolder)
│   ├── command-palette.js
│   ├── chart.js
│   ├── fx/              # Visual effects (particles, ripple, matrix-text, ...)
│   └── ...
├── pages/               # 9 page modules
│   ├── landing.js       # Hero + features + FAQ
│   ├── practice.js      # Typing interface (routed via #/practice and #/typing)
│   ├── results.js       # Post-test results
│   ├── dashboard.js     # Statistics & history
│   ├── settings.js      # Preferences panel
│   ├── profile.js       # User profile
│   ├── achievements.js  # Achievement gallery
│   ├── themes.js        # Theme picker
│   └── developer.js     # Developer/debug panel
├── engines/             # Core typing engine
│   ├── InputEngine.js   # Keystroke capture & validation
│   ├── RenderEngine.js  # Text rendering & caret
│   └── StatsEngine.js   # Live WPM/accuracy calculations
├── services/            # Business logic
│   ├── storage.js       # LocalStorage abstraction
│   ├── text-provider.js # Text corpus management
│   ├── stats-engine.js  # WPM/accuracy calculations
│   ├── history.js       # Session tracking
│   ├── achievements.js  # Achievement system
│   └── audio.js         # Procedural sound effects
├── utils/               # Pure utilities
├── constants/           # App configuration
├── data/                # Static data (words, quotes, code snippets)
└── styles/              # CSS design system
    ├── design-tokens.css
    ├── themes/          # 9 theme files
    └── ...
```

### Design Principles

- **Zero dependencies** — No React, no Vue, no chart library. Pure vanilla JS.
- **Lazy loading** — Pages load on demand via dynamic `import()`.
- **Design tokens** — All visual properties defined as CSS custom properties.
- **Accessible first** — WCAG AA, keyboard navigation, screen reader support.
- **Offline capable** — PWA manifest included, all data local.

## 🎨 Themes

| Theme | Description |
|---|---|
| 🌑 Midnight | Deep charcoal dark theme (default) |
| 🏔️ Arctic | Clean, bright light theme |
| 🎨 Monokai | Code editor inspired |
| 🌌 Aurora | Northern lights gradients |
| 💻 Terminal | Retro green phosphor |
| 🌊 Ocean | Deep blue and teal |
| 🌲 Forest | Earthy greens |
| ⬛ Graphite | Neutral grey minimal theme |
| 🏜️ Sand | Warm desert tones |

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Tab` | Restart with new text |
| `Ctrl/⌘ + K` | Open command palette |
| `Escape` | Close modals / exit focus |

## 🛠️ Tech Stack

- **Build**: [Vite](https://vitejs.dev) — Fast dev server + optimized production builds
- **Language**: Vanilla JavaScript (ES Modules)
- **Styling**: CSS Custom Properties design system
- **Fonts**: [Inter](https://rsms.me/inter/) + [JetBrains Mono](https://www.jetbrains.com/lp/mono/)
- **Audio**: Web Audio API (procedural synthesis)
- **Charts**: HTML5 Canvas
- **Storage**: LocalStorage with schema versioning

## 📊 Performance

- **Zero runtime dependencies** — Nothing to download beyond the app itself
- **Lazy-loaded pages** — Only load code for the page you're viewing
- **CSS code splitting** — Themes loaded on demand
- **Optimized builds** — Terser minification, tree shaking, asset hashing
- **Target**: Lighthouse 95+ across all categories

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

This project is licensed under the MIT License — see [LICENSE](LICENSE) for details.

## 👤 Author

**Raghavendra**

- GitHub: [@sasly2048](https://github.com/sasly2048)
- LinkedIn: [raghavendra-g204800](https://www.linkedin.com/in/raghavendra-g204800/)
- Email: raghavendrasujith204800@gmail.com

---

<div align="center">
  <sub>Built with precision. Made with ❤️</sub>
</div>
