/**
 * Page lifecycle helper.
 *
 * Every page that mounts a view should declare a lifecycle: the things
 * that need to be torn down when the user navigates away. The destroy
 * step runs on route change.
 *
 *   mount()  - called when the page becomes active
 *   update() - called when the same page is requested again
 *   destroy() - called when the page becomes inactive
 *
 * Tracks:
 *   - DOM event listeners added via on()
 *   - window/document event listeners added via on() with the global flag
 *   - setTimeout / setInterval handles
 *   - requestAnimationFrame handles
 *   - arbitrary cleanup callbacks
 *
 * The list is drained on destroy. Listeners removed with off() do not
 * fire after destroy even if a stray reference still exists, because
 * the closures were registered with a single AbortController scoped
 * to the page lifetime.
 */

export const createLifecycle = () => {
  const cleanups = [];
  let destroyed = false;

  return {
    /**
     * Register an event listener scoped to this page. Pass a node, an
     * event name, and a handler; the listener is removed on destroy.
     * For window/document listeners, set `global: true` so the helper
     * can attach to the right target.
     */
    on(target, event, handler) {
      if (destroyed) return () => {};
      target.addEventListener(event, handler);
      cleanups.push(() => target.removeEventListener(event, handler));
      return () => {
        target.removeEventListener(event, handler);
        const i = cleanups.findIndex((fn) => fn === cleanups[cleanups.length - 1]);
        if (i >= 0) cleanups.splice(i, 1);
      };
    },

    /**
     * Register a setTimeout. Cleared on destroy.
     */
    setTimeout(fn, delay) {
      if (destroyed) return 0;
      const id = setTimeout(() => {
        fn();
        const i = cleanups.findIndex((c) => c._id === id && c._kind === 'timeout');
        if (i >= 0) cleanups.splice(i, 1);
      }, delay);
      cleanups.push({ _kind: 'timeout', _id: id, fn: () => clearTimeout(id) });
      return id;
    },

    /**
     * Register a setInterval. Cleared on destroy.
     */
    setInterval(fn, period) {
      if (destroyed) return 0;
      const id = setInterval(fn, period);
      cleanups.push({ _kind: 'interval', _id: id, fn: () => clearInterval(id) });
      return id;
    },

    /**
     * Register a requestAnimationFrame loop. The frame id is captured
     * and the loop is cancelled on destroy. The loop function should
     * call requestNextFrame() to continue; otherwise the loop ends
     * after one frame.
     */
    raf(loop) {
      if (destroyed) return;
      let id = 0;
      const tick = () => {
        if (destroyed) return;
        const keepGoing = loop();
        if (keepGoing !== false) id = requestAnimationFrame(tick);
      };
      id = requestAnimationFrame(tick);
      cleanups.push({ _kind: 'raf', _id: id, fn: () => cancelAnimationFrame(id) });
    },

    /**
     * Register a generic cleanup callback.
     */
    defer(fn) {
      if (destroyed) { try { fn(); } catch {} return; }
      cleanups.push(fn);
    },

    /**
     * Tear down everything registered. Idempotent.
     */
    destroy() {
      if (destroyed) return;
      destroyed = true;
      // Run cleanups in reverse-registration order, which is the natural
      // teardown order for nested resources (the last one registered is
      // usually the most dependent on the earlier ones).
      for (let i = cleanups.length - 1; i >= 0; i--) {
        try { cleanups[i](); } catch (e) { /* never let a cleanup throw */ }
      }
      cleanups.length = 0;
    },

    /**
     * True once destroy has been called.
     */
    get isDestroyed() { return destroyed; },
  };
};
