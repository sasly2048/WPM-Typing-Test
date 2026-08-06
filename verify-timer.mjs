/**
 * Verifies time mode actually ends on the clock.
 *
 * Before this, the duration control existed but nothing watched the clock:
 * a "15s" test ran until the passage was exhausted. The control promised a
 * contract the engine never honoured.
 *
 * Uses the shortest duration (15s) and overrides it in-page to keep the
 * check fast while still exercising the real countdown path.
 */

import { chromium } from 'playwright';

const BASE = process.argv[2] || 'http://localhost:4410';

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

await page.goto(`${BASE}/#/practice`, { waitUntil: 'load' });
await page.waitForTimeout(1300);

const results = [];

/* ── clock is hidden until typing starts ─────────────────────────────── */

await page.click('[data-mode="time"]');
await page.waitForTimeout(900);
await page.click('[data-duration="15"]');
await page.waitForTimeout(900);

const beforeTyping = await page.evaluate(
  () => document.querySelector('#practice-clock')?.hidden
);
results.push({
  what: 'clock hidden before first keystroke',
  ok: beforeTyping === true,
  note: `hidden=${beforeTyping}`,
});

/* ── clock appears and counts down ───────────────────────────────────── */

await page.click('#practice-target');
await page.keyboard.press('t');
await page.waitForTimeout(400);

const afterFirstKey = await page.evaluate(() => ({
  hidden: document.querySelector('#practice-clock')?.hidden,
  value: document.querySelector('#practice-clock-value')?.textContent,
}));
results.push({
  what: 'clock visible and counting after first keystroke',
  ok: afterFirstKey.hidden === false && Number(afterFirstKey.value) <= 15 && Number(afterFirstKey.value) > 10,
  note: JSON.stringify(afterFirstKey),
});

await page.waitForTimeout(1600);
const later = await page.evaluate(
  () => document.querySelector('#practice-clock-value')?.textContent
);
results.push({
  what: 'value decreases over time',
  ok: Number(later) < Number(afterFirstKey.value),
  note: `${afterFirstKey.value} -> ${later}`,
});

/* ── session ends on the clock ───────────────────────────────────────── */

// Fast-forward by shortening the remaining time: re-run with a 15s clock is
// too slow for a check, so drive the real end condition by waiting it out
// at the shortest duration the UI offers.
const endedAt = await page.evaluate(async () => {
  const started = Date.now();
  // Resolve as soon as the router leaves /practice.
  await new Promise((resolve) => {
    const id = setInterval(() => {
      if (location.hash.startsWith('#/results')) {
        clearInterval(id);
        resolve();
      }
    }, 200);
    setTimeout(() => { clearInterval(id); resolve(); }, 20000);
  });
  return { hash: location.hash, elapsedMs: Date.now() - started };
});

results.push({
  what: 'session ends on the clock and navigates to results',
  ok: endedAt.hash.startsWith('#/results'),
  note: `${endedAt.hash} after ${Math.round(endedAt.elapsedMs / 1000)}s`,
});

/* ── the recorded duration matches the target ────────────────────────── */

const session = await page.evaluate(() => {
  try { return JSON.parse(sessionStorage.getItem('lastSession') || 'null'); }
  catch { return null; }
});

results.push({
  what: 'recorded duration is close to the 15s target',
  ok: session && Math.abs(session.duration - 15) <= 2,
  note: session ? `duration=${session.duration}s wpm=${session.wpm}` : 'no session',
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
