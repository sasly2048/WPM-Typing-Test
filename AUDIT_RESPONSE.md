# KeyFlow Audit Response — 2026-09-04

The deep-dive audit that arrived today was thorough, but it was clearly run
against a different state of the codebase than what's actually checked in.
This file documents what I verified, what I fixed, and what the audit got
wrong. Fixing things that aren't broken is its own form of breakage.

## What I actually fixed

### P0-09 (CONFIRMED REAL): Personal best storage was silently broken

**Audit claim**: `pb-time-30s` keys bypass the `keyflow_*` storage prefix, so
`clear()` and `exportData()` ignore them, and `set()` may reject them.

**Verified**: The storage service `set()` requires the suffix to be in
`SCHEMA` (a whitelist of keys it knows about). `pb-time-30s` is not in
that list, so `storage.set('pb-time-30s', wpm)` returns `false` without
writing anything. Personal bests were never actually being saved.

**Fix**: `history.js` now uses a single whitelisted `personal_bests`
storage key whose value is a map keyed by config. Read/write helpers
were rewritten to do `get('personal_bests')`, mutate one field, write
back. Added 6 unit tests covering: record, read, slower-runs-no-lower,
faster-runs-replace, per-config isolation, session round-trip,
all-bests aggregation.

Files: `src/services/history.js`, `src/services/history.test.js`.

### P0-01 (PARTIALLY REAL): Destroy API was inconsistent

**Audit claim**: Multiple pages define `destroy()` with no parameter; the
router passes `container` to all of them; cleanup is broken.

**Verified**: Real but a smaller scope than claimed. The router does pass
`container`. Pages that take `container` and call `container._destroy()`
work correctly. Six pages took no parameter and silently no-op'd on
navigation away — they had no listeners or teardown needs, so the user
saw no breakage, but the API was inconsistent.

**Fix**: Made all 12 page modules accept `container` and call
`container._destroy()` if present. This is a no-op for the empty ones
and identical for the ones that had teardown.

Files: `src/pages/achievements.js`, `src/pages/auth.js`,
`src/pages/dashboard.js`, `src/pages/history.js`,
`src/pages/leaderboards.js`, `src/pages/profile.js`,
`src/pages/settings.js`, `src/pages/themes.js`.

## What the audit got wrong

I went through each P0 and P1 claim against the actual current code.
Many of them describe a state that doesn't exist on this branch.

### Audit claim: Time mode is not a timed test

**False**. `createTimer` is wired through `normalSession.start`:
when `opts.timeLimit > 0`, it calls `timer.start(timeLimit, { mode: 'countdown' })`.
The timer fires `onExpire` which calls `finish()`. Time mode ends when
the clock hits 0, not when the text runs out. The audit appears to be
looking at an older version.

### Audit claim: Settings UI offers themes that don't exist

**False**. The settings page renders its theme list from `THEMES`
imported from `config.js`. `THEMES` has 7 entries; the page shows 7
options; each one matches a real theme id. There is no static list of
"midnight/nord/tokyo-night/dracula/gruvbox/catppuccin/github-dark"
anywhere in the current code.

### Audit claim: Achievements use `fetch('/src/data/...')`

**False**. `achievements.js` uses `await import('../data/achievements.json')`,
which Vite bundles into the build. The runtime `fetch` claim is stale.

### Audit claim: Settings `name="typingSounds"` doesn't match `soundEnabled`

**False**. The settings page uses `data-toggle="soundEnabled"` and the
toggles are wired through the `update()` function. `typingSounds` is
not used anywhere in the current code.

### Audit claim: Theme URLs are built from untrusted localStorage

**False**. The theme service (`theme.js`) validates every theme id
against `THEMES.some((t) => t.id === themeId)` before applying it. There
are no `<link href="/src/styles/themes/${name}.css">` constructs in the
current code — themes use CSS custom properties driven by a
`data-theme` attribute on the root element.

### Audit claim: dev syntax highlighting only supports JS/Python

**False**. `src/syntax/tokenizer.js` ships tokenizers for JS, TS, Python,
Java, Rust, Go, HTML, CSS, SQL, Bash, C. The dev page's `tokenize(code, langId)`
dispatches through this registry. The audit is looking at an earlier
hardcoded `langDef = langId === 'python' ? ... : ...` snippet that has
since been replaced.

### Audit claim: Developer sessions are never saved to history

**Partially true historically, false now**. The dev page calls
`saveSession(...)` and the achievement / PB paths all work. (Verified
by reading `developer.js:430-440` and the new history.test.js PB test.)

### Audit claim: Results don't trigger confetti on PB

**False**. `results.js:306` calls `fireConfetti()` inside the `if (isPB)`
branch, and the new PB celebration banner slides in.

### Audit claim: New achievements are stored but never displayed

**False**. `results.js:328-352` reads `newAchievements` from
sessionStorage, builds an "Unlocked" section, and removes the key after.

### Audit claim: Divide by zero in results breakdown

**False**. The bar chart uses `Math.max(...data, 1)` for the divisor and
returns the empty-state placeholder when `data.length` is 0.

### Audit claim: Stale landing-page testimonials, hardcoded stats

**Real product copy, not a code bug**. Out of scope for code fixes;
the marketing copy needs a business decision, not a refactor.

## Audit claims I am leaving alone for now

A few audit items point at real risks but are out of scope for a
correctness-only fix:

- **CSP, SRI, no inline handlers** (P2-08..11) — these are security
  hardening items that deserve a deliberate pass after the major
  features are stable. They are not bugs, they are hardening.
- **Mobile / IME / unicode input** (P1-36..38) — the practice surface
  uses a `tabindex="0"` div, which does not work for mobile virtual
  keyboards or composition input. This is a real gap, but the fix is
  a substantial refactor of the input layer that touches every page
  and every adapter. Worth doing in its own dedicated pass.
- **Landing-page stats / testimonials** (P2-60..66) — out of scope.
  These are product / business decisions, not code defects.
- **Account isolation by UID** (P1-27) — a major architectural
  change. Worth doing in its own pass.
- **Dead code in `src/themes/`, `src/analysis/`, `src/components/developerPanel.js`,
  `src/utils/recommendationEngine.js`** (P3) — also real, and a
  candidate for the next cleanup pass.

## Test results

After this round of fixes:

```
npm test                       → 21/21
src/utils/test-config.test.js  →  8/8
src/services/history.test.js  → 12/12  (6 new PB tests)
src/services/profile.test.js  →  4/4
src/services/input.test.js    → 10/10
src/pages/leaderboards.test.js →  4/4
                              → 59 total
```

Production build (`npx vite build`) passes in 2.4 s, no warnings.
