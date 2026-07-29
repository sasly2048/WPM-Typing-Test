import { createElement } from '../utils/dom.js';

export function createLineChart({ data = [], width = 400, height = 200, label = 'Data' }) {
  const styles = getComputedStyle(document.documentElement);
  const color = styles.getPropertyValue('--color-chart-wpm').trim() || '#a855f7';
  const container = createElement('div', { className: 'chart-container' });
  const canvas = createElement('canvas', { width, height });
  container.appendChild(canvas);
  
  const ctx = canvas.getContext('2d');
  
  if (data.length === 0) return container;
  
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  const draw = () => {
    ctx.clearRect(0, 0, width, height);
    
    ctx.beginPath();
    data.forEach((val, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * (height * 0.8) - (height * 0.1);
      
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.fillStyle = `${color}33`; // 20% opacity
    ctx.fill();
  };
  
  requestAnimationFrame(draw);
  
  return container;
}

export function createBarChart({ data = [], width = 400, height = 200, label = 'Data' }) {
  const styles = getComputedStyle(document.documentElement);
  const color = styles.getPropertyValue('--color-chart-wpm').trim() || '#3b82f6';
  const container = createElement('div', { className: 'chart-container' });
  const canvas = createElement('canvas', { width, height });
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  
  if (data.length === 0) return container;
  const max = Math.max(...data);
  
  const draw = () => {
    ctx.clearRect(0, 0, width, height);
    const barWidth = width / data.length - 2;
    
    data.forEach((val, i) => {
      const barHeight = (val / max) * height;
      const x = i * (width / data.length) + 1;
      const y = height - barHeight;
      
      ctx.fillStyle = color;
      ctx.fillRect(x, y, barWidth, barHeight);
    });
  };
  
  requestAnimationFrame(draw);
  return container;
}

export function createRingChart({ value = 0, max = 100, width = 150, height = 150, label = 'Accuracy' }) {
  const styles = getComputedStyle(document.documentElement);
  const color = styles.getPropertyValue('--color-success').trim() || '#10b981';
  const bgColor = styles.getPropertyValue('--color-bg-tertiary').trim() || '#333';
  const textColor = styles.getPropertyValue('--color-text-primary').trim() || '#fff';
  
  const container = createElement('div', { className: 'chart-container' });
  const canvas = createElement('canvas', { width, height });
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(cx, cy) - 15;
  
  const draw = () => {
    ctx.clearRect(0, 0, width, height);
    
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = bgColor;
    ctx.lineWidth = 10;
    ctx.stroke();
    
    const pct = value / max;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, -Math.PI/2, (2 * Math.PI * pct) - Math.PI/2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.stroke();
    
    ctx.fillStyle = textColor;
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${value}%`, cx, cy);
  };
  
  requestAnimationFrame(draw);
  return container;
}
