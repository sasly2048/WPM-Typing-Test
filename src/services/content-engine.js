/**
 * Session-locking.
 *
 * The practice page uses this to prevent the user from re-rolling the
 * text mid-session (e.g. by changing the mode or duration while
 * typing). Locked sessions ignore configuration changes.
 *
 * This used to be bundled with content-selection logic (a `ContentEngine`
 * with a `getNextContent` method and a history queue), but the
 * selection responsibility moved to `text-provider.js` and the history
 * queue was never used. The class is now just a stateful lock.
 */

export class ContentEngine {
  constructor() {
    this._locked = false;
  }

  lockSession() { this._locked = true; }
  unlockSession() { this._locked = false; }
  get isSessionLocked() { return this._locked; }
}

export const contentEngine = new ContentEngine();
