# Contributing to KeyFlow

Thank you for your interest in contributing! KeyFlow is an open-source typing test platform, and we welcome contributions of all kinds.

## Getting Started

1. **Fork** the repository
2. **Clone** your fork:
   ```bash
   git clone https://github.com/your-username/WPM-Typing-Test.git
   cd WPM-Typing-Test
   ```
3. **Install** dependencies:
   ```bash
   npm install
   ```
4. **Start** the dev server:
   ```bash
   npm run dev
   ```
5. Open `http://localhost:3000` in your browser.

## Project Structure

```
src/
├── main.js              # App entry point
├── components/          # Reusable UI components
├── pages/               # Page modules (landing, typing, results, etc.)
├── services/            # Business logic (storage, stats, history, etc.)
├── utils/               # Pure utility functions
├── constants/           # Configuration and defaults
├── data/                # Static data (paragraphs, quotes, words, etc.)
└── styles/              # CSS design system and themes
```

## Development Guidelines

### Code Style

- **ES Modules** — Use `import`/`export` exclusively. No CommonJS.
- **No frameworks** — Vanilla JavaScript only. This is intentional.
- **No runtime dependencies** — Keep the bundle size at zero runtime deps.
- **JSDoc** — Document all exported functions with JSDoc comments.
- **Semantic HTML** — Use proper HTML5 elements (`<main>`, `<nav>`, `<section>`, etc.).
- **CSS Custom Properties** — Use design tokens from `design-tokens.css`. Never hardcode colors, spacing, or fonts.

### Naming Conventions

- **Files**: `kebab-case.js`, `kebab-case.css`
- **Functions**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **CSS classes**: `kebab-case` (BEM-like: `.component__element--modifier`)

### Component Pattern

Each component exports a creation function:

```js
/**
 * Creates a Button component.
 * @param {Object} props
 * @param {string} props.label - Button text
 * @param {Function} props.onClick - Click handler
 * @returns {HTMLElement}
 */
export function createButton({ label, onClick }) {
  const btn = document.createElement('button');
  btn.className = 'btn btn-primary';
  btn.textContent = label;
  btn.addEventListener('click', onClick);
  return btn;
}
```

### Page Pattern

Each page exports `render(container)` and `destroy()`:

```js
export function render(container) {
  // Build and append DOM elements
}

export function destroy() {
  // Clean up event listeners, intervals, etc.
}
```

## Making Changes

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make your changes
3. Test thoroughly (build, responsiveness, accessibility)
4. Commit with a clear message: `git commit -m "feat: add keyboard sound profiles"`
5. Push and open a Pull Request

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat: add new feature`
- `fix: fix a bug`
- `style: CSS/styling changes`
- `refactor: code restructuring`
- `docs: documentation changes`
- `perf: performance improvements`
- `a11y: accessibility improvements`

## Adding Themes

1. Create a new CSS file in `src/styles/themes/`
2. Override the semantic color tokens using `[data-theme="your-theme"]`
3. Add the theme name to the theme list in `src/constants/config.js`
4. Add a swatch preview in the theme switcher component

## Adding Achievements

1. Add the achievement definition to `src/data/achievements.json`
2. Add the unlock condition check in `src/services/achievements.js`

## Accessibility

All contributions must meet WCAG 2.1 AA standards:

- Keyboard navigable
- Proper ARIA attributes
- Sufficient color contrast (4.5:1 for text)
- Reduced motion support
- Screen reader compatible

## Questions?

Open an issue or reach out via the links in the footer.
