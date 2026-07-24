// ===== Navbar scroll state =====
const navbar = document.getElementById('navbar');
const onScroll = () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
};
document.addEventListener('scroll', onScroll, { passive: true });
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

// ===== Scroll-reveal animations =====
const revealEls = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

// Reveal anything already on-screen immediately (e.g. a direct #anchor
// load jumps straight past the fold, before the observer's first
// async callback would otherwise fire) instead of waiting on it.
revealEls.forEach(el => {
  const rect = el.getBoundingClientRect();
  if (rect.top < window.innerHeight && rect.bottom > 0) {
    el.classList.add('in-view');
  } else {
    revealObserver.observe(el);
  }
});

// ===== Animated stat counters =====
const counters = document.querySelectorAll('.stat__num');
const animateCounter = (el) => {
  const target = parseInt(el.dataset.count, 10);
  const duration = 1400;
  const start = performance.now();
  const step = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(eased * target);
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
};

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounter(entry.target);
      counterObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

counters.forEach(el => counterObserver.observe(el));

// ===== Contact form (demo — no backend wired up) =====
const form = document.getElementById('contactForm');
const status = document.getElementById('formStatus');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  status.textContent = "Thanks — this is a demo form, no message was actually sent yet.";
  form.reset();
});

// ===== Video placeholder play button (demo) =====
document.querySelector('.video-placeholder__play')?.addEventListener('click', () => {
  alert('Swap this placeholder for a real YouTube embed when the featured video is ready.');
});
