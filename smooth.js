// Smooth scroll (Lenis-lite), scroll progress, side index, nav blur
(function () {
  /* ---------- SMOOTH SCROLL (lerp) ---------- */
  const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia && window.matchMedia('(hover: none)').matches;

  if (!reducedMotion && !isTouch) {
    let target = window.scrollY || 0;
    let current = target;
    let raf = 0;
    const ease = 0.085;

    function clamp() {
      const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      target = Math.max(0, Math.min(max, target));
    }

    function tick() {
      const dy = target - current;
      if (Math.abs(dy) > 0.4) {
        current += dy * ease;
        window.scrollTo(0, current);
        raf = requestAnimationFrame(tick);
      } else {
        current = target;
        window.scrollTo(0, current);
        raf = 0;
      }
    }
    function kick() {
      if (!raf) raf = requestAnimationFrame(tick);
    }

    // Clamp violent trackpad gestures so a single fling can't overshoot wildly.
    const MAX_DELTA = 240;

    window.addEventListener('wheel', (e) => {
      // Don't intercept when the wheel applies to an element with its OWN
      // vertical scroll (deltaY would belong to the inner scroller).
      let el = e.target;
      while (el && el !== document.body) {
        const cs = getComputedStyle(el);
        const yScrolls = (cs.overflowY === 'auto' || cs.overflowY === 'scroll') && el.scrollHeight > el.clientHeight + 4;
        if (yScrolls) return;
        el = el.parentElement;
      }
      e.preventDefault();
      let dy = e.deltaY;
      if (dy >  MAX_DELTA) dy =  MAX_DELTA;
      if (dy < -MAX_DELTA) dy = -MAX_DELTA;
      target += dy;
      clamp(); kick();
    }, { passive: false });

    // keyboard
    window.addEventListener('keydown', (e) => {
      const map = { ArrowDown: 80, ArrowUp: -80, PageDown: window.innerHeight * 0.85, PageUp: -window.innerHeight * 0.85, Home: -1e9, End: 1e9, Space: window.innerHeight * 0.85 };
      if (e.key in map) {
        if (['INPUT', 'TEXTAREA'].includes(document.activeElement && document.activeElement.tagName)) return;
        e.preventDefault();
        target = (e.key === 'Home') ? 0 : (e.key === 'End') ? 1e9 : (current + map[e.key]);
        clamp(); kick();
      }
    });

    // anchors
    document.addEventListener('click', (e) => {
      const a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href').slice(1);
      if (!id) return;
      const t = document.getElementById(id);
      if (!t) return;
      e.preventDefault();
      const r = t.getBoundingClientRect();
      target = current + r.top;
      clamp(); kick();
    });

    // sync if user uses scrollbar drag
    let lastY = window.scrollY;
    window.addEventListener('scroll', () => {
      if (!raf) { lastY = window.scrollY; current = lastY; target = lastY; }
    }, { passive: true });
  }

  /* ---------- SCROLL PROGRESS BAR ---------- */
  const bar = document.querySelector('#scroll-prog .bar');
  const nav = document.querySelector('nav.top');
  function updProg() {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    const p = Math.max(0, Math.min(1, window.scrollY / Math.max(1, h)));
    if (bar) bar.style.width = (p * 100) + '%';
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 60);
  }
  window.addEventListener('scroll', updProg, { passive: true });
  window.addEventListener('resize', updProg);
  updProg();

  /* ---------- SIDE INDEX ACTIVE STATE ---------- */
  const indexLinks = document.querySelectorAll('.side-index a');
  function updIndex() {
    let active = null;
    let bestScore = Infinity;
    indexLinks.forEach((a) => {
      const id = a.getAttribute('href').slice(1);
      const t = document.getElementById(id);
      if (!t) return;
      const r = t.getBoundingClientRect();
      const score = Math.abs(r.top - window.innerHeight * 0.35);
      if (score < bestScore) { bestScore = score; active = a; }
    });
    indexLinks.forEach((a) => a.classList.toggle('active', a === active));
  }
  window.addEventListener('scroll', updIndex, { passive: true });
  window.addEventListener('resize', updIndex);
  setTimeout(updIndex, 200);
})();
