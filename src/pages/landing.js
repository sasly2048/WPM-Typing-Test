import { $, createElement, html, on } from '../utils/dom.js';
// import { createParticles } from '../components/fx/particles.js';
import { createShinyText } from '../components/fx/shiny-text.js';
import { createMatrixText } from '../components/fx/matrix-text.js';
import { createModal } from '../components/modal.js';
import { navigate } from '../utils/router.js';

// let particlesFx = null;
const styles = `
/* Global Landing Styles */
.landing-page {
  display: flex;
  flex-direction: column;
  width: 100%;
  position: relative;
  overflow-x: hidden;
  color: var(--color-text-primary);
  background: var(--color-bg-primary);
  font-family: var(--font-sans);
}

/* Ambient Blurs — soft, low-opacity color wash behind the hero. Subtle by
   design: this is definition, not decoration, so opacity stays low and the
   blur radius is large enough that no hard edge is ever visible. */
.ambient-blur {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  opacity: 0.16;
  pointer-events: none;
  z-index: 0;
}
.blur-ember {
  background: var(--color-accent);
  width: 40vw; height: 40vw;
  top: -10vw; right: -10vw;
}
.blur-silver {
  background: var(--color-text-primary);
  width: 30vw; height: 30vw;
  bottom: 20%; left: -10vw;
  opacity: 0.08;
}

/* Scroll Reveal Utilities */
.reveal {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.8s var(--ease-ritual), transform 0.8s var(--ease-ritual);
}
.reveal.is-visible {
  opacity: 1;
  transform: translateY(0);
}
.delay-100 { transition-delay: 100ms; }
.delay-200 { transition-delay: 200ms; }
.delay-300 { transition-delay: 300ms; }

/* Section Setup */
.section-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 8rem 2rem;
  position: relative;
  z-index: 1;
}

/* Alternate section tinting for visual rhythm — definition through subtle
   contrast, not gradients or borders. */
.section-tint {
  background: var(--color-bg-secondary);
  border-top: 1px solid var(--color-border-subtle);
  border-bottom: 1px solid var(--color-border-subtle);
}

.section-title {
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 800;
  margin-bottom: 1rem;
  letter-spacing: -0.03em;
}
.section-subtitle {
  font-size: 1.125rem;
  color: var(--color-text-secondary);
  max-width: 600px;
  line-height: 1.6;
  margin-bottom: 4rem;
}

/* Hero Section */
.hero {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  position: relative;
  padding: 2rem;
  padding-top: calc(var(--navbar-height, 64px) + 2rem);
}
.hero h1 {
  font-size: clamp(3.5rem, 8vw, 7rem);
  font-weight: 900;
  line-height: 1.05;
  letter-spacing: -0.04em;
  margin-bottom: 1.5rem;
  z-index: 2;
}
.hero-subtitle {
  font-size: clamp(1.1rem, 2vw, 1.5rem);
  color: var(--color-text-secondary);
  max-width: 700px;
  margin: 0 auto 3rem;
  line-height: 1.5;
  z-index: 2;
}
.hero-actions {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  z-index: 2;
  perspective: 1000px;
}
.magnetic-btn {
  display: inline-block;
  transition: transform 0.1s linear;
}

/* Hero Demo */
.hero-demo {
  margin-top: 5rem;
  padding: 1.5rem 2.5rem;
  border-radius: var(--radius-xl);
  font-family: var(--font-mono);
  font-size: 1.25rem;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  box-shadow: 0 30px 60px -20px rgba(0,0,0,0.8);
  z-index: 2;
  border: 1px solid rgba(255,255,255,0.05);
}

/* Bento Feature Grid */
.bento-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(2, 300px);
  gap: 1.5rem;
}
@media (max-width: 1024px) {
  .bento-grid {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: auto;
  }
}
@media (max-width: 600px) {
  .bento-grid { grid-template-columns: 1fr; }
}

.bento-card {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-xl);
  padding: 2rem;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.03);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: transform 0.4s var(--ease-ritual), border-color 0.4s var(--ease-ritual), box-shadow 0.4s;
}
.bento-card:hover {
  transform: translateY(-5px);
  border-color: rgba(240, 169, 104, 0.3);
  box-shadow: 0 20px 40px -10px rgba(0,0,0,0.5);
}

/* Spotlight Effect */
.bento-card::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  opacity: 0;
  transition: opacity 0.3s;
  background: radial-gradient(
    800px circle at var(--mouse-x) var(--mouse-y),
    rgba(255, 255, 255, 0.04),
    transparent 40%
  );
  z-index: 0;
  pointer-events: none;
}
.bento-card:hover::before {
  opacity: 1;
}

/* Bento Sizes */
.bento-wide { grid-column: span 2; }
.bento-tall { grid-row: span 2; }
@media (max-width: 1024px) {
  .bento-wide, .bento-tall { grid-column: span 1; grid-row: span 1; }
}

.bento-content {
  position: relative;
  z-index: 1;
}
.bento-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-xl);
  background: rgba(255,255,255,0.03);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: auto;
  color: var(--color-accent);
  border: 1px solid rgba(255,255,255,0.05);
}
/* Color variety across feature cards — reuses existing theme-defined
   semantic hues (accent/success/info), never invents new colors, and
   stays correct across all 9 themes automatically. */
.bento-icon.icon-accent { color: var(--color-accent); background: var(--color-accent-subtle); }
.bento-icon.icon-success { color: var(--color-success); background: color-mix(in srgb, var(--color-success) 15%, transparent); }
.bento-icon.icon-info { color: var(--color-info); background: color-mix(in srgb, var(--color-info) 15%, transparent); }
.bento-card h3 {
  font-size: 1.5rem;
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
}
.bento-card p {
  color: var(--color-text-secondary);
  font-size: 1rem;
  line-height: 1.5;
}

/* Floating Stats */
.stats-container {
  display: flex;
  gap: 2rem;
  justify-content: center;
  flex-wrap: wrap;
  margin: 4rem 0;
}
.stat-float {
  padding: 2rem;
  border-radius: var(--radius-xl);
  min-width: 240px;
  text-align: center;
  position: relative;
  overflow: hidden;
}
.stat-float .lucide {
  color: var(--color-accent);
  margin-bottom: 1rem;
  width: 32px; height: 32px;
}
.stat-float .lucide.icon-info { color: var(--color-info); }
.stat-float .lucide.icon-success { color: var(--color-success); }
.stat-val {
  font-size: 3.5rem;
  font-weight: 900;
  letter-spacing: -0.05em;
  margin-bottom: 0.5rem;
  font-family: var(--font-mono);
}
.stat-label {
  color: var(--color-text-secondary);
  font-weight: 500;
}

/* Testimonials Marquee */
.marquee-wrapper {
  width: 100%;
  overflow: hidden;
  padding: 4rem 0;
  mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
}
.marquee-track {
  display: flex;
  width: max-content;
  gap: 2rem;
  animation: marquee 40s linear infinite;
}
.marquee-wrapper:hover .marquee-track {
  animation-play-state: paused;
}
@keyframes marquee {
  to { transform: translateX(calc(-50% - 1rem)); }
}
.testimonial-card {
  width: 400px;
  padding: 2rem;
  border-radius: var(--radius-xl);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  white-space: normal;
}
.stars {
  display: flex;
  gap: 4px;
  color: var(--color-accent);
}
.stars .lucide { width: 16px; height: 16px; fill: currentColor; }
.test-quote {
  font-size: 1.125rem;
  line-height: 1.6;
  color: var(--color-text-primary);
}
.test-author {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: auto;
}
/* SVG Abstract Avatar */
.avatar-svg {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-bg-tertiary), var(--color-bg-secondary));
  border: 1px solid rgba(255,255,255,0.1);
}
.author-meta h4 { margin: 0; font-size: 1rem; display: flex; align-items: center; gap: 0.5rem; }
.author-meta p { margin: 0; color: var(--color-text-secondary); font-size: 0.875rem; }
.verified-badge { color: var(--color-success); width: 14px; height: 14px; }

/* FAQ Accordion */
.faq-list {
  max-width: 700px;
  margin: 0 auto;
}
.faq-item {
  border-bottom: 1px solid var(--color-border);
  overflow: hidden;
}
.faq-btn {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 0;
  background: transparent;
  border: none;
  color: var(--color-text-primary);
  font-size: 1.125rem;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
}
.faq-btn .lucide {
  transition: transform 0.3s var(--ease-ritual);
  color: var(--color-text-secondary);
}
.faq-content {
  max-height: 0;
  opacity: 0;
  transition: all 0.4s var(--ease-ritual);
  color: var(--color-text-secondary);
  line-height: 1.6;
}
.faq-item.active .faq-content {
  max-height: 200px;
  opacity: 1;
  padding-bottom: 1.5rem;
}
.faq-item.active .faq-btn .lucide {
  transform: rotate(180deg);
  color: var(--color-text-primary);
}

/* CTA Section */
.cta-section {
  text-align: center;
  padding: 8rem 2rem;
  position: relative;
}
`;

