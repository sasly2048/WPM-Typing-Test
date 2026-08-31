/**
 * Self-checks for the unified completion policy.
 *
 * Time mode is the only mode where the timer is the sole completion
 * authority. The tests below pin the contract:
 *
 *   - time:    never ends on passage completion
 *   - time:    ends on clock expiry
 *   - words:   ends on word count reached, even mid-passage
 *   - words:   ends on passage completion if the buffer ended exactly
 *              on the target count
 *   - prose/code/custom: end on passage completion
 *
 * Run:  node src/services/completion.test.js
 */

import assert from 'node:assert/strict';
import { createCompletionPolicy, COMPLETION } from './completion.js';

const checks = [];
const check = (name, fn) => checks.push([name, fn]);

// A fake adapter that reports whatever the test sets it to.
const makeAdapter = () => {
  let finished = false;
  return {
    setFinished(v) { finished = v; },
    passageFinished() { return finished; },
  };
};

check('time mode never ends on passage completion', () => {
  const adapter = makeAdapter();
  let expired = false;
  const policy = createCompletionPolicy(COMPLETION.TIME, {
    adapter,
    timerExpired: () => expired,
    targetWordCount: 50,
    typedWordCount: () => 50,
  });
  adapter.setFinished(true);
  assert.equal(policy.isComplete(), false, 'time mode should not end on passage done');
});

check('time mode ends on clock expiry', () => {
  const adapter = makeAdapter();
  let expired = false;
  const policy = createCompletionPolicy(COMPLETION.TIME, {
    adapter,
    timerExpired: () => expired,
    targetWordCount: 50,
    typedWordCount: () => 5,
  });
  expired = true;
  assert.equal(policy.isComplete(), true, 'time mode should end on clock expiry');
});

check('time mode ignores word count entirely', () => {
  const adapter = makeAdapter();
  let expired = false;
  const policy = createCompletionPolicy(COMPLETION.TIME, {
    adapter,
    timerExpired: () => expired,
    targetWordCount: 50,
    typedWordCount: () => 50,
  });
  // Even with the target word count reached, the timer is the only
  // authority. A fast typist who hits the end of a short passage
  // before the clock runs out continues typing into nothing.
  assert.equal(policy.isComplete(), false);
});

check('words mode ends on word count even mid-passage', () => {
  const adapter = makeAdapter();
  adapter.setFinished(false);
  const policy = createCompletionPolicy(COMPLETION.WORDS, {
    adapter,
    timerExpired: () => false,
    targetWordCount: 50,
    typedWordCount: () => 50,
  });
  assert.equal(policy.isComplete(), true, 'words mode should end on count reached');
});

check('words mode ends on passage completion as a fallback', () => {
  const adapter = makeAdapter();
  adapter.setFinished(true);
  const policy = createCompletionPolicy(COMPLETION.WORDS, {
    adapter,
    timerExpired: () => false,
    targetWordCount: 50,
    typedWordCount: () => 30,
  });
  assert.equal(policy.isComplete(), true, 'words mode should end if passage is also done');
});

check('prose mode ends only on passage completion', () => {
  const adapter = makeAdapter();
  adapter.setFinished(false);
  const policy = createCompletionPolicy(COMPLETION.PARAGRAPH, {
    adapter,
    timerExpired: () => true, // timer state must be ignored
    targetWordCount: 100,
    typedWordCount: () => 100, // count must be ignored too
  });
  assert.equal(policy.isComplete(), false);
  adapter.setFinished(true);
  assert.equal(policy.isComplete(), true);
});

check('code mode ends only on passage completion', () => {
  const adapter = makeAdapter();
  adapter.setFinished(false);
  const policy = createCompletionPolicy(COMPLETION.CODE, {
    adapter,
    timerExpired: () => true,
    targetWordCount: 0,
    typedWordCount: () => 0,
  });
  assert.equal(policy.isComplete(), false);
  adapter.setFinished(true);
  assert.equal(policy.isComplete(), true);
});

check('custom mode ends only on passage completion', () => {
  const adapter = makeAdapter();
  adapter.setFinished(false);
  const policy = createCompletionPolicy(COMPLETION.CUSTOM, {
    adapter,
    timerExpired: () => true,
    targetWordCount: 0,
    typedWordCount: () => 0,
  });
  assert.equal(policy.isComplete(), false);
  adapter.setFinished(true);
  assert.equal(policy.isComplete(), true);
});

check('words mode is safe when the adapter is missing', () => {
  const policy = createCompletionPolicy(COMPLETION.WORDS, {
    adapter: null,
    timerExpired: () => false,
    targetWordCount: 5,
    typedWordCount: () => 5,
  });
  assert.equal(policy.isComplete(), true, 'count authority should still apply');
});

let failed = 0;
for (const [name, fn] of checks) {
  try {
    fn();
    console.log(`  ok  ${name}`);
  } catch (err) {
    failed++;
    console.error(`FAIL  ${name}\n      ${err.message}`);
  }
}
console.log(`\n${checks.length - failed}/${checks.length} passed`);
process.exit(failed ? 1 : 0);
