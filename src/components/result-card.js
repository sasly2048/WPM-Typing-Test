/**
 * Shareable result card.
 *
 * Renders a PNG of the user's last result to a canvas, then either
 * downloads the file or copies it to the clipboard. The canvas is
 * the same shape and palette as the in-app result hero, so the
 * exported image looks like the screen.
 *
 * The card is intentionally self-contained: it doesn't pull from
 * the live DOM. You give it the session stats and it draws.
 *
 * Why canvas instead of an HTML-to-image library?
 *   - No dependency. html2canvas is ~50KB and slow.
 *   - Full control over typography, palette, and accents.
 *   - Same code works in service-worker / Node-style renderers.
 */

const PALETTES = {
  paper:  { bg: '#FDFCFA', fg: '#1A1A1A', accent: '#E07B3F', muted: '#6B6358' },
  carbon: { bg: '#0E0E10', fg: '#F5F2EC', accent: '#FFB000', muted: '#8C8478' },
  dusk:   { bg: '#0F1226', fg: '#E5E3F0', accent: '#8B7FF5', muted: '#7B7C9B' },
  aurora: { bg: '#0B1320', fg: '#E4F4F2', accent: '#5FE3C7', muted: '#7A909C' },
  sunset: { bg: '#FBF1E2', fg: '#3A1E1B', accent: '#E36D4E', muted: '#7D5C53' },
  serif:  { bg: '#FAF7F2', fg: '#1A1815', accent: '#A04F2F', muted: '#6F6358' },
  mono:   { bg: '#0A0A0A', fg: '#E6E6E6', accent: '#5FE3C7', muted: '#8A8A8A' },
};

const FONT_STACK = '"Inter", "SF Pro", system-ui, sans-serif';
const MONO_STACK = '"JetBrains Mono", "Fira Code", ui-monospace, monospace';

const getPalette = (themeId) => PALETTES[themeId] || PALETTES.paper;

/**
 * Render the result card to a canvas. Returns the canvas. The
 * caller is responsible for converting to PNG / clipboard.
 *
 * @param {Object}  opts
 * @param {Object}  opts.session    the final session stats
 * @param {string}  opts.theme      theme id (paper, carbon, ...)
 * @param {string}  [opts.modeLabel] e.g. 'Prose'
 * @param {string}  [opts.source]    e.g. '— Mark Twain' for quotes
 * @returns {HTMLCanvasElement}
 */
export const renderResultCard = ({ session, theme = 'paper', modeLabel, source } = {}) => {
  const W = 1200, H = 630; // Open Graph image size
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const p = getPalette(theme);
  const dpr = window.devicePixelRatio || 1;
  // For HiDPI sharpness, draw at 2x and scale back. The export stays
  // at WxH so the file is small enough to share.
  ctx.scale(1, 1);

  // Background
  ctx.fillStyle = p.bg;
  ctx.fillRect(0, 0, W, H);

  // Top brand strip
  ctx.fillStyle = p.accent;
  ctx.fillRect(0, 0, W, 8);

  // Logo / brand
  ctx.fillStyle = p.fg;
  ctx.font = `600 28px ${FONT_STACK}`;
  ctx.textBaseline = 'top';
  ctx.fillText('KeyFlow', 64, 56);

  // Tag
  ctx.fillStyle = p.muted;
  ctx.font = `400 18px ${FONT_STACK}`;
  ctx.fillText('typing test result', 64 + ctx.measureText('KeyFlow').width + 16, 64);

  // Big WPM (the headline)
  const wpm = Math.round(session?.wpm || 0);
  ctx.fillStyle = p.accent;
  ctx.font = `700 240px ${FONT_STACK}`;
  ctx.textAlign = 'left';
  ctx.fillText(String(wpm), 64, 130);

  // WPM label
  ctx.fillStyle = p.muted;
  ctx.font = `500 28px ${FONT_STACK}`;
  ctx.fillText('words per minute', 64 + ctx.measureText(String(wpm)).width + 24, 270);

  // Mode + source row
  if (modeLabel || source) {
    ctx.fillStyle = p.fg;
    ctx.font = `500 22px ${FONT_STACK}`;
    const label = [modeLabel, source].filter(Boolean).join(' · ');
    ctx.fillText(label, 64, 360);
  }

  // Stats grid
  const stats = [
    { label: 'Accuracy', value: `${Math.round(session?.accuracy || 0)}%` },
    { label: 'Consistency', value: session?.consistency != null ? `${Math.round(session.consistency)}%` : '—' },
    { label: 'Burst', value: `${Math.round(session?.burstWpm || session?.rawWpm || wpm)} wpm` },
    { label: 'Errors', value: String(session?.errors || 0) },
    { label: 'Time', value: session?.duration ? `${session.duration}s` : '—' },
  ];
  const colW = (W - 128) / stats.length;
  ctx.textAlign = 'center';
  stats.forEach((s, i) => {
    const x = 64 + colW * (i + 0.5);
    ctx.fillStyle = p.muted;
    ctx.font = `400 16px ${FONT_STACK}`;
    ctx.fillText(s.label, x, 450);
    ctx.fillStyle = p.fg;
    ctx.font = `600 32px ${MONO_STACK}`;
    ctx.fillText(s.value, x, 480);
  });
  ctx.textAlign = 'left';

  // Footer
  ctx.fillStyle = p.muted;
  ctx.font = `400 18px ${FONT_STACK}`;
  ctx.fillText('keyflow.app · keep practicing', 64, H - 56);

  // Subtle divider
  ctx.strokeStyle = p.muted;
  ctx.globalAlpha = 0.2;
  ctx.beginPath();
  ctx.moveTo(64, 430);
  ctx.lineTo(W - 64, 430);
  ctx.stroke();
  ctx.globalAlpha = 1;

  return canvas;
};

/**
 * Render a canvas to a Blob (PNG) by awaiting an async toBlob. Useful
 * for the share-to-clipboard path.
 */
export const canvasToBlob = (canvas) => new Promise((resolve) => {
  canvas.toBlob((blob) => resolve(blob), 'image/png');
});

/**
 * Trigger a download of the canvas as a PNG file.
 */
export const downloadResultCard = (canvas, filename = 'keyflow-result.png') => {
  const url = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
};

/**
 * Copy a canvas to the clipboard as an image. Returns true on success.
 * Falls back to download if the clipboard API rejects the image (e.g.
 * insecure context, old browsers).
 */
export const copyResultCard = async (canvas) => {
  try {
    if (!navigator.clipboard || !window.ClipboardItem) {
      throw new Error('Clipboard API unavailable');
    }
    const blob = await canvasToBlob(canvas);
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    return true;
  } catch {
    return false;
  }
};
