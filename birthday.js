/* =========================================================
   Birthday overlay — a temporary gag.
   Opens on load, rains fruit (her plays are the Fruit series),
   and the cake has trick candles.
   ========================================================= */

(() => {
  'use strict';

  const overlay = document.getElementById('bday');
  if (!overlay) return;

  const card = overlay.querySelector('.bday-card');
  const cake = overlay.querySelector('.bday-cake');
  const hint = overlay.querySelector('.bday-hint');
  const closeBtn = overlay.querySelector('.bday-close');
  const fruitLayer = overlay.querySelector('.bday-fruit');
  const replay = document.getElementById('bday-replay');

  const FRUIT = ['🍇', '🍊', '🍋', '🍑', '🍒', '🍓', '🥝', '🍍', '🍎', '🍐', '🥭', '🍌'];
  // Pomegranates are the favourite, so they fall more often than anything else.
  // Unicode has no pomegranate, so .pom is a drawn SVG (see birthday.css).
  const POM_SHARE = 0.35;
  // How long the card stays up with no interaction. Each tap resets it.
  const IDLE_CLOSE_MS = 60000;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rand = (min, max) => Math.random() * (max - min) + min;
  const pick = (a) => a[Math.floor(Math.random() * a.length)];

  function makePiece() {
    const el = document.createElement('i');
    if (Math.random() < POM_SHARE) el.className = 'pom';
    else el.textContent = pick(FRUIT);
    return el;
  }

  let blowAttempts = 0;
  let autoCloseTimer;
  let lastFocus = null;

  /* ---------- Falling fruit ---------- */

  function rainFruit(count = 26) {
    if (reduceMotion) return;
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
    fruitLayer.replaceChildren(frag);
  }

  /* ---------- Fruit burst out of the cake ---------- */

  function burst(count = 22) {
    const layer = document.createElement('div');
    layer.className = 'bday-burst';
    layer.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + rand(-0.2, 0.2);
      const dist = rand(90, 240);
      const p = makePiece();
      p.style.setProperty('--size', `${rand(18, 28).toFixed(0)}px`);
      p.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
      p.style.setProperty('--dy', `${Math.sin(angle) * dist - 40}px`);
      p.style.setProperty('--spin', `${rand(-540, 540).toFixed(0)}deg`);
      layer.appendChild(p);
    }
    cake.appendChild(layer);
    setTimeout(() => layer.remove(), 1800);
  }

  /* ---------- The candle gag ---------- */

  function setHint(html) {
    hint.innerHTML = html;
    hint.classList.remove('swap');
    void hint.offsetWidth; // restart the swap animation
    hint.classList.add('swap');
  }

  function armAutoClose() {
    clearTimeout(autoCloseTimer);
    autoCloseTimer = setTimeout(close, IDLE_CLOSE_MS);
  }

  function blow() {
    armAutoClose(); // playing with the candles buys another minute
    blowAttempts += 1;

    if (blowAttempts === 1) {
      cake.classList.remove('relight');
      cake.classList.add('out');
      setHint('<b>Nice lungs.</b>');

      // …trick candles.
      setTimeout(() => {
        cake.classList.remove('out');
        cake.classList.add('relight');
        setHint('<b>Trick candles, obviously.</b>Try again — the audience is waiting.');
      }, 1300);
      return;
    }

    if (blowAttempts === 2) {
      cake.classList.remove('relight');
      cake.classList.add('out');
      cake.disabled = true;
      burst();
      setHint(
        '<span class="stars">★★★★★</span>' +
        '<b>“A powderkeg of a birthday.”</b>' +
        '<span class="cite">— the imaginary press, tonight only</span>'
      );
      closeBtn.textContent = 'Now go write Act Two';
      closeBtn.classList.add('primary');
      closeBtn.focus();
    }
  }

  /* ---------- Open / close ---------- */

  function open() {
    lastFocus = document.activeElement;
    blowAttempts = 0;
    cake.disabled = false;
    cake.classList.remove('out', 'relight');
    closeBtn.textContent = 'Skip the fuss';
    closeBtn.classList.remove('primary');
    hint.innerHTML = '<b>Blow out the candles.</b>Tap the cake.';

    overlay.hidden = false;
    overlay.classList.remove('closing');
    document.body.style.overflow = 'hidden';
    rainFruit();

    setTimeout(() => closeBtn.focus({ preventScroll: true }), 400);

    // Never hold the site hostage forever if nobody plays along.
    armAutoClose();
  }

  function close() {
    clearTimeout(autoCloseTimer);
    if (overlay.hidden) return;
    overlay.classList.add('closing');
    document.body.style.overflow = '';

    setTimeout(() => {
      overlay.hidden = true;
      overlay.classList.remove('closing');
      fruitLayer.replaceChildren();
      if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
    }, reduceMotion ? 0 : 500);
  }

  /* ---------- Wiring ---------- */

  cake.addEventListener('click', blow);
  closeBtn.addEventListener('click', close);
  overlay.querySelector('.bday-scrim').addEventListener('click', close);
  if (replay) replay.addEventListener('click', open);

  document.addEventListener('keydown', (e) => {
    if (overlay.hidden) return;
    if (e.key === 'Escape') { close(); return; }
    // Keep focus inside the card while it's up.
    if (e.key === 'Tab') {
      const focusable = [cake, closeBtn].filter((el) => !el.disabled);
      const i = focusable.indexOf(document.activeElement);
      e.preventDefault();
      focusable[(i + (e.shiftKey ? -1 : 1) + focusable.length) % focusable.length]?.focus();
    }
  });

  open();
})();
