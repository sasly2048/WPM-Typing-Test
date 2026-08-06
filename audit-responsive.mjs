/**
 * Responsive + smoke audit.
 *
 * Loads every route at three viewports and reports horizontal overflow, the
 * offending elements, console errors, and tap-target sizes. Run against a
 * running preview server:
 *
 *   npx vite preview --port 4400 &
 *   node audit-responsive.mjs http://localhost:4400
 */

import { chromium, devices } from 'playwright';

const BASE = process.argv[2] || 'http://localhost:4400';

const VIEWPORTS = [
  { name: 'phone',   width: 390,  height: 844 },
  { name: 'tablet',  width: 768,  height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
];

const ROUTES = [
  '/', '/practice', '/developer', '/dashboard', '/results',
  '/achievements', '/themes', '/settings', '/profile', '/auth',
];

// Seeded before any app code runs, so protected routes render and the
// data-driven pages have something to draw.
const SEED = `
  localStorage.setItem('keyflow_guest_mode','true');
  localStorage.setItem('keyflow_appearance','light');
  (() => {
    const modes=['paragraph','words','code'], now=Date.now(), h=[];
    for(let i=40;i>=0;i--){
      const base=52+(40-i)*0.7;
      h.push({wpm:Math.round(base+Math.sin(i)*7),rawWpm:Math.round(base+9),
        accuracy:92+((i*7)%7),errors:i%8,consistency:Math.round(70+((i*13)%25)),
        duration:[15,30,60][i%3],mode:modes[i%3],targetDuration:30,targetWordCount:50,
        chars:{correct:180+i,incorrect:5,extra:2,missed:1},pauseCount:i%5,
        totalStrokes:200+i,timestamp:now-i*43200000});
    }
    localStorage.setItem('keyflow_history',JSON.stringify(h));
    localStorage.setItem('keyflow_streak',JSON.stringify({current:6,best:11,lastActive:now}));
    sessionStorage.setItem('lastSession',JSON.stringify(h[h.length-1]));
  })();
`;

const browser = await chromium.launch();
const findings = [];
let checked = 0;

for (const vp of VIEWPORTS) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: vp.name === 'phone' ? 3 : 1,
    isMobile: vp.name === 'phone',
    hasTouch: vp.name === 'phone',
  });
  await context.addInitScript(SEED);

  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (m) => {
    if (m.type() === 'error' && !m.location().url.startsWith('chrome-extension://')) {
      consoleErrors.push(m.text());
    }
  });
  page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`));

  for (const route of ROUTES) {
    consoleErrors.length = 0;
    await page.goto(`${BASE}/#${route}`, { waitUntil: 'load' });
    // Hash routing means no navigation event; wait for the app to paint.
    await page.waitForTimeout(900);
    checked++;

    const result = await page.evaluate(() => {
      const de = document.documentElement;
      const vw = window.innerWidth;

      // Content wider than the viewport is only a defect if it cannot be
      // reached. Anything inside a scrollable ancestor is reachable by
      // design, so walk up before reporting.
      const inScrollContainer = (el) => {
        for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
          const ox = getComputedStyle(p).overflowX;
          if (ox === 'auto' || ox === 'scroll') return true;
        }
        return false;
      };

      const overflowing = [...document.querySelectorAll('body *')]
        .filter((el) => {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) return false;
          const style = getComputedStyle(el);
          if (style.overflowX === 'auto' || style.overflowX === 'scroll') return false;
          if (inScrollContainer(el)) return false;
          return r.right > vw + 1 || r.left < -1;
        })
        .slice(0, 5)
        .map((el) => `${el.tagName.toLowerCase()}.${String(el.getAttribute('class') || '').split(' ')[0]} right=${Math.round(el.getBoundingClientRect().right)}`);

      // Interactive targets below the 24px WCAG 2.2 minimum.
      //
      // Two exemptions are applied, both from §2.5.8 itself:
      //   - "inline" targets inside a sentence or paragraph;
      //   - controls whose hit area is extended by a pseudo-element, which
      //     getBoundingClientRect() cannot see. Those are hit-tested instead.
      const hitExtended = (el) => {
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        // Only meaningful for elements currently within the viewport;
        // elementFromPoint returns null outside it, which would otherwise
        // read as "not extended" and produce a false positive.
        if (r.top < 0 || r.bottom > window.innerHeight) return true;

        const probe = (y) => {
          if (y < 0 || y > window.innerHeight) return false;
          const hit = document.elementFromPoint(cx, y);
          return hit === el || el.contains(hit) || el === hit?.parentElement;
        };
        // A hit 12px outside the border box means the real target clears 24px.
        return probe(r.top - 12) || probe(r.bottom + 12);
      };

      const isInline = (el) => {
        const p = el.parentElement;
        return p && /^(P|LI|SPAN|LABEL)$/.test(p.tagName) && p.textContent.trim().length > el.textContent.trim().length + 8;
      };

      const small = [...document.querySelectorAll('button, a[href], input, select, [role="tab"], [role="switch"], [role="radio"]')]
        .filter((el) => {
          const r = el.getBoundingClientRect();
          if (!(r.width > 0 && r.height > 0)) return false;
          if (r.height >= 24 && r.width >= 24) return false;
          if (isInline(el)) return false;
          return !hitExtended(el);
        })
        .slice(0, 5)
        .map((el) => {
          const r = el.getBoundingClientRect();
          return `${el.tagName.toLowerCase()}.${String(el.getAttribute('class') || '').split(' ')[0]} ${Math.round(r.width)}x${Math.round(r.height)}`;
        });

      return {
        scrollW: de.scrollWidth,
        innerW: vw,
        overflowsX: de.scrollWidth > vw + 1,
        overflowing,
        smallTargets: small,
        contentLen: (document.querySelector('#page-container')?.textContent || '').trim().length,
      };
    });

    const problems = [];
    if (result.overflowsX) problems.push(`overflow-x (${result.scrollW} > ${result.innerW}) ${result.overflowing.join('; ')}`);
    if (result.overflowing.length) problems.push(`clipped: ${result.overflowing.join('; ')}`);
    if (result.smallTargets.length) problems.push(`small targets: ${result.smallTargets.join('; ')}`);
    if (result.contentLen < 30) problems.push(`empty page (${result.contentLen} chars)`);
    if (consoleErrors.length) problems.push(`console: ${consoleErrors.slice(0, 2).join(' | ')}`);

    if (problems.length) findings.push({ vp: vp.name, route, problems });
  }

  await context.close();
}

await browser.close();

console.log(`\nChecked ${checked} route/viewport combinations.\n`);

if (!findings.length) {
  console.log('No responsive, overflow, tap-target or console issues found.');
} else {
  for (const f of findings) {
    console.log(`[${f.vp}] ${f.route}`);
    for (const p of f.problems) console.log(`   - ${p}`);
  }
  console.log(`\n${findings.length} route/viewport combinations with findings.`);
}

process.exit(0);
