/**
 * Sound engine for the typing experience.
 *
 * "Sound with purpose." Every cue has a role, every role is heard
 * rarely, and the user controls the volume for each role
 * independently so they can keep the helpful signals and drop the
 * noisy ones.
 *
 *   ┌────────────────────────────────────────────────────────────┐
 *   │  Sound groups                                                │
 *   │  ────────────                                                │
 *   │  typing   – keystroke click. Optional, can be muted.         │
 *   │  feedback – errors, completion, milestones. Always on      │
 *   │             when the master volume is non-zero.              │
 *   │  ui       – very small, mostly silent (test button, etc).   │
 *   └────────────────────────────────────────────────────────────┘
 *
 * Anti-fatigue design:
 *   - the typing click is a short attack, not a long tone. It is
 *     intentionally soft; turning the volume above 60% is not
 *     recommended because the click was designed for low gain.
 *   - the error sound is detuned, low, and short — the kind of
 *     sound that catches attention without becoming an irritant.
 *   - the completion and milestone sounds are pitched, longer, and
 *     played only once per session.
 *   - no sound is played for routine UI changes (button hovers,
 *     navigation, etc).
 *
 * The engine does not play on every keypress when sound is "off" —
 * disabled state short-circuits before any synthesis runs.
 */

let audioCtx = null;
let masterGain = null;
let typingGain = null;
let feedbackGain = null;
let uiGain = null;

let enabled = true;
let userInited = false;

const volume = { master: 0.5, typing: 0.4, feedback: 0.7, ui: 0.3 };

/**
 * Init on first user gesture. Browsers refuse to start an AudioContext
 * without one, so the practice page calls this from a keydown or
 * pointerdown handler.
 */
export const init = () => {
  if (userInited) return;
  userInited = true;

  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    try { audioCtx = new AudioContext(); }
    catch (e) { return; }
  }
  if (!masterGain) {
    // A small graph: every sound -> its group gain -> master -> destination.
    // Each group has its own gain so we can mute one role without
    // affecting the others.
    masterGain = audioCtx.createGain();
    typingGain = audioCtx.createGain();
    feedbackGain = audioCtx.createGain();
    uiGain = audioCtx.createGain();

    masterGain.gain.value = volume.master;
    typingGain.gain.value = volume.typing;
    feedbackGain.gain.value = volume.feedback;
    uiGain.gain.value = volume.ui;

    typingGain.connect(masterGain);
    feedbackGain.connect(masterGain);
    uiGain.connect(masterGain);
    masterGain.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
};

const ensure = () => {
  if (!audioCtx) return null;
  if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
  return audioCtx;
};

/**
 * Profile configuration. Each profile describes:
 *   - body:  the primary tone (sine, triangle, square) with pitch
 *            and decay. This is the "key" sound the user hears.
 *   - attack: a higher-pitched click at the start of the keystroke
 *             that sells the "physical" feel.
 *   - space: a slightly lower-pitched body for word boundaries, so
 *            users hear a difference between mid-word and end-of-word.
 *
 *   "none" is a real profile that emits silence. It exists so the
 *   sound profile selector can include it without the practice loop
 *   having to special-case "no sound".
 */
const PROFILES = {
  none: null,
  mechanical: {
    body: { type: 'triangle', freq: 240, jitter: 90, dur: 0.045 },
    attack: { type: 'square', freq: 1800, jitter: 200, dur: 0.012, gain: 0.4 },
    space: { freq: 180, type: 'triangle' },
  },
  soft: {
    body: { type: 'sine', freq: 320, jitter: 40, dur: 0.06 },
    attack: { type: 'sine', freq: 1200, jitter: 100, dur: 0.018, gain: 0.25 },
    space: { freq: 220, type: 'sine' },
  },
  typewriter: {
    body: { type: 'square', freq: 420, jitter: 60, dur: 0.055 },
    attack: { type: 'triangle', freq: 2400, jitter: 250, dur: 0.010, gain: 0.55 },
    space: { freq: 320, type: 'square' },
  },
};

const playBody = (profile, dest, gainScale = 1) => {
  const ctx = ensure();
  if (!ctx) return;
  const spec = profile.body;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = spec.type;
  const f = spec.freq + (Math.random() * 2 - 1) * spec.jitter;
  osc.frequency.setValueAtTime(f, t);
  // Slight pitch drop makes the body feel mechanical rather than
  // synthesised.
  osc.frequency.exponentialRampToValueAtTime(Math.max(80, f * 0.7), t + spec.dur);

  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(volume.master * 0.5 * gainScale, t + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.001, t + spec.dur);

  osc.connect(gain);
  gain.connect(dest);
  osc.start(t);
  osc.stop(t + spec.dur + 0.02);
};

const playAttack = (profile, dest, gainScale = 1) => {
  const ctx = ensure();
  if (!ctx) return;
  const spec = profile.attack;
  if (!spec) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = spec.type;
  const f = spec.freq + (Math.random() * 2 - 1) * spec.jitter;
  osc.frequency.setValueAtTime(f, t);
  osc.frequency.exponentialRampToValueAtTime(f * 0.4, t + spec.dur);

  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(
    volume.master * 0.6 * (spec.gain || 0.4) * gainScale, t + 0.002
  );
  gain.gain.exponentialRampToValueAtTime(0.001, t + spec.dur);

  osc.connect(gain);
  gain.connect(dest);
  osc.start(t);
  osc.stop(t + spec.dur + 0.01);
};

/**
 * One correctly-typed keystroke. Plays nothing if disabled or the
 * profile is "none" / "silent".
 */
