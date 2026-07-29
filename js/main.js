// ===== Shared capability checks =====
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

// ===== Navbar scroll state + scroll progress bar =====
const navbar = document.getElementById('navbar');
const scrollProgress = document.getElementById('scrollProgress');
const onScroll = () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
  if (scrollProgress) {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const pct = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
    scrollProgress.style.width = `${Math.min(100, Math.max(0, pct))}%`;
  }
};
document.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll, { passive: true });
onScroll();

// ===== Mobile menu toggle =====
const menuToggle = document.getElementById('menuToggle');
menuToggle.addEventListener('click', () => {
  const isOpen = navbar.classList.toggle('menu-open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
});
document.getElementById('navLinks').addEventListener('click', (e) => {
  if (e.target.tagName === 'A') {
    navbar.classList.remove('menu-open');
    menuToggle.setAttribute('aria-expanded', 'false');
  }
});

// ===== Active nav link on scroll =====
const navLinkEls = document.querySelectorAll('[data-nav]');
const sections = Array.from(navLinkEls)
  .map(a => document.querySelector(a.getAttribute('href')))
  .filter(Boolean);

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = '#' + entry.target.id;
      navLinkEls.forEach(a => a.classList.toggle('active', a.getAttribute('href') === id));
    }
  });
}, { rootMargin: '-45% 0px -50% 0px' });

sections.forEach(sec => sectionObserver.observe(sec));

// ===== Scroll-reveal animations (bidirectional — replays every time an
// element crosses into or out of view, in either scroll direction) =====
const revealEls = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    entry.target.classList.toggle('in-view', entry.isIntersecting);
  });
}, { threshold: 0.15 });

revealEls.forEach(el => {
  revealObserver.observe(el);
  // Reveal anything already on-screen immediately (e.g. a direct #anchor
  // load jumps straight past the fold, before the observer's first
  // async callback would otherwise fire) instead of waiting on it.
  const rect = el.getBoundingClientRect();
  if (rect.top < window.innerHeight && rect.bottom > 0) {
    el.classList.add('in-view');
  }
});

// ===== Animated stat counters (reversible — resets when scrolled out of
// view so the count-up replays each time it re-enters) =====
const counters = document.querySelectorAll('.stat__num');
let counterRAF = new WeakMap();
const animateCounter = (el) => {
  const target = parseInt(el.dataset.count, 10);
  if (prefersReducedMotion) {
    el.textContent = target;
    return;
  }
  const duration = 1400;
  const start = performance.now();
  const step = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(eased * target);
    if (progress < 1) counterRAF.set(el, requestAnimationFrame(step));
  };
  counterRAF.set(el, requestAnimationFrame(step));
};

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    const el = entry.target;
    if (entry.isIntersecting) {
      animateCounter(el);
    } else {
      if (counterRAF.has(el)) cancelAnimationFrame(counterRAF.get(el));
      el.textContent = '0';
    }
  });
}, { threshold: 0.5 });

counters.forEach(el => counterObserver.observe(el));

// ===== Contact form (demo — no backend wired up; not every page has one) =====
const form = document.getElementById('contactForm');
const status = document.getElementById('formStatus');
if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    status.textContent = "Thanks — this is a demo form, no message was actually sent yet.";
    form.reset();
  });
}

// ===== Video placeholder play button (demo) =====
document.querySelector('.video-placeholder__play')?.addEventListener('click', () => {
  alert('Swap this placeholder for a real YouTube embed when the featured video is ready.');
});

// ===== Cursor spotlight (eased/lerped toward the pointer each frame for a
// smooth, premium trail instead of snapping instantly to the cursor) =====
const cursorGlow = document.getElementById('cursorGlow');
if (cursorGlow && isFinePointer && !prefersReducedMotion) {
  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight / 2;
  let glowX = targetX;
  let glowY = targetY;

  document.addEventListener('pointermove', (e) => {
    targetX = e.clientX;
    targetY = e.clientY;
    cursorGlow.classList.add('active');
  }, { passive: true });
  document.addEventListener('pointerleave', () => cursorGlow.classList.remove('active'));

  const easeGlow = () => {
    glowX += (targetX - glowX) * 0.15;
    glowY += (targetY - glowY) * 0.15;
    document.documentElement.style.setProperty('--mx', `${glowX}px`);
    document.documentElement.style.setProperty('--my', `${glowY}px`);
    requestAnimationFrame(easeGlow);
  };
  requestAnimationFrame(easeGlow);
}

