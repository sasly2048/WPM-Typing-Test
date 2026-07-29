const fs = require('fs');

// 3. landing.js
let landing = fs.readFileSync('src/pages/landing.js', 'utf8');
landing = landing.replace(/import \{ createParticles \} from '\.\.\/components\/fx\/particles\.js';/g, '// import { createParticles } from \'../components/fx/particles.js\';');
landing = landing.replace(/particlesFx = createParticles\(heroContainer, \{ count: 80 \}\);/g, '// particlesFx = createParticles(heroContainer, { count: 80 });');
landing = landing.replace(/if \(particlesFx\) \{/g, '// if (particlesFx) {');
landing = landing.replace(/particlesFx\.destroy\(\);/g, '// particlesFx.destroy();');
landing = landing.replace(/particlesFx = null;/g, '// particlesFx = null;');
landing = landing.replace(/\.ambient-blur \{[\s\S]*?\}/g, '.ambient-blur { display: none; }');
landing = landing.replace(/animation: glitch 1s infinite;/g, '');
landing = landing.replace(/'#1c1c22'/g, '"var(--color-bg-tertiary)"');
landing = landing.replace(/'#F0A968'/g, '"var(--color-primary)"');
landing = landing.replace(/'#34D399'/g, '"var(--color-success)"');
landing = landing.replace(/'#2a2a35'/g, '"var(--color-bg-tertiary)"');
landing = landing.replace(/'#4c1d95'/g, '"var(--color-accent)"');
fs.writeFileSync('src/pages/landing.js', landing);

// 4. dashboard.js
let dashboard = fs.readFileSync('src/pages/dashboard.js', 'utf8');
dashboard = dashboard.replace(/, #e2e2e2/g, '');
dashboard = dashboard.replace(/, #f0a968/g, '');
dashboard = dashboard.replace(/, #9a9a9a/g, '');
dashboard = dashboard.replace(/, #13131A/g, '');
dashboard = dashboard.replace(/#fff/g, 'var(--color-text-primary)');
dashboard = dashboard.replace(/#34d399/g, 'var(--color-success)');
dashboard = dashboard.replace(/#60a5fa/g, 'var(--color-info)');
dashboard = dashboard.replace(/#f472b6/g, 'var(--color-accent)');
dashboard = dashboard.replace(/#ff3b30/g, 'var(--color-error)');
fs.writeFileSync('src/pages/dashboard.js', dashboard);

// 5. results.js
let results = fs.readFileSync('src/pages/results.js', 'utf8');
results = results.replace(/, #10b981/g, '');
results = results.replace(/, #ef4444/g, '');
results = results.replace(/, #f59e0b/g, '');
results = results.replace(/#f59e0b/g, 'var(--accent-color)');
fs.writeFileSync('src/pages/results.js', results);

// 6. developer.js
let developer = fs.readFileSync('src/pages/developer.js', 'utf8');
developer = developer.replace(/, #060608/g, '');
developer = developer.replace(/, #0D0D12/g, '');
developer = developer.replace(/, #f0a968/g, '');
developer = developer.replace(/, #34d399/g, '');
developer = developer.replace(/, #9a9a9a/g, '');
developer = developer.replace(/, #666/g, '');
developer = developer.replace(/, #444/g, '');
developer = developer.replace(/#e2e2e2/g, 'var(--color-text-primary)');
developer = developer.replace(/#f0a968/g, 'var(--color-primary)');
developer = developer.replace(/#34d399/g, 'var(--color-success)');
developer = developer.replace(/#60a5fa/g, 'var(--color-info)');
developer = developer.replace(/#f472b6/g, 'var(--color-accent)');
developer = developer.replace(/#ff3b30/g, 'var(--color-error)');
developer = developer.replace(/#94a3b8/g, 'var(--color-text-secondary)');
developer = developer.replace(/#555566/g, 'var(--color-text-secondary)');
developer = developer.replace(/#fff/g, 'var(--color-text-primary)');
developer = developer.replace(/#666/g, 'var(--color-text-secondary)');
fs.writeFileSync('src/pages/developer.js', developer);