export const playKeyClick = (profileName = 'mechanical') => {
  if (!enabled) return;
  const ctx = ensure();
  if (!ctx || !typingGain) return;
  const profile = PROFILES[profileName] || PROFILES.mechanical;
  if (!profile) return;
  playAttack(profile, typingGain);
  playBody(profile, typingGain);
};

/**
 * Word-boundary press (space bar). Lower-pitched than the body so
 * users can hear rhythm without watching the screen.
 */
export const playSpace = (profileName = 'mechanical') => {
  if (!enabled) return;
  const ctx = ensure();
  if (!ctx || !typingGain) return;
  const profile = PROFILES[profileName] || PROFILES.mechanical;
  if (!profile) return;

  const spec = profile.space;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = spec.type;
  osc.frequency.setValueAtTime(spec.freq, t);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(volume.master * 0.4, t + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
  osc.connect(gain);
  gain.connect(typingGain);
  osc.start(t);
  osc.stop(t + 0.08);
};

/**
 * Mistyped keystroke. Detuned, low, short. Not jarring — it catches
 * the ear without making the user flinch.
 */
export const playError = () => {
  if (!enabled) return;
  const ctx = ensure();
  if (!ctx || !feedbackGain) return;
  const t = ctx.currentTime;
  const o1 = ctx.createOscillator();
  const o2 = ctx.createOscillator();
  const gain = ctx.createGain();

  o1.type = 'sawtooth';
  o2.type = 'sawtooth';
  o1.frequency.setValueAtTime(140, t);
  o2.frequency.setValueAtTime(135, t);
  o1.frequency.exponentialRampToValueAtTime(70, t + 0.18);
  o2.frequency.exponentialRampToValueAtTime(67, t + 0.18);

  gain.gain.setValueAtTime(volume.master * 0.35, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

  o1.connect(gain);
  o2.connect(gain);
  gain.connect(feedbackGain);
  o1.start(t);
  o2.start(t);
  o1.stop(t + 0.20);
  o2.stop(t + 0.20);
};

/**
 * Session-complete chime. C major arpeggio, longer sustain. The
 * single most rewarding sound in the app — meant to feel like an
 * earned reward.
 */
export const playComplete = () => {
  if (!enabled) return;
  const ctx = ensure();
  if (!ctx || !feedbackGain) return;
  const notes = [523.25, 659.25, 783.99, 1046.50];
  const t0 = ctx.currentTime;
  notes.forEach((freq, i) => {
    const t = t0 + i * 0.09;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(volume.master * 0.45, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc.connect(gain);
    gain.connect(feedbackGain);
    osc.start(t);
    osc.stop(t + 0.55);
  });
};

/**
 * Crossed a wpm threshold (20, 40, 60, 80, 100, 130, 160, 200). The
 * pitch rises with the threshold so the user hears their progress.
 */
export const playMilestone = (wpm = 100) => {
  if (!enabled) return;
  const ctx = ensure();
  if (!ctx || !feedbackGain) return;
  const base = 440 + Math.min(wpm, 200) * 1.5;
  const notes = [base, base * 1.25, base * 1.5];
  const t0 = ctx.currentTime;
  notes.forEach((freq, i) => {
    const t = t0 + i * 0.06;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(volume.master * 0.5, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    osc.connect(gain);
    gain.connect(feedbackGain);
    osc.start(t);
    osc.stop(t + 0.40);
  });
};

/**
 * Achievement unlocked. Brighter, longer chime — celebratory but
 * not a fanfare. The same key as the milestone but a 5-note rising
 * arpeggio, played once.
 */
export const playAchievement = () => {
  if (!enabled) return;
  const ctx = ensure();
  if (!ctx || !feedbackGain) return;
  const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
  const t0 = ctx.currentTime;
  notes.forEach((freq, i) => {
    const t = t0 + i * 0.08;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(volume.master * 0.4, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    osc.connect(gain);
    gain.connect(feedbackGain);
    osc.start(t);
    osc.stop(t + 0.65);
  });
};

/**
 * Soft UI click for the "Test sound" button. Quiet enough not to
 * surprise anyone.
 */
export const playClick = () => {
  if (!enabled) return;
  const ctx = ensure();
  if (!ctx || !uiGain) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(600, t);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(volume.master * 0.3, t + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
  osc.connect(gain);
  gain.connect(uiGain);
  osc.start(t);
  osc.stop(t + 0.06);
};

/**
 * Set the master volume. 0..1. 0 is silent (no sounds play).
 */
export const setVolume = (level) => {
  volume.master = Math.max(0, Math.min(1, level));
  if (masterGain) masterGain.gain.value = volume.master;
};

/**
 * Set per-group volume. Lets the user keep the helpful feedback but
 * drop the per-keystroke typing noise without losing milestones.
 */
export const setGroupVolume = (group, level) => {
  if (!['typing', 'feedback', 'ui'].includes(group)) return;
  volume[group] = Math.max(0, Math.min(1, level));
  if (group === 'typing' && typingGain) typingGain.gain.value = volume.typing;
  if (group === 'feedback' && feedbackGain) feedbackGain.gain.value = volume.feedback;
  if (group === 'ui' && uiGain) uiGain.gain.value = volume.ui;
};

export const getVolume = () => ({ ...volume });
export const getMasterVolume = () => volume.master;

export const isEnabled = () => enabled;
export const enable = () => { enabled = true; init(); };
export const disable = () => { enabled = false; };

export const PROFILE_NAMES = ['none', 'mechanical', 'soft', 'typewriter'];
