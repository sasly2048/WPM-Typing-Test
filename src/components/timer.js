import { createElement } from '../utils/dom.js';

export function createTimer({ duration = 60, mode = 'time', onTick, onComplete }) {
  const container = createElement('div', { className: 'timer-container' });
  
  // SVG Ring
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.classList.add('timer-ring');
  
  const circleBg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  circleBg.setAttribute('cx', '50');
  circleBg.setAttribute('cy', '50');
  circleBg.setAttribute('r', '45');
  circleBg.classList.add('timer-ring-bg');
  
  const circleProgress = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  circleProgress.setAttribute('cx', '50');
  circleProgress.setAttribute('cy', '50');
  circleProgress.setAttribute('r', '45');
  circleProgress.classList.add('timer-ring-progress');
  
  const circumference = 2 * Math.PI * 45;
  circleProgress.style.strokeDasharray = circumference;
  circleProgress.style.strokeDashoffset = 0;
  
  svg.appendChild(circleBg);
  svg.appendChild(circleProgress);
  
  const textDisplay = createElement('div', { className: 'timer-text', textContent: mode === 'time' ? duration : '0' });
  
  container.appendChild(svg);
  container.appendChild(textDisplay);
  
  let time = mode === 'time' ? duration : 0;
  let interval = null;
  let isRunning = false;
  
  const updateDisplay = () => {
    textDisplay.textContent = time;
    if (mode === 'time') {
      const offset = circumference - (time / duration) * circumference;
      circleProgress.style.strokeDashoffset = offset;
      
      if (time <= 5) {
        circleProgress.style.stroke = 'var(--timer-danger, #ef4444)';
      } else if (time <= 10) {
        circleProgress.style.stroke = 'var(--timer-warning, #f59e0b)';
      } else {
        circleProgress.style.stroke = 'var(--timer-normal, #a855f7)';
      }
    }
  };
  
  const start = () => {
    if (isRunning) return;
    isRunning = true;
    let lastTime = performance.now();
    interval = setInterval(() => {
      const now = performance.now();
      const delta = now - lastTime;
      if (delta >= 1000) {
        lastTime = now;
      if (mode === 'time') {
        time--;
        if (time <= 0) {
          time = 0;
          pause();
          if (onComplete) onComplete();
        }
      } else {
        time++;
      }
      updateDisplay();
      if (onTick) onTick(time);
      }
    }, 100);
  };
  
  const pause = () => {
    isRunning = false;
    clearInterval(interval);
  };
  
  const reset = (newDuration) => {
    pause();
    if (newDuration !== undefined) duration = newDuration;
    time = mode === 'time' ? duration : 0;
    circleProgress.style.stroke = 'var(--timer-normal, #a855f7)';
    updateDisplay();
  };
  
  const getElapsed = () => mode === 'time' ? duration - time : time;
  const getRemaining = () => mode === 'time' ? time : 0;
  
  updateDisplay();
  
  return { el: container, start, pause, reset, getElapsed, getRemaining };
}
