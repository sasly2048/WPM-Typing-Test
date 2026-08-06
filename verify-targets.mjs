/**
 * Verifies the remaining tap-target findings by hit-testing rather than
 * measuring border boxes.
 *
 * getBoundingClientRect() cannot see a ::before that extends the hit area,
 * and it reports elements inside a scroll container as "clipped" even when
 * they are reachable. elementFromPoint answers the question that matters:
 * does a tap at this coordinate reach the control?
 */

import { chromium } from 'playwright';

const BASE = process.argv[2] || 'http://localhost:4401';

const SEED = `
  localStorage.setItem('keyflow_guest_mode','true');
  localStorage.setItem('keyflow_appearance','light');
`;

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});
await context.addInitScript(SEED);
const page = await context.newPage();

/* ── switches: is the extended hit area real? ─────────────────────────── */

await page.goto(`${BASE}/#/settings`, { waitUntil: 'load' });
await page.waitForTimeout(900);

const switchProbe = await page.evaluate(() => {
  const sw = document.querySelector('.switch');
  if (!sw) return { error: 'no switch found' };
  const r = sw.getBoundingClientRect();

  // Probe above and below the visible control; both should still hit it.
  const probe = (dy) => {
    const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2 + dy);
    return el === sw || sw.contains(el);
  };

  return {
    visibleBox: `${Math.round(r.width)}x${Math.round(r.height)}`,
    hitsAt10AboveCentre: probe(-10),
    hitsAt10BelowCentre: probe(10),
    effectiveHeight: (() => {
      let top = r.top + r.height / 2;
      let bottom = top;
      const hit = (y) => {
        const el = document.elementFromPoint(r.left + r.width / 2, y);
        return el === sw || sw.contains(el);
      };
      while (hit(top - 1) && r.top + r.height / 2 - top < 40) top -= 1;
      while (hit(bottom + 1) && bottom - (r.top + r.height / 2) < 40) bottom += 1;
      return Math.round(bottom - top);
    })(),
  };
});

/* ── heatmap: clipped, or scrollable? ────────────────────────────────── */

await page.goto(`${BASE}/#/dashboard`, { waitUntil: 'load' });
await page.waitForTimeout(1200);

const heatmapProbe = await page.evaluate(() => {
  const hm = document.querySelector('.heatmap');
  if (!hm) return { error: 'no heatmap' };
  return {
    clientWidth: hm.clientWidth,
    scrollWidth: hm.scrollWidth,
    canScroll: hm.scrollWidth > hm.clientWidth,
    overflowX: getComputedStyle(hm).overflowX,
    pageOverflows: document.documentElement.scrollWidth > window.innerWidth + 1,
  };
});

/* ── developer editor: reachable by scrolling? ───────────────────────── */

await page.goto(`${BASE}/#/developer`, { waitUntil: 'load' });
await page.waitForTimeout(1400);

const editorProbe = await page.evaluate(() => {
  const ed = document.querySelector('.dev-editor');
  if (!ed) return { error: 'no editor' };
  return {
    clientWidth: ed.clientWidth,
    scrollWidth: ed.scrollWidth,
    canScroll: ed.scrollWidth > ed.clientWidth,
    overflow: getComputedStyle(ed).overflow,
    pageOverflows: document.documentElement.scrollWidth > window.innerWidth + 1,
  };
});

await browser.close();

console.log('switch  ', JSON.stringify(switchProbe));
console.log('heatmap ', JSON.stringify(heatmapProbe));
console.log('editor  ', JSON.stringify(editorProbe));
process.exit(0);