export function render(container) {
  let styleElement = document.getElementById('landing-styles');
  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.id = 'landing-styles';
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);
  }

  // Pre-generate SVG avatars
  const getAvatar = (color1, color2) => `<div class="avatar-svg" style="background: linear-gradient(135deg, ${color1}, ${color2})"></div>`;

  container.innerHTML = html`
    <main id="main-content" class="landing-page">
      <div class="ambient-blur blur-ember"></div>
      <div class="ambient-blur blur-silver"></div>

      <!-- Hero -->
      <section class="hero">
        <h1 class="reveal">
          <span>Master your</span><br/>
          <span class="hero-shiny-target">Flow State</span>
        </h1>
        <p class="hero-subtitle reveal delay-100">
          A deeply immersive, distraction-free environment to measure your typing speed, 
          track your analytics, and master the keyboard.
        </p>
        <div class="hero-actions reveal delay-200">
          <div class="magnetic-btn">
            <a href="#/auth" class="btn btn-ember" style="padding: 1rem 2.5rem; font-size: 1.125rem;">Get Started Free</a>
          </div>
          <div class="magnetic-btn">
            <button type="button" id="guest-access-btn" class="btn btn-silver-sweep" style="padding: 1rem 2.5rem; font-size: 1.125rem;">I'll sign up later</button>
          </div>
        </div>
        
        <div class="hero-demo glass-strong reveal delay-300">
          <span class="typed demo-matrix-target">the quick brown fox jumps over the lazy dog</span>
          <span class="caret" style="background: var(--color-accent); width: 2px; display: inline-block; ">&nbsp;</span>
        </div>
      </section>

      <!-- Bento Features -->
      <section class="section-container section-tint">
        <h2 class="section-title reveal">Built for Focus</h2>
        <p class="section-subtitle reveal delay-100">Every element is designed to keep you in the zone. Minimal UI, maximum performance.</p>
        
        <div class="bento-grid">
          
          <div class="bento-card bento-wide reveal">
            <div class="bento-content">
              <div class="bento-icon icon-accent"><i data-lucide="zap"></i></div>
              <h3>Sub-millisecond Latency</h3>
              <p>Powered by a bespoke Vanilla JS engine. No frameworks, no virtual DOM, just pure raw performance registering every keystroke instantly.</p>
            </div>
          </div>

          <div class="bento-card reveal delay-100">
            <div class="bento-content">
              <div class="bento-icon icon-info"><i data-lucide="bar-chart-2"></i></div>
              <h3>Deep Analytics</h3>
              <p>Track your WPM, accuracy, and character-level mistakes over time with beautiful, actionable charts.</p>
            </div>
          </div>

          <div class="bento-card bento-tall reveal delay-200">
            <div class="bento-content">
              <div class="bento-icon icon-accent"><i data-lucide="palette"></i></div>
              <h3>9 Premium Themes</h3>
              <p>Hand-crafted syntax highlighting themes ranging from pure-black Terminal to crisp Arctic white. Find your perfect aesthetic.</p>
            </div>
          </div>

          <div class="bento-card reveal delay-100">
            <div class="bento-content">
              <div class="bento-icon icon-success"><i data-lucide="crosshair"></i></div>
              <h3>Multiple Modes</h3>
              <p>Practice time trials, word counts, or raw code snippets. Configure the exact challenge you need.</p>
            </div>
          </div>

          <div class="bento-card reveal delay-200">
            <div class="bento-content">
              <div class="bento-icon icon-info"><i data-lucide="keyboard"></i></div>
              <h3>Keyboard First</h3>
              <p>Never touch your mouse. Navigate the entire platform instantly using the Cmd+K command palette and shortcuts.</p>
            </div>
          </div>

        </div>
      </section>

      <!-- Statistics (Floating Cards) -->
      <section class="section-container" style="padding-top: 2rem;">
        <div class="stats-container">
          <div class="stat-float glass-strong reveal">
            <i data-lucide="activity" class="icon-accent"></i>
            <div class="stat-val num-ticker" data-val="142">0</div>
            <div class="stat-label">Million Keystrokes</div>
          </div>
          <div class="stat-float glass-strong reveal delay-100">
            <i data-lucide="users" class="icon-info"></i>
            <div class="stat-val num-ticker" data-val="50">0</div>
            <div class="stat-label">Thousand Sessions</div>
          </div>
          <div class="stat-float glass-strong reveal delay-200">
            <i data-lucide="target" class="icon-success"></i>
            <div class="stat-val num-ticker" data-val="98">0</div>
            <div class="stat-label">Average Accuracy %</div>
          </div>
        </div>
      </section>

      <!-- Testimonials Marquee -->
      <section class="section-container" style="padding-bottom: 2rem;">
        <h2 class="section-title reveal">Trusted by Professionals</h2>
        
        <div class="marquee-wrapper reveal delay-100">
          <div class="marquee-track">
            <!-- Double the content for seamless infinite loop -->
            ${[1,2].map(() => `
              <div class="testimonial-card glass">
                <div class="stars">
                  <i data-lucide="star"></i><i data-lucide="star"></i><i data-lucide="star"></i><i data-lucide="star"></i><i data-lucide="star"></i>
                </div>
                <div class="test-quote">"KeyFlow completely changed my workflow. The minimal UI and extreme performance makes practicing actually enjoyable. The Obsidian theme is stunning."</div>
                <div class="test-author">
                  ${getAvatar("var(--color-bg-tertiary)", "var(--color-accent)")}
                  <div class="author-meta">
                    <h4>Sarah Chen <i data-lucide="badge-check" class="verified-badge"></i></h4>
                    <p>Senior Engineer @ Vercel</p>
                  </div>
                </div>
              </div>

              <div class="testimonial-card glass">
                <div class="stars">
                  <i data-lucide="star"></i><i data-lucide="star"></i><i data-lucide="star"></i><i data-lucide="star"></i><i data-lucide="star"></i>
                </div>
                <div class="test-quote">"I've used every typing site out there, and none have this level of polish. The metrics are incredibly deep, and the keyboard-first navigation is perfect."</div>
                <div class="test-author">
                  ${getAvatar("var(--color-bg-tertiary)", "var(--color-success)")}
                  <div class="author-meta">
                    <h4>Marcus Rivera <i data-lucide="badge-check" class="verified-badge"></i></h4>
                    <p>Product Designer</p>
                  </div>
                </div>
              </div>

              <div class="testimonial-card glass">
                <div class="stars">
                  <i data-lucide="star"></i><i data-lucide="star"></i><i data-lucide="star"></i><i data-lucide="star"></i><i data-lucide="star"></i>
                </div>
                <div class="test-quote">"The ceremony glow and glitch animations add such a premium feel. It's not just a typing test, it's an experience. I'm hooked on hitting new personal bests."</div>
                <div class="test-author">
                  ${getAvatar("var(--color-accent)", "var(--color-accent)")}
                  <div class="author-meta">
                    <h4>Aiko Tanaka <i data-lucide="badge-check" class="verified-badge"></i></h4>
                    <p>Technical Writer</p>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </section>

      <!-- FAQ -->
      <section class="section-container section-tint">
        <h2 class="section-title reveal text-center" style="text-align: center;">Frequently Asked</h2>
        <div class="faq-list reveal delay-100">
          <div class="faq-item">
            <button class="faq-btn">What is WPM? <i data-lucide="chevron-down"></i></button>
            <div class="faq-content">Words Per Minute measures your typing speed. It is calculated by dividing total characters typed by 5, then dividing by elapsed minutes.</div>
          </div>
          <div class="faq-item">
            <button class="faq-btn">Is my data stored securely? <i data-lucide="chevron-down"></i></button>
            <div class="faq-content">Yes. KeyFlow is a client-side SPA. All your analytics, history, and preferences are stored locally in your browser using secure localStorage. Nothing hits our servers.</div>
          </div>
          <div class="faq-item">
            <button class="faq-btn">Does it support code typing? <i data-lucide="chevron-down"></i></button>
            <div class="faq-content">Yes, select the 'Code' mode in the typing configuration to practice with real snippets across 16 languages, including JavaScript, Python, Go, Rust, and SQL.</div>
          </div>
        </div>
      </section>

      <!-- Final CTA -->
      <section class="cta-section reveal">
        <h2 class="section-title">Ready to enter the flow?</h2>
        <p class="section-subtitle" style="margin: 1rem auto 3rem;">Join thousands mastering the keyboard today.</p>
        <div class="magnetic-btn">
          <a href="#/typing" class="btn btn-ember" style="padding: 1.25rem 3rem; font-size: 1.25rem;">Start Session</a>
        </div>
      </section>

    </main>
  `;

  // === JS INTERACTION ENGINE ===

  // 1. Initialize Lucide Icons (wait a tick for DOM)
  setTimeout(() => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, 50);

  // 2. Initialize FX
  const heroContainer = $('.hero', container);
  if (heroContainer) {
    // particlesFx = createParticles(heroContainer, { count: 80 });
  }

  const titleSpan = $('.hero-shiny-target', container);
  if (titleSpan) {
    titleSpan.textContent = '';
    titleSpan.appendChild(createShinyText('Flow State'));
  }

  const demoTyped = $('.demo-matrix-target', container);
  if (demoTyped) {
    createMatrixText(demoTyped, 'the quick brown fox jumps over the lazy dog');
  }

  // 3. Scroll Reveal Observer
  const revealElements = container.querySelectorAll('.reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        
        // Trigger number ticker if applicable
        if (entry.target.classList.contains('stat-float')) {
          const ticker = entry.target.querySelector('.num-ticker');
          if (ticker && !ticker.dataset.animated) {
            ticker.dataset.animated = 'true';
            animateValue(ticker, 0, parseInt(ticker.dataset.val), 2000);
          }
        }
      }
    });
  }, { threshold: 0.1 });
  
  revealElements.forEach(el => observer.observe(el));

  // 4. Number Ticker Function
  function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      obj.innerHTML = Math.floor(easeProgress * (end - start) + start);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        if (end === 98) obj.innerHTML = end + '%';
        if (end === 142) obj.innerHTML = end + 'M+';
        if (end === 50) obj.innerHTML = end + 'K+';
      }
    };
    window.requestAnimationFrame(step);
  }

  // 5. Spotlight effect for Bento Cards
  const bentoCards = container.querySelectorAll('.bento-card');
  container.addEventListener('mousemove', (e) => {
    bentoCards.forEach(card => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  });

  // 6. Magnetic Buttons
  const magneticBtns = container.querySelectorAll('.magnetic-btn');
  magneticBtns.forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const h = rect.width / 2;
      const v = rect.height / 2;
      const x = e.clientX - rect.left - h;
      const y = e.clientY - rect.top - v;
      // move up to 15px max
      btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'translate(0px, 0px)';
    });
  });

  // 7. FAQ Accordion
  container.querySelectorAll('.faq-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.parentElement;
      const isActive = item.classList.contains('active');

      // Close all
      container.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));

      // Open clicked if it wasn't active
      if (!isActive) item.classList.add('active');
    });
  });

  // 8. Guest Access — warns what's lost without an account before letting
  // the visitor skip sign-up entirely.
  const guestBtn = container.querySelector('#guest-access-btn');
  if (guestBtn) {
    guestBtn.addEventListener('click', () => {
      const modal = createModal({
        title: 'Continue without an account?',
        content: `
          <p style="color: var(--color-text-secondary); line-height: 1.6; margin: 0 0 1rem;">
            Do you really want to miss out? Without signing up, your WPM history, streaks,
            personal bests, and achievements <strong>won't be saved</strong> — everything
            resets the moment you close this tab.
          </p>
          <p style="color: var(--color-text-secondary); line-height: 1.6; margin: 0;">
            You can still try KeyFlow right now, and sign up later to keep your progress.
          </p>
        `,
        actions: [
          {
            label: 'Sign up instead',
            type: 'primary',
            onClick: () => {
              modal.close();
              navigate('/auth');
            },
          },
          {
            label: 'Continue as guest',
            type: 'secondary',
            onClick: () => {
              localStorage.setItem('keyflow_guest_mode', 'true');
              modal.close();
              navigate('/practice');
            },
          },
        ],
      });
      modal.open();
    });
  }
}

export function destroy() {
  // Particles removed per PRD guidelines (no floating particles)
}

