/**
 * Verifies session replay: types a real passage, completes the run, then
 * checks the results page can play it back and scrub through it.
 *
 * The timeline is deliberately kept for the most recent session only
 * (sessionStorage), so this also confirms the results page degrades cleanly
 * when no replay data exists.
 */

import { chromium } from 'playwright';

const BASE = process.argv[2] || 'http://localhost:4411';

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
await context.addInitScript(`
  localStorage.setItem('keyflow_guest_mode','true');
  localStorage.setItem('keyflow_appearance','light');
  localStorage.removeItem('keyflow_settings');
`);
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

const results = [];

/* ── no replay data: results must not break ──────────────────────────── */

await page.goto(`${BASE}/#/results`, { waitUntil: 'load' });
await page.waitForTimeout(900);
const emptyState = await page.evaluate(() => ({
  hasContent: (document.body.textContent || '').includes('No results'),
  replaySection: document.querySelector('#results-replay-section')?.hidden,
}));
results.push({
  what: 'results degrades cleanly with no session',
  ok: emptyState.hasContent,
  note: JSON.stringify(emptyState),
});

/* ── complete a short run ────────────────────────────────────────────── */

await page.goto(`${BASE}/#/practice`, { waitUntil: 'load' });
await page.waitForTimeout(1200);

await page.click('[data-mode="words"]');
await page.waitForTimeout(700);
await page.click('[data-words="10"]');
await page.waitForTimeout(900);

const text = await page.evaluate(() =>
  [...document.querySelectorAll('#practice-render .keyflow-char')].map((s) => s.textContent).join('')
);

await page.click('#practice-target');
// Type with realistic gaps so the timeline has meaningful timestamps.
for (const ch of text) {
  await page.keyboard.press(ch === ' ' ? 'Space' : ch);
  await page.waitForTimeout(12);
}

await page.waitForTimeout(1200);
const landed = page.url();
results.push({
  what: 'completing a run navigates to results',
  ok: landed.includes('#/results'),
  note: landed.split('#')[1] || landed,
});

/* ── replay is present and playable ──────────────────────────────────── */

await page.waitForTimeout(800);

const replayState = await page.evaluate(() => ({
  sectionVisible: document.querySelector('#results-replay-section')?.hidden === false,
  charCount: document.querySelectorAll('.replay__char').length,
  hasScrub: !!document.querySelector('#replay-scrub'),
  scrubMax: document.querySelector('#replay-scrub')?.max,
}));
results.push({
  what: 'replay renders with the typed passage',
  ok: replayState.sectionVisible && replayState.charCount > 10 && replayState.hasScrub,
  note: JSON.stringify(replayState),
});

/* ── scrubbing paints state ──────────────────────────────────────────── */

const scrubbed = await page.evaluate(() => {
  const scrub = document.querySelector('#replay-scrub');
  const atZero = document.querySelectorAll('.replay__char.is-correct').length;
  scrub.value = scrub.max;
  scrub.dispatchEvent(new Event('input', { bubbles: true }));
  const atEnd = document.querySelectorAll('.replay__char.is-correct').length;
  return { atZero, atEnd, time: document.querySelector('#replay-time')?.textContent };
});
results.push({
  what: 'scrubbing to the end paints typed characters',
  ok: scrubbed.atEnd > scrubbed.atZero,
  note: `${scrubbed.atZero} -> ${scrubbed.atEnd} correct, t=${scrubbed.time}`,
});

/* ── play advances the cursor ────────────────────────────────────────── */

const played = await page.evaluate(async () => {
  const scrub = document.querySelector('#replay-scrub');
  scrub.value = 0;
  scrub.dispatchEvent(new Event('input', { bubbles: true }));
  document.querySelector('#replay-toggle').click();
  await new Promise((r) => setTimeout(r, 700));
  const t = document.querySelector('#replay-time')?.textContent;
  document.querySelector('#replay-toggle').click(); // pause
  return t;
});
results.push({
  what: 'pressing play advances the clock',
  ok: parseFloat(played) > 0,
  note: `t=${played}`,
});

await browser.close();

let failed = 0;
for (const r of results) {
  if (!r.ok) failed++;
  console.log(`${r.ok ? '  ok  ' : 'FAIL  '}${r.what}  (${r.note})`);
}
if (errors.length) {
  failed++;
  console.log(`\npage errors: ${errors.slice(0, 3).join(' | ')}`);
}
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
