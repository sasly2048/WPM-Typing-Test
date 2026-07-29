export function createParticles(container, options = {}) {
  const canvas = document.createElement('canvas');
  canvas.style.position = 'absolute';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '0';
  
  // Make sure container has position relative/absolute
  if (getComputedStyle(container).position === 'static') {
    container.style.position = 'relative';
  }
  
  container.appendChild(canvas);
  
  const ctx = canvas.getContext('2d');
  let width, height;
  let animationFrameId;
  
  const particles = [];
  const particleCount = options.count || 110;
  
  // Colors: Silver and Ember
  const colors = [
    { r: 226, g: 226, b: 226 }, // #E2E2E2
    { r: 240, g: 169, b: 104 }  // #F0A968
  ];
  
  const resize = () => {
    width = container.clientWidth;
    height = container.clientHeight;
    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
  };
  
  const initParticles = () => {
    particles.length = 0;
    for (let i = 0; i < particleCount; i++) {
      const colorBase = colors[Math.random() > 0.8 ? 1 : 0]; // 20% ember, 80% silver
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.2, // very slow drift X
        vy: -Math.random() * 0.4 - 0.1, // slow drift upwards
        radius: Math.random() * 1.5 + 0.5,
        baseAlpha: Math.random() * 0.5 + 0.1,
        color: colorBase,
        pulseSpeed: Math.random() * 0.02 + 0.005,
        angle: Math.random() * Math.PI * 2
      });
    }
  };
  
  const render = () => {
    ctx.clearRect(0, 0, width, height);
    
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      
      // Move
      p.x += p.vx;
      p.y += p.vy;
      
      // Pulse alpha
      p.angle += p.pulseSpeed;
      const alpha = p.baseAlpha + Math.sin(p.angle) * 0.1;
      
      // Wrap around edges
      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;
      
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${Math.max(0, alpha)})`;
      ctx.fill();
    }
    
    animationFrameId = requestAnimationFrame(render);
  };
  
  window.addEventListener('resize', resize);
  
  // Start
  resize();
  initParticles();
  render();
  
  return {
    destroy: () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    }
  };
}
