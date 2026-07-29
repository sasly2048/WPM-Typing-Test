import { MODES, DIFFICULTIES, DEFAULT_THEME } from './config.js';

export const DEFAULT_SETTINGS = {
  mode: MODES.PARAGRAPH,
  duration: 30,
  wordCount: 50,
  difficulty: DIFFICULTIES.MEDIUM,
  theme: DEFAULT_THEME,
  fontFamily: 'monospace',
  fontSize: 24,
  caretStyle: 'line',
  smoothCaret: true,
  soundEnabled: true,
  soundVolume: 0.5,
  soundProfile: 'mechanical',
  reducedMotion: false,
  highContrast: false,
  blindMode: false,
  stopOnError: false
};
