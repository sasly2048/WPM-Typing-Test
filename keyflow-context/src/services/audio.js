let audioCtx = null;
let enabled = true;
let masterVolume = 0.5;

/**
 * Initializes the AudioContext on first user interaction.
 */
export const init = () => {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
};

/**
 * Procedurally generates a key click sound based on the profile.
 * @param {string} profile - 'mechanical', 'membrane', 'typewriter'
 */
export const playKeyClick = (profile = 'mechanical') => {
  if (!enabled || !audioCtx) return;
  
  const t = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  // Base volume logic
  gain.gain.value = masterVolume * 0.5;
  
  if (profile === 'typewriter') {
    osc.type = 'square';
    osc.frequency.setValueAtTime(400 + Math.random() * 50, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
    osc.start(t);
    osc.stop(t + 0.05);
  } else if (profile === 'membrane') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150 + Math.random() * 20, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.03);
    osc.start(t);
    osc.stop(t + 0.03);
  } else {
    // Mechanical
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(250 + Math.random() * 100, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.04);
    osc.start(t);
    osc.stop(t + 0.04);
  }
};

/**
 * Plays a subtle error sound.
 */
export const playError = () => {
  if (!enabled || !audioCtx) return;
  const t = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(120, t);
  osc.frequency.exponentialRampToValueAtTime(80, t + 0.1);
  
  gain.gain.setValueAtTime(masterVolume * 0.3, t);
  gain.gain.linearRampToValueAtTime(0.01, t + 0.1);
  
  osc.start(t);
  osc.stop(t + 0.1);
};

/**
 * Plays a completion chime.
 */
export const playComplete = () => {
  if (!enabled || !audioCtx) return;
  const t = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(523.25, t); // C5
  osc.frequency.setValueAtTime(659.25, t + 0.1); // E5
  osc.frequency.setValueAtTime(783.99, t + 0.2); // G5
  
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(masterVolume * 0.4, t + 0.05);
  gain.gain.linearRampToValueAtTime(0, t + 0.6);
  
  osc.start(t);
  osc.stop(t + 0.6);
};

/**
 * Plays an achievement unlock sound.
 */
export const playAchievement = () => {
  if (!enabled || !audioCtx) return;
  const t = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  osc.type = 'square';
  osc.frequency.setValueAtTime(440, t); // A4
  osc.frequency.setValueAtTime(554.37, t + 0.15); // C#5
  osc.frequency.setValueAtTime(659.25, t + 0.3); // E5
  osc.frequency.setValueAtTime(880, t + 0.45); // A5
  
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(masterVolume * 0.3, t + 0.05);
  gain.gain.linearRampToValueAtTime(masterVolume * 0.3, t + 0.45);
  gain.gain.linearRampToValueAtTime(0, t + 0.8);
  
  osc.start(t);
  osc.stop(t + 0.8);
};

/**
 * Sets the master volume.
 * @param {number} level - 0.0 to 1.0
 */
export const setVolume = (level) => {
  masterVolume = Math.max(0, Math.min(1, level));
};

/** @returns {boolean} */
export const isEnabled = () => enabled;
/** Enables audio */
export const enable = () => { enabled = true; init(); };
/** Disables audio */
export const disable = () => { enabled = false; };
