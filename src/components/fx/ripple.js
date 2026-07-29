export function createRipple(container) {
  const computedStyle = window.getComputedStyle(container);
  if (computedStyle.position === 'static') {
    container.style.position = 'relative';
  }
  // Optional overflow setting if ripples should be contained, 
  // but depends on the visual requirement. Usually ripples are contained.
  // container.style.overflow = 'hidden'; 

  let intervalId;
  const ripples = [];

  if (!document.getElementById('ripple-keyframes')) {
    const style = document.createElement('style');
    style.id = 'ripple-keyframes';
    style.textContent = `
      @keyframes sonar-pulse {
        0% {
          transform: scale(0.5);
          opacity: 0.6;
        }
        100% {
          transform: scale(4);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function spawnRipple() {
    const ripple = document.createElement('div');
    ripple.style.position = 'absolute';
    // Center it
    ripple.style.left = 'calc(50% - 25px)';
    ripple.style.top = 'calc(50% - 25px)';
    ripple.style.width = '50px';
    ripple.style.height = '50px';
    ripple.style.borderRadius = '50%';
    ripple.style.border = '2px solid rgba(240, 169, 104, 0.4)'; // Ember color
    ripple.style.animation = 'sonar-pulse 2.5s cubic-bezier(0.1, 0.8, 0.3, 1) forwards';
    ripple.style.pointerEvents = 'none';
    ripple.style.zIndex = '0';
    
    container.appendChild(ripple);
    ripples.push(ripple);

    setTimeout(() => {
      if (ripple.parentNode) {
        ripple.parentNode.removeChild(ripple);
      }
      const index = ripples.indexOf(ripple);
      if (index > -1) ripples.splice(index, 1);
    }, 2500);
  }

  intervalId = setInterval(spawnRipple, 1200);
  spawnRipple(); // Spawn first immediately

  return {
    destroy: () => {
      clearInterval(intervalId);
      ripples.forEach(r => {
        if (r.parentNode) r.parentNode.removeChild(r);
      });
      ripples.length = 0;
    }
  };
}
