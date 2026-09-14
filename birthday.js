/* =========================================================
   Birthday overlay — a temporary gag.
   Opens on load, rains fruit (her plays are the Fruit series),
   and the cake has trick candles.
   ========================================================= */

(() => {
  'use strict';

  const overlay = document.getElementById('bday');
  const replayBtn = document.getElementById('bday-replay');
  if (!overlay) return;

  /* ---------- Retire the gag ----------
     From this date on, nothing birthday-related shows: no card on load, and
     no cake button in the nav. Change the date to bring it back next year
     (month is 0-indexed, so 9 = October). */
  const RETIRE_ON = new Date(2026, 9, 1, 0, 0, 0);   // 1 October 2026, local time

  if (new Date() >= RETIRE_ON) {
    overlay.remove();
    replayBtn?.remove();
    return;
  }

  replayBtn?.removeAttribute('hidden');   // only shown while the gag is live

  const card = overlay.querySelector('.bday-card');
  const cake = overlay.querySelector('.bday-cake');
  const hint = overlay.querySelector('.bday-hint');
  const closeBtn = overlay.querySelector('.bday-close');
  const fruitLayer = overlay.querySelector('.bday-fruit');
  const replay = replayBtn;

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rand = (min, max) => Math.random() * (max - min) + min;

  // The fruit mix and the falling-piece layout live in script.js, so the nav
  // button can still rain fruit after this file retires itself. Fall back to a
  // bare piece if script.js is missing, rather than throwing mid-animation.
  const { makePiece, seedFruit } = window.__fruit ?? {
    makePiece: () => Object.assign(document.createElement('i'), { className: 'pom' }),
    seedFruit: () => {},
  };

  let blowAttempts = 0;
  let lastFocus = null;
  let isOpen = false;
  let hideTimer;

  // Shared with the nav menu so the two can't fight over the body's scroll
  // state; falls back to a local no-op lock if script.js didn't load.
  const scrollLock = window.__scrollLock ?? {
    hold() { document.body.style.overflow = 'hidden'; },
    release() { document.body.style.overflow = ''; },
  };

  /* ---------- Falling fruit ---------- */

  function rainFruit(count = 26) {
    if (reduceMotion) return;
    seedFruit(fruitLayer, count);
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

  function blow() {
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

    // Tracked explicitly rather than read off overlay.hidden, which lags the
    // close by the fade-out — replaying inside that window would otherwise
    // take the lock twice, or not at all.
    if (!isOpen) { isOpen = true; scrollLock.hold(); }
    clearTimeout(hideTimer);   // a replay mid-fade must not be re-hidden
    overlay.hidden = false;
    overlay.classList.remove('closing');
    rainFruit();

    setTimeout(() => closeBtn.focus({ preventScroll: true }), 400);
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    overlay.classList.add('closing');
    scrollLock.release();

    hideTimer = setTimeout(() => {
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
