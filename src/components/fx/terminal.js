import { createElement } from '../../utils/dom.js';

/**
 * A minimal macOS-terminal-style loading sequence: a window with traffic-light
 * chrome, a typed command line, and status lines that appear one by one.
 * Used for brief, purposeful transitions (e.g. switching into Developer mode) —
 * not decoration, a real "here's what's happening" readout.
 *
 * @param {Object} opts
 * @param {string} opts.command - The command line shown at the top, typed out.
 * @param {string[]} opts.lines - Status lines revealed one at a time after the command types.
 * @param {number} [opts.charDelay=18] - ms between typed characters.
 * @param {number} [opts.lineDelay=140] - ms between revealed status lines.
 * @param {Function} [opts.onComplete] - called once all lines have appeared.
 * @returns {{ el: HTMLElement, destroy: Function }}
 */
export function createTerminal({ command, lines = [], charDelay = 18, lineDelay = 140, onComplete } = {}) {
  const el = createElement('div', { className: 'kf-terminal', role: 'status', 'aria-live': 'polite' });

  const chrome = createElement('div', { className: 'kf-terminal-chrome' }, [
    createElement('span', { className: 'kf-terminal-dot kf-terminal-dot-red' }),
    createElement('span', { className: 'kf-terminal-dot kf-terminal-dot-yellow' }),
    createElement('span', { className: 'kf-terminal-dot kf-terminal-dot-green' }),
  ]);

  const body = createElement('div', { className: 'kf-terminal-body' });
  const commandLine = createElement('div', { className: 'kf-terminal-line kf-terminal-command' });
  const commandPrefix = createElement('span', { className: 'kf-terminal-prefix' }, ['> ']);
  const commandText = createElement('span', { className: 'kf-terminal-command-text' });
  const cursor = createElement('span', { className: 'kf-terminal-cursor' });
  commandLine.appendChild(commandPrefix);
  commandLine.appendChild(commandText);
  commandLine.appendChild(cursor);
  body.appendChild(commandLine);

  const linesContainer = createElement('div', { className: 'kf-terminal-lines' });
  body.appendChild(linesContainer);

  el.appendChild(chrome);
  el.appendChild(body);

  let timers = [];
  let destroyed = false;

  const schedule = (fn, delay) => {
    const id = setTimeout(() => {
      if (!destroyed) fn();
    }, delay);
    timers.push(id);
  };

  function typeCommand() {
    let i = 0;
    const step = () => {
      if (destroyed) return;
      if (i <= command.length) {
        commandText.textContent = command.slice(0, i);
        i++;
        schedule(step, charDelay);
      } else {
        schedule(revealLines, lineDelay);
      }
    };
    step();
  }

  function revealLines() {
    let i = 0;
    const step = () => {
      if (destroyed) return;
      if (i < lines.length) {
        const lineEl = createElement('div', { className: 'kf-terminal-line kf-terminal-status' }, [lines[i]]);
        linesContainer.appendChild(lineEl);
        i++;
        schedule(step, lineDelay);
      } else if (onComplete) {
        onComplete();
      }
    };
    step();
  }

  schedule(typeCommand, 100);

  return {
    el,
    destroy: () => {
      destroyed = true;
      timers.forEach(clearTimeout);
      timers = [];
    },
  };
}
