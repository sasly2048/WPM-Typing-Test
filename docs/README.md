# KeyFlow Engineering Handbook & Architecture Docs

This directory contains the authoritative technical architecture, design system specifications, and engineering guidelines for KeyFlow v1.0.

## Handbook Index

1. **[01 - Executive Summary](01-Executive-Summary.md)**: Product vision, mission, and success metrics.
2. **[08 - Color System](08-Color-System.md)**: 6-level surface elevation, semantic colors, and theme tokens.
3. **[14 - Engineering Architecture](14-Engineering-Architecture.md)**: Decoupled engine pipeline (`InputEngine` → `ModeAdapter` → `RenderEngine`).
4. **[20 - Content Engine Architecture](20-Content-Engine.md)**: Pool exhaustion shuffler, duration-tuned content, and 16-language code datasets.
5. **[30 - Coding Standards](30-Coding-Standards.md)**: TypeScript/JavaScript conventions, state ownership, and accessibility rules.

---

### Key Architectural Tenets
- **Performance**: Sub-16ms keystroke latency, sub-500ms zero-dependency production builds.
- **Fair Play**: Global interception of non-keyboard input (paste, drop, virtual simulation) to maintain statistical integrity.
- **Developer First**: Dedicated 16-language Cursor-style Developer Workspace (`#/developer`).
- **No Stock Emojis**: 100% vector SVG icons via Lucide.
