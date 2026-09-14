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

  /* ---------- Scroll lock ----------
     iOS Safari ignores `overflow: hidden` on <body>, so a full-screen panel
     still scrolls the page behind it. Pinning the body with position:fixed is
     what actually holds there — but it drops the scroll position, so stash it
     and put it back on release. Reference-counted: the menu and the birthday
     overlay can both hold the lock, and only the last release may undo it. */

  const scrollLock = (() => {
    let depth = 0;
    let savedY = 0;
    return {
      get held() { return depth > 0; },
      hold() {
        if (depth++ > 0) return;
        savedY = window.scrollY;
        const s = document.body.style;
        s.position = 'fixed';
        s.top = `-${savedY}px`;
        s.left = '0';
        s.right = '0';
        s.overflow = 'hidden';
      },
      release() {
        if (depth === 0 || --depth > 0) return;
        const s = document.body.style;
        s.position = s.top = s.left = s.right = s.overflow = '';
        // html has scroll-behavior:smooth, which would animate this restore
        // into a visible rewind of the whole page. Jump instead.
        const html = document.documentElement;
        const prev = html.style.scrollBehavior;
        html.style.scrollBehavior = 'auto';
        window.scrollTo(0, savedY);
        html.style.scrollBehavior = prev;
      },
    };
  })();

  window.__scrollLock = scrollLock;   // birthday.js shares it

  /* ---------- Mobile navigation ---------- */

  const burger = $('#hamburger');
  const navLinks = $('#nav-links');
  let menuOpen = false;

  const setMenu = (open) => {
    if (open === menuOpen) return;      // never hold the lock twice
    menuOpen = open;
    navLinks.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (open) scrollLock.hold(); else scrollLock.release();
  };

  burger.addEventListener('click', () => setMenu(!menuOpen));
  navLinks.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  // Rotating to landscape can cross the 760px breakpoint and hide the panel
  // via CSS while the lock is still held — which leaves the page frozen with
  // no visible way to release it.
  matchMedia('(max-width: 760px)').addEventListener('change', (e) => {
    if (!e.matches) setMenu(false);
  });

  /* ---------- Scroll: progress bar, nav state, back-to-top ---------- */

  const navbar = $('#navbar');
  const progressBar = $('#progress-bar');
  const backToTop = $('#back-to-top');
  let ticking = false;

  const onScroll = () => {
    ticking = false;
    // While the body is pinned, scrollY reads 0 — acting on that would blank
    // the progress bar and strip the navbar's blur behind the open menu.
    if (scrollLock.held) return;

    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;

    progressBar.style.width = `${max > 0 ? (y / max) * 100 : 0}%`;
    navbar.classList.toggle('scrolled', y > 20);
    backToTop.classList.toggle('show', y > window.innerHeight * 0.6);
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

  /* ---------- Falling fruit ----------
     The piece factory lives here, not in birthday.js, because that file bails
     out entirely once the gag passes its retirement date — and the nav button
     has to keep working after that. birthday.js borrows it off the window. */

  const FRUIT = ['🍇', '🍊', '🍋', '🍑', '🍒', '🍓', '🥝', '🍍', '🍎', '🍐', '🥭', '🍌'];
  // Pomegranates are the favourite, so they fall more often than anything else.
  // Unicode has no pomegranate, so .pom is a drawn SVG (see birthday.css).
  const POM_SHARE = 0.35;
  const rand = (min, max) => Math.random() * (max - min) + min;

  const makePiece = () => {
    const el = document.createElement('i');
    if (Math.random() < POM_SHARE) el.className = 'pom';
    else el.textContent = FRUIT[Math.floor(Math.random() * FRUIT.length)];
    return el;
  };

  const seedFruit = (layer, count) => {
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const f = makePiece();
      f.style.left = `${rand(-2, 98)}%`;
      f.style.setProperty('--size', `${rand(16, 38).toFixed(0)}px`);
      f.style.setProperty('--dur', `${rand(4.5, 9).toFixed(2)}s`);
      f.style.setProperty('--delay', `${rand(0, 6).toFixed(2)}s`);
      f.style.setProperty('--spin', `${rand(-720, 720).toFixed(0)}deg`);
      frag.appendChild(f);
    }
    layer.replaceChildren(frag);
  };

  window.__fruit = { makePiece, seedFruit };   // birthday.js shares these

  /* ---------- Site-wide fruit rain ---------- */

  const fruitBtn = $('#fruit-btn');
  const fruitLayer = $('#fruit-layer');

  if (fruitBtn && fruitLayer) {
    // An explicit control that does nothing is worse than no control, and the
    // rain is pure motion — so remove it outright rather than leaving it dead.
    if (reduceMotion) {
      fruitBtn.remove();
    } else {
      const RAIN_MS = 30000;
      const FADE_MS = 800;        // must match .fruit-rain's opacity transition
      let stopTimer, clearTimer, raining = false;

      const stopRain = () => {
        if (!raining) return;
        raining = false;
        clearTimeout(stopTimer);
        fruitBtn.setAttribute('aria-pressed', 'false');
        fruitBtn.setAttribute('aria-label', 'Make it rain fruit');
        fruitLayer.classList.add('out');
        // Let it fade before emptying, or the fruit vanishes mid-air.
        clearTimer = setTimeout(() => fruitLayer.replaceChildren(), FADE_MS);
      };

      const startRain = () => {
        clearTimeout(clearTimer);
        raining = true;
        fruitBtn.setAttribute('aria-pressed', 'true');
        fruitBtn.setAttribute('aria-label', 'Stop the fruit');
        fruitLayer.classList.remove('out');
        seedFruit(fruitLayer, 40);   // a full viewport needs more than the card
        stopTimer = setTimeout(stopRain, RAIN_MS);
      };

      fruitBtn.addEventListener('click', () => (raining ? stopRain() : startRain()));
    }
  }

  /* ---------- Footer year ---------- */

  $('#year').textContent = new Date().getFullYear();
})();
