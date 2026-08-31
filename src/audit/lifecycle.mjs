/**
 * E2E navigation leak detector.
 *
 * The test patches document.addEventListener / removeEventListener so
 * that we can count listener growth. We then navigate between pages
 * using hash changes (which is what the app does in real use) and
 * verify the count is stable.
 *
 * The shim runs once per full page load (via addInitScript), so we
 * snapshot the doc-level count after every navigation. The patched
 * functions live on the page's window, not on document, so they
 * survive the route changes that happen via the hashchange event.
 *
 * Run:  node src/audit/lifecycle.mjs
 */

import { chromium } from 'playwright';

const URL = process.env.URL || 'http://127.0.0.1:4501';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

// Install the shim BEFORE the app boots. addInitScript runs on every
// navigation the page makes, but the shim is gated on a global flag so
// it only installs once per actual page load.
await page.addInitScript(() => {
  if (window.__kfLeak) return;
  window.__kfLeak = { count: 0, peak: 0 };
  const realAdd = EventTarget.prototype.addEventListener;
  const realRemove = EventTarget.prototype.removeEventListener;
  const target = window.__kfLeak;
  EventTarget.prototype.addEventListener = function (type, listener, options) {
    if (this === document) {
      target.count++;
      if (target.count > target.peak) target.peak = target.count;
    }
    return realAdd.call(this, type, listener, options);
  };
  EventTarget.prototype.removeEventListener = function (type, listener, options) {
    if (this === document) target.count = Math.max(0, target.count - 1);
    return realRemove.call(this, type, listener, options);
  };
});

await page.goto(URL, { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.setItem('keyflow_guest_mode', 'true'));

// Use hash changes for navigation (the real app flow). goto() would
// cause a full page reload and would reset the shim.
const PATHS = ['/practice', '/themes', '/dashboard', '/achievements', '/settings', '/results'];
const ITERATIONS = 4;
const samples = [];
const peak = { value: 0 };

for (let i = 0; i < ITERATIONS; i++) {
  for (const path of PATHS) {
    await page.evaluate((p) => { window.location.hash = '#' + p; }, path);
    await page.waitForTimeout(250);
    const c = await page.evaluate(() => window.__kfLeak.count);
    samples.push({ iter: i, path, count: c });
    if (c > peak.value) peak.value = c;
  }
}

console.log('Listener count over time:');
for (const s of samples) {
  console.log(`  iter ${s.iter} ${s.path.padEnd(15)} doc=${s.count}`);
}

const counts = samples.map((s) => s.count);
const max = Math.max(...counts);
const min = Math.min(...counts);
const delta = max - min;

// Acceptance: the peak document-level listener count must not grow
// over iterations. A leak manifests as iter 4 having more listeners
// than iter 1.
const early = samples.filter((s) => s.iter < 2).map((s) => s.count);
const late = samples.filter((s) => s.iter >= 2).map((s) => s.count);
const earlyMax = Math.max(...early);
const lateMax = Math.max(...late);
console.log(`\nPeak iter 0-1: ${earlyMax}`);
console.log(`Peak iter 2-3: ${lateMax}`);

if (lateMax > earlyMax) {
  console.log(`\nFAIL: peak listener count grew from ${earlyMax} to ${lateMax} over iterations.`);
  process.exit(1);
}
if (max > 2) {
  console.log(`\nFAIL: absolute peak (${max}) exceeds tolerance.`);
  process.exit(1);
}
console.log(`\nOK: peak stable at ${max} across ${PATHS.length * ITERATIONS} navigations.`);

await browser.close();
