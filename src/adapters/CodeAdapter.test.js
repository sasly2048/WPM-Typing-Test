/**
 * Self-checks for the CodeAdapter.
 *
 * Run with:  node src/adapters/CodeAdapter.test.js
 */

import assert from 'node:assert/strict';
import { CodeAdapter, classifyChar, BRACKETS } from './CodeAdapter.js';

const checks = [];
const check = (name, fn) => checks.push([name, fn]);

const type = (adapter, ch) => {
  return adapter.processInput({
    key: ch,
    isBackspace: false,
    isSpace: false,
    isEnter: ch === 'Enter',
  });
};

const backspace = (adapter) => {
  return adapter.processInput({
    key: 'Backspace',
    isBackspace: true,
    isSpace: false,
  });
};

const enter = (adapter) => type(adapter, 'Enter');
const tab = (adapter) => {
  return adapter.processInput({ key: 'Tab', isBackspace: false, isSpace: false, originalEvent: { preventDefault: () => {} } });
};

check('classifyChar maps characters to their analysis class', () => {
  assert.equal(classifyChar('a'), 'letter');
  assert.equal(classifyChar('Z'), 'letter');
  assert.equal(classifyChar('_'), 'letter');
  assert.equal(classifyChar('5'), 'digit');
  assert.equal(classifyChar(' '), 'whitespace');
  assert.equal(classifyChar('\t'), 'whitespace');
  assert.equal(classifyChar('\n'), 'newline');
  assert.equal(classifyChar('('), 'bracket');
  assert.equal(classifyChar('}'), 'bracket');
  assert.equal(classifyChar(';'), 'symbol');
  assert.equal(classifyChar(null), 'unknown');
});

check('BRACKETS lists the four pairs we care about', () => {
  assert.equal(BRACKETS['('], ')');
  assert.equal(BRACKETS['['], ']');
  assert.equal(BRACKETS['{'], '}');
  assert.equal(BRACKETS['<'], '>');
});

check('typing a single character increments the correct class', () => {
  const a = new CodeAdapter('let x = 1');
  type(a, 'l');
  type(a, 'e');
  type(a, 't');
  assert.equal(a.classStats.letter.correct, 3, 'three letters typed');
  assert.equal(a.classStats.letter.total, 3);
  assert.equal(a.classStats.whitespace.correct, 0);
});

check('typing a wrong character counts as an error in the right class', () => {
  const a = new CodeAdapter('a');
  type(a, 'b');
  assert.equal(a.classStats.letter.correct, 0);
  assert.equal(a.classStats.letter.total, 1);
});

check('digits go into the digit class', () => {
  const a = new CodeAdapter('x = 42');
  // Type 'x' ' ' '=' ' ' '4' '2'
  type(a, 'x'); type(a, ' '); type(a, '='); type(a, ' '); type(a, '4'); type(a, '2');
  assert.equal(a.classStats.digit.correct, 2);
  assert.equal(a.classStats.whitespace.correct, 2);
  assert.equal(a.classStats.symbol.correct, 1, "= is a symbol");
});

check('brackets are tracked as matched/mismatched', () => {
  const a = new CodeAdapter('()');
  type(a, '(');
  type(a, ')');
  assert.equal(a.bracketStats.matched, 1);
  assert.equal(a.bracketStats.mismatched, 0);
});

check('mismatched brackets: opening { followed by closing )', () => {
  const a = new CodeAdapter('{})');
  type(a, '{');
  type(a, ')');
  assert.equal(a.bracketStats.mismatched, 1, ') was expected to close }');
});

check('Enter auto-indents to match the source line', () => {
  const a = new CodeAdapter('function f() {\n    return 1;\n}');
  // Type through to just before the indented line
  for (const ch of 'function f() {') type(a, ch);
  enter(a);
  // The next line in the source starts with 4 spaces. The user
  // should not have to type them — auto-indent puts them there.
  assert.equal(a.typedLines[1], '    ', 'auto-indent copied 4 spaces');
  assert.equal(a.metrics.autoIndents, 1);
});

check('Tab inserts the configured indent unit', () => {
  const a = new CodeAdapter('  ');  // 2 spaces already; Tab adds 4 more
  type(a, ' ');
  type(a, ' ');
  // After two manual spaces, currentLine has 2 spaces. Tab adds 4 more.
  tab(a);
  assert.equal(a.typedLines[0], '      ', 'two manual + 4-tab = 6 spaces');
});

check('Tab respects a custom indent size', () => {
  const a = new CodeAdapter('', { indentSize: 2 });
  tab(a);
  assert.equal(a.typedLines[0], '  ', '2-space tab');
});

check('backspace deletes a character and tracks the line index', () => {
  const a = new CodeAdapter('ab\ncd');
  type(a, 'a');
  type(a, 'b');
  enter(a);
  type(a, 'c');
  backspace(a);
  assert.equal(a.typedLines[1], '');
});

check('passageFinished is true when every line is fully typed', () => {
  const a = new CodeAdapter('a\nb');
  type(a, 'a');
  enter(a);
  type(a, 'b');
  assert.equal(a.passageFinished(), true);
});

check('passageFinished is false when a line is incomplete', () => {
  const a = new CodeAdapter('a\nb');
  type(a, 'a');
  enter(a);
  // Haven't typed 'b' yet
  assert.equal(a.passageFinished(), false);
});

check('getRenderState: correct chars are marked correct, extras are extra', () => {
  const a = new CodeAdapter('hi');
  type(a, 'h');
  type(a, 'i');
  type(a, '!');
  const render = a.getRenderState();
  assert.equal(render[0][0].status, 'correct', 'h is correct');
  assert.equal(render[0][1].status, 'correct', 'i is correct');
  assert.equal(render[0][2].status, 'extra incorrect', '! is an extra');
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
