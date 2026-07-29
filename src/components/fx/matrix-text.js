export function createMatrixText(element, finalString) {
  const chars = '01ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()_+-=[]{}|;:,.<>?';
  const fps = 30;
  let frame = 0;
  
  const queue = [];
  for (let i = 0; i < finalString.length; i++) {
    const to = finalString[i];
    const start = Math.floor(Math.random() * 10);
    const end = start + Math.floor(Math.random() * 30) + 15; // Resolves over ~1.5s
    queue.push({ to, start, end });
  }

  let animationFrame;
  let lastTime = 0;
  const frameInterval = 1000 / fps;

  function update(time) {
    if (!lastTime) lastTime = time;
    const deltaTime = time - lastTime;
    
    if (deltaTime >= frameInterval) {
      let output = '';
      let complete = 0;
      
      for (let i = 0; i < queue.length; i++) {
        let { to, start, end } = queue[i];
        if (frame >= end) {
          complete++;
          output += to;
        } else if (frame >= start) {
          if (to === ' ' || to === '\\n') {
            output += to;
          } else {
            const char = chars[Math.floor(Math.random() * chars.length)];
            output += char;
          }
        } else {
          output += (to === ' ' || to === '\\n') ? to : chars[Math.floor(Math.random() * chars.length)];
        }
      }

      element.textContent = output;
      frame++;
      lastTime = time - (deltaTime % frameInterval);

      if (complete === queue.length) {
        cancelAnimationFrame(animationFrame);
        return;
      }
    }
    
    animationFrame = requestAnimationFrame(update);
  }

  animationFrame = requestAnimationFrame(update);
  
  return {
    destroy: () => {
      cancelAnimationFrame(animationFrame);
      element.textContent = finalString; // Ensure it resolves to the final string on destroy
    }
  };
}
