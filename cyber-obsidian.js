import {
  computeRepulsionForce,
  computeShockwaveImpulse,
  computeConstellationAlpha,
} from './particle-physics.js';

/**
 * Initializes the Cyber Obsidian Quantum Particle System, Liquid Glass Spotlights,
 * Fluid Click Ripples, and Kinetic Reveal observer.
 */
function initCyberObsidianExperience() {
  // Enforce dark obsidian theme class on root
  document.documentElement.classList.add('dark');
  try {
    if (!localStorage.getItem('arb.theme')) {
      localStorage.setItem('arb.theme', 'dark');
    }
  } catch {}

  // 1. Mount Aurora Backdrop & Quantum Particle Canvas
  let aurora = document.getElementById('aurora-backdrop');
  if (!aurora) {
    aurora = document.createElement('div');
    aurora.id = 'aurora-backdrop';
    aurora.setAttribute('aria-hidden', 'true');
    document.body.prepend(aurora);
  }

  let canvas = document.getElementById('quantum-canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'quantum-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.setAttribute('data-testid', 'quantum-particle-canvas');
    document.body.prepend(canvas);
  }

  const ctx = canvas.getContext('2d');
  let width = window.innerWidth;
  let height = window.innerHeight;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);

  const pointer = {
    x: -9999,
    y: -9999,
    active: false,
  };

  /** @type {Array<{x:number,y:number,vx:number,vy:number,baseVx:number,baseVy:number,r:number,z:number,color:string,alpha:number}>} */
  let particles = [];
  /** @type {Array<{x:number,y:number,radius:number,maxRadius:number,alpha:number}>} */
  const shockwaves = [];

  function createParticles() {
    const isMobile = width < 768;
    const count = isMobile ? 56 : 136;
    const palette = ['#FFFFFF', '#E4E4E7', '#00E676', '#FF3B5C', '#FFFFFF'];
    particles = Array.from({ length: count }, (_, idx) => {
      // Depth factor z in [0.35, 1.0] for 3D parallax (smaller = deeper & slower)
      const z = 0.35 + ((idx * 73) % 66) / 100;
      const r = +(1 + z * 2).toFixed(2); // 1.0px to 3.0px
      const speed = (0.18 + z * 0.42) * (idx % 2 === 0 ? 1 : -1);
      const angle = ((idx * 137.5) % 360) * (Math.PI / 180);
      const baseVx = Math.cos(angle) * speed;
      const baseVy = Math.sin(angle) * speed;
      return {
        x: ((idx * 97) % 100) * 0.01 * width,
        y: ((idx * 53) % 100) * 0.01 * height,
        vx: baseVx,
        vy: baseVy,
        baseVx,
        baseVy,
        r,
        z,
        color: palette[idx % palette.length],
        alpha: +(0.32 + z * 0.55).toFixed(2),
      };
    });
  }

  function handleResize() {
    width = window.innerWidth;
    height = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    createParticles();
  }

  handleResize();
  window.addEventListener('resize', handleResize, { passive: true });

  // Pointer & Shockwave listeners
  window.addEventListener(
    'pointermove',
    (e) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
      updateGlassSpotlights(e.clientX, e.clientY);
    },
    { passive: true }
  );

  window.addEventListener(
    'pointerleave',
    () => {
      pointer.x = -9999;
      pointer.y = -9999;
      pointer.active = false;
    },
    { passive: true }
  );

  window.addEventListener(
    'pointerdown',
    (e) => {
      shockwaves.push({
        x: e.clientX,
        y: e.clientY,
        radius: 6,
        maxRadius: 320,
        alpha: 0.55,
      });

      const btn = e.target instanceof Element ? e.target.closest('button') : null;
      if (btn && !btn.disabled) {
        spawnFluidRipple(btn, e.clientX, e.clientY);
      }
    },
    { passive: true }
  );

  // Render loop (60 FPS Canvas 2D)
  const MAX_LINK_DIST = 128;
  const MAX_LINK_DIST_SQ = MAX_LINK_DIST * MAX_LINK_DIST;

  function renderFrame() {
    ctx.clearRect(0, 0, width, height);

    // Advance shockwaves
    for (let w = shockwaves.length - 1; w >= 0; w--) {
      const wave = shockwaves[w];
      wave.radius += 7.5;
      wave.alpha = Math.max(0, 0.55 * (1 - wave.radius / wave.maxRadius));

      ctx.save();
      ctx.beginPath();
      ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 255, 255, ${wave.alpha.toFixed(3)})`;
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#FFFFFF';
      ctx.stroke();
      ctx.restore();

      if (wave.radius >= wave.maxRadius) {
        shockwaves.splice(w, 1);
      }
    }

    // Update particle positions & physics
    const n = particles.length;
    for (let i = 0; i < n; i++) {
      const p = particles[i];

      if (pointer.active) {
        const rep = computeRepulsionForce(
          p.x,
          p.y,
          pointer.x,
          pointer.y,
          145,
          0.95 * p.z
        );
        if (rep.engaged) {
          p.vx += rep.fx;
          p.vy += rep.fy;
        }
      }

      for (let w = 0; w < shockwaves.length; w++) {
        const wave = shockwaves[w];
        const imp = computeShockwaveImpulse(
          p.x,
          p.y,
          wave.x,
          wave.y,
          wave.radius,
          48,
          1.6 * p.z
        );
        p.vx += imp.ix;
        p.vy += imp.iy;
      }

      // Smooth inertia return toward base drift trajectory
      p.vx += (p.baseVx - p.vx) * 0.045;
      p.vy += (p.baseVy - p.vy) * 0.045;

      p.x += p.vx;
      p.y += p.vy;

      // Wrap around viewport edges seamlessly
      if (p.x < -10) p.x = width + 10;
      else if (p.x > width + 10) p.x = -10;
      if (p.y < -10) p.y = height + 10;
      else if (p.y > height + 10) p.y = -10;
    }

    // Draw Constellation Links
    ctx.lineWidth = 0.8;
    for (let i = 0; i < n; i++) {
      const a = particles[i];
      for (let j = i + 1; j < n; j++) {
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const distSq = dx * dx + dy * dy;
        if (distSq < MAX_LINK_DIST_SQ) {
          const alpha = computeConstellationAlpha(distSq, MAX_LINK_DIST, 0.2);
          if (alpha > 0.01) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.stroke();
          }
        }
      }
    }

    // Draw Glowing Quantum Particles
    ctx.save();
    for (let i = 0; i < n; i++) {
      const p = particles[i];
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 11;
      ctx.shadowColor = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.fill();
    }
    ctx.restore();

    requestAnimationFrame(renderFrame);
  }

  requestAnimationFrame(renderFrame);

  // 2. Spotlight Tracking for Liquid Glass Cards
  function updateGlassSpotlights(clientX, clientY) {
    const cards = document.querySelectorAll(
      '.liquid-glass-card, #root .rounded-2xl.border'
    );
    for (const card of cards) {
      if (!(card instanceof HTMLElement)) continue;
      const rect = card.getBoundingClientRect();
      const inside =
        clientX >= rect.left - 80 &&
        clientX <= rect.right + 80 &&
        clientY >= rect.top - 80 &&
        clientY <= rect.bottom + 80;
      if (inside) {
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        card.style.setProperty('--spot-x', `${x.toFixed(1)}px`);
        card.style.setProperty('--spot-y', `${y.toFixed(1)}px`);
        card.style.setProperty('--spot-opacity', '1');
      } else {
        card.style.setProperty('--spot-opacity', '0');
      }
    }
  }

  // 3. Fluid Ripple on Click
  function spawnFluidRipple(btn, clientX, clientY) {
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.25;
    const wave = document.createElement('span');
    wave.className = 'fluid-ripple-wave';
    wave.style.width = `${size}px`;
    wave.style.height = `${size}px`;
    wave.style.left = `${clientX - rect.left}px`;
    wave.style.top = `${clientY - rect.top}px`;
    btn.appendChild(wave);
    setTimeout(() => wave.remove(), 680);
  }

  // 5. Kinetic Reveal on Scroll / Mount
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('kinetic-visible');
          io.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.01, rootMargin: '160px 0px' }
  );

  function syncTableComponentColors() {
    const buyBtns = document.querySelectorAll('#root table td button:nth-of-type(1)');
    for (const btn of buyBtns) {
      if (btn instanceof HTMLElement) {
        btn.classList.add('arb-action-buy');
        btn.style.background = '#00e676';
        btn.style.borderColor = '#00e676';
        btn.style.color = '#000000';
      }
    }
    const sellBtns = document.querySelectorAll('#root table td button:nth-of-type(2)');
    for (const btn of sellBtns) {
      if (btn instanceof HTMLElement) {
        btn.classList.add('arb-action-sell');
        btn.style.background = '#ff001c';
        btn.style.borderColor = '#ff001c';
        btn.style.color = '#ffffff';
      }
    }
    const badges = document.querySelectorAll('#root table td div > span.rounded-full:nth-of-type(1)');
    for (const badge of badges) {
      if (badge instanceof HTMLElement && !badge.classList.contains('arb-badge-green')) {
        const text = (badge.textContent || '').toLowerCase();
        const isOk = text.includes('ok') || text.includes('ок');
        if (isOk) {
          badge.classList.add('arb-badge-green');
          badge.style.borderColor = '#00e676';
          badge.style.color = '#00e676';
          badge.style.background = 'rgba(0, 230, 118, 0.14)';
        } else {
          badge.classList.add('arb-badge-red');
          badge.style.borderColor = '#ff2121';
          badge.style.color = '#ff2121';
          badge.style.background = 'rgba(255, 33, 33, 0.14)';
        }
      }
    }
  }

  function registerKineticNodes() {
    const cards = document.querySelectorAll(
      '.liquid-glass-card, #root .rounded-2xl.border'
    );
    cards.forEach((node, idx) => {
      if (
        node instanceof HTMLElement &&
        !node.classList.contains('kinetic-item')
      ) {
        node.classList.add('kinetic-item', 'liquid-glass-card');
        const delayMs = Math.min(idx * 55, 280);
        node.style.setProperty('--kinetic-delay', `${delayMs}ms`);
        io.observe(node);
        setTimeout(() => {
          node.classList.add('kinetic-visible');
        }, 60 + delayMs);
      }
    });
    syncTableComponentColors();
  }

  registerKineticNodes();
  const mo = new MutationObserver(() => registerKineticNodes());
  mo.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCyberObsidianExperience);
} else {
  initCyberObsidianExperience();
}
