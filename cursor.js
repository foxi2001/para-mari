// Custom cursor: smooth ring + magnetic targets + label + click pulse
(function () {
  const ring = document.getElementById('cursor-ring');
  const dot  = document.getElementById('cursor-dot');
  if (!ring || !dot) return;
  const labelEl = ring.querySelector('.label');

  // No cursor logic on touch devices — CSS hides it but JS would still run.
  const IS_TOUCH = window.matchMedia && window.matchMedia('(hover: none)').matches;
  if (IS_TOUCH) return;

  let mx = window.innerWidth / 2, my = window.innerHeight / 2;
  let rx = mx, ry = my;
  let active = false;

  // GPU promotion hint (without touching CSS, which is owned by HTML).
  ring.style.willChange = 'left, top, transform';
  dot.style.willChange = 'left, top';

  window.addEventListener('mousemove', (e) => {
    mx = e.clientX; my = e.clientY;
    if (!active) {
      dot.style.left = mx + 'px'; dot.style.top = my + 'px';
      active = true;
    }
  }, { passive: true });

  document.addEventListener('mouseenter', () => { ring.style.opacity = 1; dot.style.opacity = 1; });
  document.addEventListener('mouseleave', () => { ring.style.opacity = 0; dot.style.opacity = 0; });

  document.addEventListener('mousedown', () => ring.classList.add('click'));
  document.addEventListener('mouseup',   () => ring.classList.remove('click'));

  const HOVER_SEL = 'a, button, .reason-card, .heart-button, image-slot, .frame, .tl-card, .play-btn, .audio-toggle, [data-cursor]';

  document.addEventListener('mouseover', (e) => {
    const t = e.target.closest(HOVER_SEL);
    if (t) {
      const labelAttr = t.getAttribute && t.getAttribute('data-label');
      if (labelAttr) {
        ring.classList.add('text');
        ring.classList.remove('hover');
        if (labelEl) labelEl.textContent = labelAttr;
      } else {
        ring.classList.add('hover');
        ring.classList.remove('text');
      }
    } else {
      ring.classList.remove('hover', 'text');
    }
  });

  /* ---- Magnetic effect ---- */
  // Cache rect per magnet, refresh on resize/scroll only.
  const magnets = [];   // { el, cx, cy, range }
  let rectsDirty = true;

  function refreshMagnets() {
    magnets.length = 0;
    document.querySelectorAll('[data-magnetic]').forEach((el) => {
      magnets.push({ el, cx: 0, cy: 0, range: 0 });
    });
    rectsDirty = true;
  }
  function refreshRects() {
    for (let i = 0; i < magnets.length; i++) {
      const m = magnets[i];
      const r = m.el.getBoundingClientRect();
      m.cx = r.left + r.width / 2;
      m.cy = r.top + r.height / 2;
      m.range = Math.max(r.width, r.height) * 1.2;
    }
    rectsDirty = false;
  }
  window.addEventListener('load', refreshMagnets);
  window.addEventListener('resize', () => { rectsDirty = true; }, { passive: true });
  window.addEventListener('scroll', () => { rectsDirty = true; }, { passive: true });
  setTimeout(refreshMagnets, 800);
  setTimeout(refreshMagnets, 2200);

  function applyMagnetism() {
    if (rectsDirty) refreshRects();
    for (let i = 0; i < magnets.length; i++) {
      const m = magnets[i];
      const dx = mx - m.cx, dy = my - m.cy;
      const dist = Math.hypot(dx, dy);
      if (dist < m.range) {
        const k = 0.28 * (1 - dist / m.range);
        m.el.style.transform = `translate3d(${dx * k}px, ${dy * k}px, 0)`;
      } else if (m.el.style.transform) {
        m.el.style.transform = '';
      }
    }
  }

  // Throttle magnetism to ~30fps (every other rAF tick).
  let tick = 0;
  function loop() {
    rx += (mx - rx) * 0.18;
    ry += (my - ry) * 0.18;
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    dot.style.left  = mx + 'px';
    dot.style.top   = my + 'px';
    if ((tick++ & 1) === 0) applyMagnetism();
    requestAnimationFrame(loop);
  }
  loop();
})();
