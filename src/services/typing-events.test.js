/**
 * Self-checks for the typing event model and achievement evaluator.
 *
 * Run with:  node src/services/typing-events.test.js
 */

import assert from 'node:assert/strict';

if (typeof localStorage === 'undefined') {
  globalThis.localStorage = {
    _d: {},
    getItem(k) { return this._d[k] ?? null; },
    setItem(k, v) { this._d[k] = String(v); },
    removeItem(k) { delete this._d[k]; },
    key(i) { return Object.keys(this._d)[i] ?? null; },
    get length() { return Object.keys(this._d).length; },
    clear() { this._d = {}; },
  };
} else {
  localStorage.clear();
}

const {
  TYPING_EVENT, sessionCompletedEvent, milestoneReachedEvent, createEventBus,
} = await import('./typing-events.js');
const achievements = await import('./achievements.js');

const checks = [];
const check = (name, fn) => checks.push([name, fn]);

check('sessionCompletedEvent flattens session fields into the event', () => {
  const session = {
    wpm: 60, rawWpm: 70, accuracy: 95, errors: 3, timestamp: 1000,
    mode: 'time', difficulty: 'medium', totalStrokes: 250, longestStreak: 50,
  };
  const ev = sessionCompletedEvent(session, { duration: 30, wordCount: 0 });
  assert.equal(ev.type, TYPING_EVENT.SESSION_COMPLETED);
  assert.equal(ev.wpm, 60);
  assert.equal(ev.mode, 'time');
  assert.equal(ev.duration, 30);
  assert.equal(ev.timestamp, 1000);
});

check('createEventBus delivers every published event to subscribers', () => {
  const bus = createEventBus();
  const received = [];
  const off = bus.subscribe((ev) => received.push(ev));
  bus.publish({ type: 'a' });
  bus.publish({ type: 'b' });
  off();
  bus.publish({ type: 'c' });
  assert.deepEqual(received.map((e) => e.type), ['a', 'b']);
});

check('createEventBus: a subscriber that throws does not break others', () => {
  const bus = createEventBus();
  const seen = [];
  bus.subscribe(() => { throw new Error('boom'); });
  bus.subscribe((ev) => seen.push(ev));
  bus.publish({ type: 'safe' });
  assert.deepEqual(seen.map((e) => e.type), ['safe']);
});

check('milestoneReachedEvent has kind, value, mode', () => {
  const ev = milestoneReachedEvent(80, 'time');
  assert.equal(ev.type, TYPING_EVENT.MILESTONE_REACHED);
  assert.equal(ev.kind, 'wpm');
  assert.equal(ev.value, 80);
  assert.equal(ev.mode, 'time');
});

check('achievements: speed_demon_50 unlocks at wpm >= 50', async () => {
  localStorage.clear();
  await achievements.publishSessionCompleted({ wpm: 50, accuracy: 95, mode: 'time', timestamp: 1 });
  const progress = await achievements.getProgress({});
  const ach = progress.find((a) => a.id === 'speed_demon_50');
  assert.equal(ach.isUnlocked, true);
});

check('achievements: speed_demon_50 does not unlock at wpm 49', async () => {
  localStorage.clear();
  await achievements.publishSessionCompleted({ wpm: 49, accuracy: 95, mode: 'time', timestamp: 1 });
  const progress = await achievements.getProgress({});
  const ach = progress.find((a) => a.id === 'speed_demon_50');
  assert.equal(ach.isUnlocked, false);
});

check('achievements: distinct_languages unlocks with 5 different langs', async () => {
  localStorage.clear();
  const langs = ['javascript', 'python', 'rust', 'go', 'java'];
  for (let i = 0; i < langs.length; i++) {
    await achievements.publishSessionCompleted({ wpm: 40, accuracy: 90, mode: 'code', language: langs[i], timestamp: i + 1 });
  }
  const progress = await achievements.getProgress({});
  const ach = progress.find((a) => a.id === 'languages_5');
  assert.equal(ach.isUnlocked, true);
});

check('achievements: subscribe receives published events', async () => {
  localStorage.clear();
  const seen = [];
  const off = achievements.subscribe((ev) => seen.push(ev));
  await achievements.publishSessionCompleted({ wpm: 80, accuracy: 95, mode: 'time', timestamp: 1 });
  await achievements.publishMilestone(80, 'time');
  off();
  await achievements.publishSessionCompleted({ wpm: 100, accuracy: 95, mode: 'time', timestamp: 2 });
  assert.equal(seen.length, 2, 'received the first two but not the post-unsubscribe one');
  assert.equal(seen[0].type, TYPING_EVENT.SESSION_COMPLETED);
  assert.equal(seen[1].type, TYPING_EVENT.MILESTONE_REACHED);
});

let failed = 0;
for (const [name, fn] of checks) {
  try {
    await fn();
    console.log(`  ok  ${name}`);
  } catch (err) {
    failed++;
    console.error(`FAIL  ${name}\n      ${err.message}`);
  }
}
console.log(`\n${checks.length - failed}/${checks.length} passed`);
process.exit(failed ? 1 : 0);
