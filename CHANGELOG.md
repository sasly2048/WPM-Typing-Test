# Changelog

All notable changes to KeyFlow will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] — 2026-07-23

### Added

- **Complete rebuild** — Transformed from a basic Flask typing test into a premium static SPA
- **Typing Engine** — Butter-smooth typing experience with animated caret, word-level highlighting, and auto-scroll
- **Multiple Modes** — Time (15/30/60/120s), Words (10/25/50/100), Quote, Code, Zen, and Custom text
- **Difficulty Levels** — Easy, Medium, Hard, Expert with progressively complex text
- **Landing Page** — Hero section with animated typing demo, features grid, stats, testimonials, FAQ
- **Results Screen** — Animated WPM counter, accuracy ring chart, WPM-over-time graph, character breakdown
- **Dashboard** — Overview cards, WPM/accuracy trends, activity heatmap, session history, achievements
- **Settings** — Raycast-inspired panel with categories: General, Typing, Appearance, Audio, Accessibility, Data, Shortcuts
- **Profile** — User identity with typing level, stats summary, achievement badges
- **6 Premium Themes** — Midnight (dark), Arctic (light), Monokai, Aurora, Terminal, Ocean
- **Design System** — Complete CSS token system with typography, spacing, shadows, animations
- **Command Palette** — Ctrl/⌘+K for quick actions
- **Achievement System** — 25 achievements across speed, accuracy, streak, and milestone categories
- **Keyboard Sounds** — Procedural audio via Web Audio API (mechanical, membrane, typewriter profiles)
- **Activity Heatmap** — GitHub-style contribution grid
- **Data Persistence** — LocalStorage with schema versioning, export/import
- **Accessibility** — WCAG AA compliant, keyboard navigable, screen reader support, reduced motion
- **Responsive** — Full support from 320px mobile to ultra-wide displays
- **SEO** — Meta tags, Open Graph, Twitter cards, PWA manifest
- **Performance** — Vite build with code splitting, lazy-loaded pages, zero runtime dependencies
- **Toast Notifications** — For achievements, settings changes, and feedback
- **Confetti** — Canvas-based celebration on personal bests

### Removed

- Flask/Python backend
- SQLite database
- Server-side paragraph management

### Technical

- Migrated from Flask + vanilla JS to Vite + vanilla JS SPA
- Zero runtime dependencies (Vite dev-only)
- Hash-based client-side routing
- Lazy-loaded page modules with dynamic imports
- CSS custom properties design system with 6 switchable themes
- Procedural audio generation (no audio files)
- Canvas-based charts (no chart library)
