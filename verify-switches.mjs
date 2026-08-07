/**
 * Hit-tests every switch on the settings page, scrolling each into view
 * first. The responsive audit reports these as undersized because
 * getBoundingClientRect() cannot see the ::before that extends the hit area,
 * and elementFromPoint returns null for anything outside the viewport.
 */

import { chromium } from 'playwright';

const BASE = process.argv[2] || 'http://localhost:4403';

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});
await context.addInitScript(`localStorage.setItem('keyflow_guest_mode','true');`);
const page = await context.newPage();

await page.goto(`${BASE}/#/settings`, { waitUntil: 'load' });
await page.waitForTimeout(1000);

const count = await page.locator('.switch').count();
const results = [];

for (let i = 0; i < count; i++) {
  const el = page.locator('.switch').nth(i);
  await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(120);

  const r = await el.evaluate((node) => {
    const box = node.getBoundingClientRect();
    const cx = box.left + box.width / 2;
    const cy = box.top + box.height / 2;

    const hits = (y) => {
      if (y < 0 || y > window.innerHeight) return false;
      const hit = document.elementFromPoint(cx, y);
      return hit === node || node.contains(hit);
    };

    let top = cy;
    let bottom = cy;
    while (top > 0 && hits(top - 1) && cy - top < 40) top -= 1;
    while (bottom < window.innerHeight && hits(bottom + 1) && bottom - cy < 40) bottom += 1;

    return {
      label: node.getAttribute('aria-label'),
      visible: `${Math.round(box.width)}x${Math.round(box.height)}`,
      effectiveHeight: Math.round(bottom - top),
    };
  });

  results.push(r);
}

let failed = 0;
for (const r of results) {
  const ok = r.effectiveHeight >= 24;
  if (!ok) failed++;
  console.log(`${ok ? '  ok  ' : 'FAIL  '}${r.label}: visible ${r.visible}, effective height ${r.effectiveHeight}px`);
}

console.log(`\n${results.length - failed}/${results.length} switches meet the 24px minimum.`);
process.exit(failed ? 1 : 0);
