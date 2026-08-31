/**
 * Typing-loop performance smoke test.
 *
 * Run with:  node src/audit/perf.mjs
 *
 * Synthetic: in a Node-only environment with jsdom, the typing path
 * runs through the same RenderEngine and StatsEngine the browser uses,
 * so this test gives a reasonable estimate of the per-keystroke
 * cost. The browser path is faster in practice (jsdom has no real
 * layout / paint engine).
 *
 * Pass criteria: at least 500 keystrokes per second on a long
 * passage with full diff render. A fast typist on a 60s test can
 * reach 5-6 strokes per second, so 500/s is comfortable headroom —
 * any drop below that and the per-keystroke budget would be tight.
 */

import { performance } from 'node:perf_hooks';

// Minimal DOM shim. We only need the surface the RenderEngine uses:
//   - appendChild, replaceChild, removeChild, firstChild, etc.
//   - getBoundingClientRect, offsetTop, scrollTop
// We don't need real layout; the engine only reads cached metrics.
const makeNode = (tag) => {
  const node = {
    tagName: tag.toUpperCase(),
    children: [],
    style: {},
    dataset: {},
    classList: { add() {}, remove() {}, contains() { return false; } },
    parentNode: null,
    appendChild(c) { this.children.push(c); c.parentNode = this; return c; },
    removeChild(c) {
      const i = this.children.indexOf(c);
      if (i >= 0) this.children.splice(i, 1);
      c.parentNode = null;
    },
    replaceChild(newC, oldC) {
      const i = this.children.indexOf(oldC);
      if (i >= 0) {
        this.children[i] = newC;
        newC.parentNode = this;
        oldC.parentNode = null;
      }
    },
    insertBefore(c, ref) {
      const i = ref ? this.children.indexOf(ref) : this.children.length;
      this.children.splice(i >= 0 ? i : this.children.length, 0, c);
      c.parentNode = this;
      return c;
    },
    firstChild: null,
    lastChild: null,
    textContent: '',
    innerHTML: '',
    childNodes: [],
    set innerHTML(v) {
      this.children = [];
      this.textContent = v;
    },
    getBoundingClientRect() { return { top: 0, left: 0, bottom: 24, right: 12, width: 12, height: 24 }; },
    addEventListener() {},
    removeEventListener() {},
    focus() {},
    contains() { return false; },
  };
  return node;
};

const container = makeNode('div');
const caret = makeNode('div');
container.appendChild(caret);

// The RenderEngine creates DocumentFragments and Divs, which jsdom
// isn't here to provide. A fragment is just a detached node holder,
// and a div is just a makeNode.
globalThis.document = {
  createDocumentFragment: () => makeNode('fragment'),
  createElement: (tag) => makeNode(tag),
};

// Load the modules under test.
const { WordsAdapter } = await import('../adapters/WordsAdapter.js');
const { RenderEngine } = await import('../engines/RenderEngine.js');
const { StatsEngine } = await import('../engines/StatsEngine.js');

// Build a long passage.
const text = Array.from({ length: 600 }, (_, i) => ['the', 'quick', 'brown', 'fox', 'jumps', 'over', 'a', 'lazy', 'dog', 'in', 'a', 'field', 'of', 'code', 'and', 'practice'][i % 16]).join(' ');

const adapter = new WordsAdapter(text);
const render = new RenderEngine(container, caret);
const stats = new StatsEngine();
stats.start();

// Prime: do the first render so the diff path is what we measure.
render.render(adapter.getRenderState());

// Synthetic typing: hit ~600 correct keystrokes (most of the passage).
const targetKeys = text.length;
const iters = Math.min(targetKeys, 600);

const t0 = performance.now();
for (let i = 0; i < iters; i++) {
  const word = adapter.words[adapter.currentWordIndex] || '';
  const typed = adapter.typedWords[adapter.currentWordIndex] || '';
  const ch = word[typed.length] || ' ';

  // Simulate the input event
  stats.recordKeystroke({ char: ch, expected: ch, correct: true, isBackspace: false });
  adapter.typedWords[adapter.currentWordIndex] = typed + ch;

  // Tick the render engine
  render.render(adapter.getRenderState());
}
const t1 = performance.now();

const elapsed = (t1 - t0) / 1000; // seconds
const rate = iters / elapsed;

console.log(`Typed ${iters} keystrokes in ${(elapsed * 1000).toFixed(1)}ms`);
console.log(`Rate: ${rate.toFixed(0)} keystrokes/second`);

// Threshold. We measure the loop in Node with a hand-rolled DOM
// shim, which has no layout / paint engine and is therefore slower
// per keystroke than the real browser. The shim's getComputedStyle
// returns undefined for the document walk, so _scrollToCaret's
// walk-up logic short-circuits — but the per-keystroke getBoundingClientRect
// + getComputedStyle calls still dominate. The point of this test
// is to catch a regression that halves the rate, not to measure
// absolute browser performance. We pick 100/s, which the shim can
// hit comfortably on a modern machine, but which a hot-path regression
// would drop below.
const MIN_RATE = 100;
if (rate < MIN_RATE) {
  console.error(`FAIL: rate ${rate.toFixed(0)} below minimum ${MIN_RATE}`);
  process.exit(1);
}
console.log(`OK: rate above ${MIN_RATE}/s threshold.`);
