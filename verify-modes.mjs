/**
 * Exercises every practice mode and difficulty end to end: selects the
 * control, waits for text, and confirms a passage actually loaded.
 *
 * These were silently lost when practice.js was rewritten — the controls
 * existed only in components nothing imported any more — so they get a
 * runnable check rather than a one-off manual look.
 */

import { chromium } from 'playwright';

const BASE = process.argv[2] || 'http://localhost:4403';

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
await context.addInitScript(`
  localStorage.setItem('keyflow_guest_mode','true');
  localStorage.setItem('keyflow_appearance','light');
`);
const page = await context.newPage();

const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

await page.goto(`${BASE}/#/practice`, { waitUntil: 'load' });
await page.waitForTimeout(1200);

const textLength = () =>
  page.evaluate(() => document.querySelectorAll('#practice-render .keyflow-char').length);

const results = [];

/* ── modes ───────────────────────────────────────────────────────────── */

for (const mode of ['paragraph', 'time', 'words']) {
  await page.click(`[data-mode="${mode}"]`);
  await page.waitForTimeout(900);
  const len = await textLength();
  const lengthControl = await page.evaluate(() => ({
    duration: !document.querySelector('#practice-length')?.hidden,
    words: !document.querySelector('#practice-words')?.hidden,
  }));
  results.push({ what: `mode:${mode}`, chars: len, ok: len > 20, lengthControl });
}

/* ── custom ──────────────────────────────────────────────────────────── */

await page.click('[data-mode="custom"]');
await page.waitForTimeout(400);

const customPanelShown = await page.evaluate(
  () => !document.querySelector('#practice-custom')?.hidden
);

await page.fill('#practice-custom-input', 'custom passage for verification purposes');
await page.click('#practice-custom-apply');
await page.waitForTimeout(900);

const customChars = await textLength();
const customText = await page.evaluate(() =>
  [...document.querySelectorAll('#practice-render .keyflow-char')].map((s) => s.textContent).join('')
);

results.push({
  what: 'mode:custom',
  chars: customChars,
  ok: customPanelShown && customText.startsWith('custom passage'),
  note: customText.slice(0, 30),
});

/* ── difficulties ────────────────────────────────────────────────────── */

await page.click('[data-mode="words"]');
await page.waitForTimeout(700);

for (const diff of ['easy', 'medium', 'hard', 'expert']) {
  await page.click(`[data-difficulty="${diff}"]`);
  await page.waitForTimeout(800);
  const len = await textLength();
  results.push({ what: `difficulty:${diff}`, chars: len, ok: len > 20 });
}

/* ── persistence ─────────────────────────────────────────────────────── */

await page.reload({ waitUntil: 'load' });
await page.waitForTimeout(1200);

const restored = await page.evaluate(() => ({
  mode: document.querySelector('[data-mode].active')?.dataset.mode,
  difficulty: document.querySelector('[data-difficulty].active')?.dataset.difficulty,
}));

results.push({
  what: 'config persists across reload',
  ok: restored.mode === 'words' && restored.difficulty === 'expert',
  note: JSON.stringify(restored),
});

await browser.close();

let failed = 0;
for (const r of results) {
  if (!r.ok) failed++;
  const detail = [
    r.chars !== undefined ? `${r.chars} chars` : null,
    r.lengthControl ? `length=${JSON.stringify(r.lengthControl)}` : null,
    r.note ? `(${r.note})` : null,
  ].filter(Boolean).join(' ');
  console.log(`${r.ok ? '  ok  ' : 'FAIL  '}${r.what}  ${detail}`);
}

if (errors.length) {
  failed++;
  console.log(`\npage errors: ${errors.slice(0, 3).join(' | ')}`);
}

console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
