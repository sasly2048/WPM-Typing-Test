export const APP_NAME = 'KeyFlow';
export const VERSION = '1.0.0';
export const DEFAULT_THEME = 'paper';
export const STORAGE_PREFIX = 'keyflow_';

export const TIMER_DURATIONS = [15, 30, 60, 120];
/**
 * Word-mode counts. Capped at 100 because longer text has diminishing
 * returns in this UI: at 100 words the typing surface already wraps to
 * 8-10 visible lines, and the user has to scroll to track progress.
 */
export const WORD_COUNTS = [10, 25, 50, 75, 100];

/**
 * The four modes a user actually picks between. We deliberately keep
 * this list short — every additional mode multiplies the option
 * surface (duration × difficulty × modifiers) the user has to
 * reason about, and "more modes" rarely translates to "more
 * practice" in practice.
 */
export const MODES = {
  PARAGRAPH: 'paragraph',
  TIME: 'time',
  WORDS: 'words',
  CODE: 'code',
  CUSTOM: 'custom',
};

export const DIFFICULTIES = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
  EXPERT: 'expert'
};

export const CARET_STYLES = ['line', 'block', 'underline'];

/**
 * Visual themes for Normal mode. Each entry is a complete, self-contained
 * identity — surface, accent, typography, geometry — keyed off the
 * `:root[data-theme="..."]` attribute on <html>. Add a new theme by adding
 * an entry here and a matching block in design-tokens.css.
 */
export const THEMES = [
  { id: 'paper',  label: 'Paper',        hint: 'Warm paper and ink. Default light theme.' },
  { id: 'carbon', label: 'Carbon',       hint: 'Deep graphite with amber accent.' },
  { id: 'dusk',   label: 'Dusk',         hint: 'Indigo twilight with violet glow.' },
  { id: 'aurora', label: 'Aurora',       hint: 'Cool polar night with mint accent.' },
  { id: 'sunset', label: 'Sunset',       hint: 'Rose and amber on cream.' },
  { id: 'serif',  label: 'Serif',        hint: 'Editorial serif on warm paper.' },
  { id: 'mono',   label: 'Mono',         hint: 'A typeset-only identity, monospaced.' },
];

/**
 * Developer-mode accent variants. Each only re-points the accent ramp — the
 * rest of the terminal identity (surfaces, mono type, square corners) stays
 * constant, so these read as variants of one mode, not separate themes.
 */
export const DEV_ACCENT_OPTIONS = [
  { id: 'phosphor', label: 'Phosphor', hint: 'Classic terminal green',          accent: '#00E57A' },
  { id: 'amber',    label: 'Amber',    hint: 'Vintage CRT amber',               accent: '#FFB000' },
  { id: 'cyan',     label: 'Cyan',     hint: 'Cool cyan on near-black',         accent: '#3DDCFF' },
  { id: 'magenta',  label: 'Magenta',  hint: 'Vibrant magenta on ink',          accent: '#FF6EC7' },
  { id: 'sunshine', label: 'Sunshine', hint: 'Warm gold on ink',                accent: '#F5C147' },
  { id: 'lavender', label: 'Lavender', hint: 'Soft purple on ink',              accent: '#B19CFF' },
];
