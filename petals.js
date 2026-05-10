// Pétalos + bokeh + mariposas — partículas en capas, bajo CPU.
(function () {
  const petalCanvas = document.getElementById('petal-canvas');
  const bokehCanvas = document.getElementById('bokeh-canvas');
  if (!petalCanvas || !bokehCanvas) return;
  const pctx = petalCanvas.getContext('2d');
  const bctx = bokehCanvas.getContext('2d');
  let W = 0, H = 0;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let mx = 0, my = 0; // for slight cursor influence

  // Capability flags
  const IS_MOBILE = window.innerWidth < 700 ||
    (window.matchMedia && window.matchMedia('(hover: none)').matches);
  const REDUCED_MOTION = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function resize() {
    W = window.innerWidth; H = window.innerHeight;
    [petalCanvas, bokehCanvas].forEach((c) => {
      c.width = W * dpr; c.height = H * dpr;
      c.style.width = W + 'px'; c.style.height = H + 'px';
    });
    pctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('mousemove', (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });

  /* ---------- BOKEH ---------- */
  // Halved counts.
  const BOKEH_COUNT = IS_MOBILE ? 10 : 18;
  const bokehs = [];
  const BOKEH_COLORS = [
    'rgba(217,165,160,0.22)',
    'rgba(184,146,78,0.16)',
    'rgba(160,62,82,0.14)',
    'rgba(255,249,238,0.18)'
  ];
  for (let i = 0; i < BOKEH_COUNT; i++) {
    bokehs.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: 30 + Math.random() * 110,
      vx: -0.05 + Math.random() * 0.1,
      vy: -0.04 + Math.random() * 0.08,
      hue: BOKEH_COLORS[(Math.random() * BOKEH_COLORS.length) | 0],
      pulsePhase: Math.random() * Math.PI * 2,
      pulse: 0.4 + Math.random() * 0.6
    });
  }

  function drawBokeh(b) {
    const grad = bctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
    grad.addColorStop(0, b.hue);
    grad.addColorStop(1, 'transparent');
    bctx.fillStyle = grad;
    bctx.beginPath();
    bctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    bctx.fill();
  }

  /* ---------- PETALS ---------- */
  // Halved counts.
  const PETAL_COUNT = IS_MOBILE ? 14 : 24;
  const PETAL_COLORS = [
    'rgba(217,165,160,0.85)',
    'rgba(242,217,213,0.85)',
    'rgba(184,146,78,0.55)',
    'rgba(160,62,82,0.55)',
    'rgba(255,249,238,0.85)'
  ];

  const petals = [];
  for (let i = 0; i < PETAL_COUNT; i++) petals.push(makePetal(true));

  function makePetal(initial) {
    const size = 5 + Math.random() * 16;
    const depth = 0.5 + Math.random() * 1.5; // depth multiplier 0.5..2
    return {
      x: Math.random() * W,
      y: initial ? Math.random() * H : -20 - Math.random() * 80,
      size,
      depth,
      vy: (0.25 + Math.random() * 0.6 + size * 0.018) * depth,
      vx: (-0.4 + Math.random() * 0.8) * depth,
      rot: Math.random() * Math.PI * 2,
      vRot: -0.018 + Math.random() * 0.036,
      sway: Math.random() * 0.018 + 0.005,
      swayPhase: Math.random() * Math.PI * 2,
      color: PETAL_COLORS[(Math.random() * PETAL_COLORS.length) | 0],
      flutter: 0.4 + Math.random() * 0.6
    };
  }

  function drawPetal(p) {
    pctx.save();
    pctx.translate(p.x, p.y);
    pctx.rotate(p.rot);
    pctx.scale(p.flutter, 1);
    pctx.fillStyle = p.color;
    pctx.beginPath();
    pctx.moveTo(0, -p.size);
    pctx.bezierCurveTo(p.size * 0.6, -p.size * 0.6, p.size * 0.6, p.size * 0.4, 0, p.size);
    pctx.bezierCurveTo(-p.size * 0.6, p.size * 0.4, -p.size * 0.6, -p.size * 0.6, 0, -p.size);
    pctx.fill();
    pctx.strokeStyle = 'rgba(160,62,82,0.18)';
    pctx.lineWidth = 0.6;
    pctx.beginPath();
    pctx.moveTo(0, -p.size * 0.8);
    pctx.lineTo(0, p.size * 0.8);
    pctx.stroke();
    pctx.restore();
  }

  /* ---------- BUTTERFLIES (rare) ---------- */
  // Halved: desktop 1, mobile 0.
  const BUTTERFLY_COUNT = IS_MOBILE ? 0 : 1;
  const butters = [];
  for (let i = 0; i < BUTTERFLY_COUNT; i++) butters.push(makeButter());

  function makeButter() {
    return {
      x: Math.random() * W,
      y: 80 + Math.random() * (H - 200),
      vx: (Math.random() < 0.5 ? -1 : 1) * (0.4 + Math.random() * 0.6),
      vy: -0.2 + Math.random() * 0.4,
      size: 14 + Math.random() * 10,
      flap: Math.random() * Math.PI * 2,
      flapSpeed: 0.18 + Math.random() * 0.12,
      hue: ['#A03E52', '#D9A5A0', '#B8924E'][(Math.random() * 3) | 0],
      target: { x: Math.random() * W, y: 100 + Math.random() * (H - 200) },
      since: 0
    };
  }

  function drawButterfly(b) {
    pctx.save();
    pctx.translate(b.x, b.y);
    pctx.rotate(Math.atan2(b.vy, b.vx) * 0.3);
    const w = b.size;
    const f = Math.abs(Math.sin(b.flap));
    pctx.fillStyle = b.hue;
    pctx.globalAlpha = .8;
    // upper wings
    pctx.beginPath();
    pctx.ellipse(-w * (0.4 + 0.4 * (1 - f)), -w * 0.5, w * (0.3 + 0.4 * (1 - f)), w * 0.6, -0.4, 0, Math.PI * 2);
    pctx.fill();
    pctx.beginPath();
    pctx.ellipse(w * (0.4 + 0.4 * (1 - f)), -w * 0.5, w * (0.3 + 0.4 * (1 - f)), w * 0.6, 0.4, 0, Math.PI * 2);
    pctx.fill();
    // lower wings
    pctx.fillStyle = b.hue;
    pctx.globalAlpha = .55;
    pctx.beginPath();
    pctx.ellipse(-w * (0.3 + 0.3 * (1 - f)), w * 0.2, w * 0.3, w * 0.4, -0.4, 0, Math.PI * 2);
    pctx.fill();
    pctx.beginPath();
    pctx.ellipse(w * (0.3 + 0.3 * (1 - f)), w * 0.2, w * 0.3, w * 0.4, 0.4, 0, Math.PI * 2);
    pctx.fill();
    pctx.globalAlpha = 1;
    // body
    pctx.fillStyle = '#2B1F1A';
    pctx.beginPath();
    pctx.ellipse(0, 0, w * 0.08, w * 0.55, 0, 0, Math.PI * 2);
    pctx.fill();
    pctx.restore();
  }

  /* ---------- LOOP ---------- */
  let last = performance.now();
  let bphase = 0;
  let bokehAcc = 0;            // bokeh frame accumulator (30fps target)
  const BOKEH_INTERVAL = 1000 / 30;
  let pageHidden = false;
  let rafId = 0;

  // Skip rendering while the boot loader still covers the screen.
  function bootCovers() {
    const boot = document.getElementById('boot');
    return !!(boot && !boot.classList.contains('gone'));
  }

  function tick(now) {
    rafId = requestAnimationFrame(tick);
    if (pageHidden) return;
    if (bootCovers()) return;

    const dt = Math.min(40, now - last); last = now;
    bphase += dt * 0.0006;

    // Bokeh layer (throttled to 30fps).
    bokehAcc += dt;
    if (bokehAcc >= BOKEH_INTERVAL) {
      bokehAcc = 0;
      bctx.clearRect(0, 0, W, H);
      for (let i = 0; i < bokehs.length; i++) {
        const b = bokehs[i];
        b.x += b.vx; b.y += b.vy;
        b.pulsePhase += 0.01;
        // wraparound
        if (b.x < -b.r) b.x = W + b.r;
        if (b.x > W + b.r) b.x = -b.r;
        if (b.y < -b.r) b.y = H + b.r;
        if (b.y > H + b.r) b.y = -b.r;
        const s = 0.85 + Math.sin(b.pulsePhase) * 0.15;
        const r0 = b.r;
        b.r = r0 * s;
        drawBokeh(b);
        b.r = r0;
      }
    }

    // Petal layer
    pctx.clearRect(0, 0, W, H);
    for (let i = 0; i < petals.length; i++) {
      const p = petals[i];
      p.swayPhase += p.sway * dt * 0.06;
      // very subtle cursor influence on near petals
      const dx = (p.x - mx); const dy = (p.y - my);
      const dist2 = dx * dx + dy * dy;
      let push = 0;
      if (dist2 < 26000) {
        push = (1 - dist2 / 26000) * 0.45;
        // Single sqrt reused for both axes.
        const invD = 1 / Math.sqrt(dist2 + 1);
        p.x += p.vx + Math.sin(p.swayPhase) * 0.6 + dx * invD * push;
        p.y += p.vy * (dt / 16) + dy * invD * push * 0.6;
      } else {
        p.x += p.vx + Math.sin(p.swayPhase) * 0.6;
        p.y += p.vy * (dt / 16);
      }
      p.rot += p.vRot;
      p.flutter = 0.4 + Math.abs(Math.sin(p.swayPhase * 2)) * 0.6;
      if (p.y > H + 30 || p.x < -30 || p.x > W + 30) {
        Object.assign(p, makePetal(false));
        p.x = Math.random() * W;
      }
      drawPetal(p);
    }

    // Butterflies
    for (let i = 0; i < butters.length; i++) {
      const b = butters[i];
      b.flap += b.flapSpeed;
      b.since += dt;
      // re-target every ~4s
      if (b.since > 4000) {
        b.target = { x: Math.random() * W, y: 100 + Math.random() * (H - 200) };
        b.since = 0;
      }
      const tx = (b.target.x - b.x);
      const ty = (b.target.y - b.y);
      const td = Math.hypot(tx, ty) + 1;
      b.vx += (tx / td) * 0.04 - b.vx * 0.02;
      b.vy += (ty / td) * 0.04 - b.vy * 0.02 + Math.sin(b.flap * 0.4) * 0.04;
      b.vx = Math.max(-1.2, Math.min(1.2, b.vx));
      b.vy = Math.max(-1.0, Math.min(1.0, b.vy));
      b.x += b.vx * (dt / 16);
      b.y += b.vy * (dt / 16);
      // wraparound
      if (b.x < -50) b.x = W + 50;
      if (b.x > W + 50) b.x = -50;
      if (b.y < -50) b.y = H + 50;
      if (b.y > H + 50) b.y = -50;
      drawButterfly(b);
    }
  }

  // Pause on page hidden.
  document.addEventListener('visibilitychange', () => {
    pageHidden = document.hidden;
    if (!pageHidden) last = performance.now();
  });

  // Reduced motion: paint a single static frame and bail.
  if (REDUCED_MOTION) {
    // Draw one frame after the loader is gone.
    const drawOnce = () => {
      if (bootCovers()) { setTimeout(drawOnce, 250); return; }
      bctx.clearRect(0, 0, W, H);
      for (let i = 0; i < bokehs.length; i++) drawBokeh(bokehs[i]);
      pctx.clearRect(0, 0, W, H);
      for (let i = 0; i < petals.length; i++) drawPetal(petals[i]);
      for (let i = 0; i < butters.length; i++) drawButterfly(butters[i]);
    };
    drawOnce();
    return;
  }

  rafId = requestAnimationFrame(tick);
})();
