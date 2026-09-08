/* =========================================================
   Susannah Al Fraihat — portfolio
   Vanilla ES2020+, no dependencies.
   ========================================================= */

(() => {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Theme ---------- */

  const root = document.documentElement;
  const themeToggle = $('#theme-toggle');

  const applyTheme = (theme) => {
    root.dataset.theme = theme;
    themeToggle.setAttribute('aria-pressed', String(theme === 'dark'));
    themeToggle.setAttribute(
      'aria-label',
      theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
    );
  };

  applyTheme(root.dataset.theme || 'light');

  themeToggle.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try { localStorage.setItem('theme', next); } catch (e) { /* private mode */ }
  });

  /* ---------- Portrait ---------- */

  // If the headshot ever goes missing, drop it and let the monogram show through
  // rather than leaving a broken-image box in the layout.
  const portrait = $('.photo');
  if (portrait) {
    portrait.addEventListener('error', () => portrait.remove(), { once: true });
    if (portrait.complete && portrait.naturalWidth === 0) portrait.remove();
  }

  /* ---------- Mobile navigation ---------- */

  const burger = $('#hamburger');
  const navLinks = $('#nav-links');

  const setMenu = (open) => {
    navLinks.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.style.overflow = open ? 'hidden' : '';
  };

  burger.addEventListener('click', () => setMenu(!navLinks.classList.contains('open')));
  navLinks.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  /* ---------- Scroll: progress bar, nav state, back-to-top ---------- */

  const navbar = $('#navbar');
  const progressBar = $('#progress-bar');
  const backToTop = $('#back-to-top');
  let ticking = false;

  const onScroll = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;

    progressBar.style.width = `${max > 0 ? (y / max) * 100 : 0}%`;
    navbar.classList.toggle('scrolled', y > 20);
    backToTop.classList.toggle('show', y > window.innerHeight * 0.6);
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });

  onScroll();

  /* ---------- Reveal on scroll ---------- */

  const animated = $$('[data-anim]');

  if (reduceMotion || !('IntersectionObserver' in window)) {
    animated.forEach((el) => el.classList.add('in'));
  } else {
    // Stagger siblings so groups cascade rather than pop in together.
    const groups = new Map();
    animated.forEach((el) => {
      const parent = el.parentElement;
      const i = groups.get(parent) ?? 0;
      el.style.setProperty('--d', `${Math.min(i, 5) * 80}ms`);
      groups.set(parent, i + 1);
    });

    const revealer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        obs.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0 });

    animated.forEach((el) => revealer.observe(el));
  }

  /* ---------- Active section in nav ---------- */

  const sections = $$('main section[id]');
  const linkFor = (id) => $(`.nav-link[href="#${id}"]`);

  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        $$('.nav-link').forEach((l) => l.classList.remove('active'));
        linkFor(entry.target.id)?.classList.add('active');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    sections.forEach((s) => spy.observe(s));
  }

  /* ---------- Hero: pointer-reactive glow ---------- */

  const glow = $('.hero-glow');

  if (glow && !reduceMotion && matchMedia('(hover: hover)').matches) {
    $('.hero').addEventListener('pointermove', (e) => {
      glow.style.setProperty('--px', `${(e.clientX / window.innerWidth - 0.5) * 44}px`);
      glow.style.setProperty('--py', `${(e.clientY / window.innerHeight - 0.5) * 44}px`);
    });
  }

  /* ---------- Magnetic buttons ---------- */

  if (!reduceMotion && matchMedia('(hover: hover)').matches) {
    $$('.magnetic').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.18;
        const y = (e.clientY - r.top - r.height / 2) * 0.28;
        el.style.transform = `translate(${x}px, ${y}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------- Contact form ---------- */

  const form = $('#contact-form');
  const success = $('#form-success');

  const validators = {
    name: (v) => v.trim().length >= 2 || 'Please enter your name (2+ characters).',
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || 'Please enter a valid email address.',
    subject: (v) => v.trim().length >= 3 || 'Subject must be at least 3 characters.',
    message: (v) => v.trim().length >= 10 || 'Message should be at least 10 characters.'
  };

  const validateField = (name) => {
    const field = $(`#${name}`);
    const result = validators[name](field.value || '');
    const group = field.closest('.form-group');
    const error = $(`#${name}-error`);
    const ok = result === true;

    group.classList.toggle('invalid', !ok);
    field.setAttribute('aria-invalid', String(!ok));
    error.textContent = ok ? '' : result;
    return ok;
  };

  $$('#contact-form input, #contact-form textarea').forEach((field) => {
    field.addEventListener('blur', () => validateField(field.id));
    field.addEventListener('input', () => {
      if (field.closest('.form-group').classList.contains('invalid')) validateField(field.id);
    });
  });

  let successTimer;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const allValid = Object.keys(validators).map(validateField).every(Boolean);

    if (!allValid) {
      success.classList.remove('show');
      $('#contact-form .invalid input, #contact-form .invalid textarea')?.focus();
      return;
    }

    form.reset();
    $$('.form-group').forEach((g) => g.classList.remove('invalid'));
    $$('#contact-form [aria-invalid]').forEach((f) => f.removeAttribute('aria-invalid'));
    success.classList.add('show');
    clearTimeout(successTimer);
    successTimer = setTimeout(() => success.classList.remove('show'), 6000);
  });

  /* ---------- Footer year ---------- */

  $('#year').textContent = new Date().getFullYear();
})();