// ===== Magnetic buttons =====
if (isFinePointer && !prefersReducedMotion) {
  document.querySelectorAll('.btn').forEach((btn) => {
    btn.addEventListener('pointermove', (e) => {
      const rect = btn.getBoundingClientRect();
      const relX = e.clientX - rect.left - rect.width / 2;
      const relY = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${relX * 0.18}px, ${relY * 0.28}px)`;
    });
    btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
  });
}

// ===== 3D tilt + spotlight for cards =====
if (isFinePointer && !prefersReducedMotion) {
  document.querySelectorAll('[data-tilt]').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      const rotateX = (0.5 - py) * 8;
      const rotateY = (px - 0.5) * 8;
      card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
      card.style.setProperty('--mx', `${px * 100}%`);
      card.style.setProperty('--my', `${py * 100}%`);
    });
    card.addEventListener('pointerleave', () => {
      card.style.transform = '';
    });
  });
}

// ===== Hero particle network =====
const heroCanvas = document.getElementById('heroCanvas');
if (heroCanvas && !prefersReducedMotion) {
  const ctx = heroCanvas.getContext('2d');
  const heroSection = heroCanvas.closest('.hero');
  let particles = [];
  let width, height, rafId;
  let running = false;

  const PARTICLE_COLORS = ['rgba(79, 195, 247,', 'rgba(30, 111, 255,', 'rgba(199, 208, 218,'];

  function resize() {
    width = heroCanvas.clientWidth;
    height = heroCanvas.clientHeight;
    heroCanvas.width = width * devicePixelRatio;
    heroCanvas.height = height * devicePixelRatio;
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  }

  function initParticles() {
    const count = Math.min(70, Math.floor((width * height) / 18000));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      r: Math.random() * 1.6 + 0.6,
      color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
    }));
  }

  function step() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `${p.color} 0.8)`;
      ctx.fill();
    });
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i], b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 130) {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(79, 195, 247, ${0.12 * (1 - dist / 130)})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }
    rafId = requestAnimationFrame(step);
  }

  function start() {
    if (running) return;
    running = true;
    rafId = requestAnimationFrame(step);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(rafId);
  }

  resize();
  initParticles();

  const heroObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => (entry.isIntersecting ? start() : stop()));
  }, { threshold: 0 });
  if (heroSection) heroObserver.observe(heroSection);

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resize();
      initParticles();
    }, 200);
  });
}

// ===== Network globe (rotating point-sphere + flight-path arcs) — reused
// for the homepage's blue/silver AI globe and, with a retinted palette and
// fewer/denser points, for a "molecular network" visual on product pages. =====
function initNetworkGlobe(canvas, opts = {}) {
  if (!canvas) return;
  const pointCount = opts.pointCount || 180;
  const arcCount = opts.arcCount || 7;
  const frontColor = opts.frontColor || '79, 195, 247';
  const backColor = opts.backColor || '199, 208, 218';
  const ringColor = opts.ringColor || '79, 195, 247';

  const ctx = canvas.getContext('2d');
  const visual = canvas.closest('.hero__visual');
  let width, height, radius, cx, cy, rafId, running = false;
  let angle = 0;

  function resize() {
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = width * devicePixelRatio;
    canvas.height = height * devicePixelRatio;
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    cx = width / 2;
    cy = height / 2;
    radius = Math.min(width, height) / 2 - 12;
  }

  // Evenly distributed points on a unit sphere (golden-angle / Fibonacci lattice).
  const points = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < pointCount; i++) {
    const y = 1 - (i / (pointCount - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = goldenAngle * i;
    points.push({ x: Math.cos(theta) * r, y, z: Math.sin(theta) * r });
  }
  // Fixed set of "flight path" / "bond" arcs between a handful of points.
  const arcs = Array.from({ length: arcCount }, () => ({
    a: Math.floor(Math.random() * pointCount),
    b: Math.floor(Math.random() * pointCount),
  }));

  function project(p, rot) {
    const cos = Math.cos(rot), sin = Math.sin(rot);
    const x = p.x * cos + p.z * sin;
    const z = -p.x * sin + p.z * cos;
    return { sx: cx + x * radius, sy: cy + p.y * radius, depth: (z + 1) / 2 };
  }

  function drawFrame(rot) {
    if (width <= 0 || height <= 0 || radius <= 0) return;
    ctx.clearRect(0, 0, width, height);

    // outer orbit ring
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 6, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(${ringColor}, 0.15)`;
    ctx.lineWidth = 1;
    ctx.stroke();

    const projected = points.map(p => project(p, rot));

    arcs.forEach(({ a, b }) => {
      const pa = projected[a], pb = projected[b];
      const depth = (pa.depth + pb.depth) / 2;
      if (depth < 0.35) return;
      const mx = (pa.sx + pb.sx) / 2;
      const my = (pa.sy + pb.sy) / 2 - radius * 0.28;
      ctx.beginPath();
      ctx.moveTo(pa.sx, pa.sy);
      ctx.quadraticCurveTo(mx, my, pb.sx, pb.sy);
      ctx.strokeStyle = `rgba(${frontColor}, ${0.25 * depth})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    projected.forEach(({ sx, sy, depth }) => {
      const size = 0.6 + depth * 1.4;
      ctx.beginPath();
      ctx.arc(sx, sy, size, 0, Math.PI * 2);
      ctx.fillStyle = depth > 0.55
        ? `rgba(${frontColor}, ${0.35 + depth * 0.5})`
        : `rgba(${backColor}, ${0.12 + depth * 0.3})`;
      ctx.fill();
    });
  }

  function step() {
    angle += 0.0022;
    drawFrame(angle);
    rafId = requestAnimationFrame(step);
  }

  function start() {
    if (running || prefersReducedMotion) return;
    running = true;
    rafId = requestAnimationFrame(step);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(rafId);
  }

  resize();
  drawFrame(angle);

  if (!prefersReducedMotion) {
    const globeObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => (entry.isIntersecting ? start() : stop()));
    }, { threshold: 0 });
    if (visual) globeObserver.observe(visual);
  }

  let globeResizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(globeResizeTimer);
    globeResizeTimer = setTimeout(() => {
      resize();
      drawFrame(angle);
    }, 200);
  });
}

initNetworkGlobe(document.getElementById('heroGlobe'));
initNetworkGlobe(document.getElementById('moleculeCanvas'), {
  pointCount: 90,
  arcCount: 10,
  frontColor: '124, 92, 255',
  backColor: '45, 212, 191',
  ringColor: '124, 92, 255',
});

// ===== Back to top =====
const backToTop = document.getElementById('backToTop');
if (backToTop) {
  const toggleBackToTop = () => backToTop.classList.toggle('visible', window.scrollY > 600);
  document.addEventListener('scroll', toggleBackToTop, { passive: true });
  toggleBackToTop();
  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  });
}
