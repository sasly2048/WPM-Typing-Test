export function createShinyText(text, options = {}) {
  const span = document.createElement('span');
  span.textContent = text;
  
  // Apply inline styles for the shimmering text effect
  span.style.display = 'inline-block';
  span.style.color = 'transparent';
  span.style.backgroundClip = 'text';
  span.style.webkitBackgroundClip = 'text';
  
  // Create the metallic gradient
  // It uses the base color, sweeps to a bright white/silver, and back to base
  const baseColor = options.baseColor || 'var(--color-text-secondary, #9A9A9A)';
  const shineColor = options.shineColor || '#FFFFFF';
  
  span.style.backgroundImage = `linear-gradient(
    120deg,
    ${baseColor} 0%,
    ${baseColor} 40%,
    ${shineColor} 50%,
    ${baseColor} 60%,
    ${baseColor} 100%
  )`;
  
  span.style.backgroundSize = '200% auto';
  
  // Use the animation defined in animations.css (shiny-sweep)
  // Or fallback to inline animation if not present
  const duration = options.duration || '3s';
  span.style.animation = `shiny-sweep ${duration} linear infinite`;
  
  if (options.className) {
    span.className = options.className;
  }
  
  return span;
}
