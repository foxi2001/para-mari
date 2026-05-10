/* ---------------------------------------------------------------------------
 * roses3d.js — Procedural 3D rose garden with Three.js
 *
 * - Petals are parametric surfaces with edge curl + tip bend, vertex-coloured
 *   so the rim catches a paler tone (no shaders needed).
 * - Roses are stacks of petals arranged in spirals (golden-angle); a stem +
 *   2 leaves complete the silhouette.
 * - Cinematic lighting: hemisphere ambient + warm key + cool fill + golden rim.
 *   MeshPhysicalMaterial with sheen + clearcoat gives them a velvety look.
 * - Blooming intro: roses bloom from buds to full open in ~2s.
 * - Mouse / touch parallax: gentle camera tilt + petals lean toward cursor.
 * - Suspended automatically when the canvas is offscreen (IntersectionObserver).
 * - Mobile/reduced-motion downgrades + lazy heavy init.
 * --------------------------------------------------------------------------- */
(() => {
  if (!window.THREE) {
    console.warn('[roses3d] Three.js no cargado — saltando jardín 3D');
    return;
  }
  const THREE = window.THREE;

  // ---- Capability flags (computed once at script load) --------------------
  const IS_MOBILE = (window.innerWidth < 700) ||
    (window.matchMedia && window.matchMedia('(hover: none)').matches);
  const REDUCED_MOTION = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let scene, camera, renderer, clock, canvas;
  let group, bgGroup;
  let raf = 0;
  let visible = false;
  let built = false;          // heavy init done?
  let bloomT = 0;             // 0 -> 1 over the bloom intro
  let mouseX = 0, mouseY = 0;
  let mxLerp = 0, myLerp = 0;
  let resizeObs;
  let io;

  // ---------- Geometry: rose petal -----------------------------------------
  function buildPetalGeometry() {
    // Lower geometry on mobile.
    const wSeg = IS_MOBILE ? 8  : 14;
    const hSeg = IS_MOBILE ? 14 : 22;
    const geo = new THREE.PlaneGeometry(1, 1.6, wSeg, hSeg);
    const pos = geo.attributes.position;
    const colors = [];
    const baseHi = new THREE.Color(0xE8B5BC); // rim highlight (paler)
    const baseLo = new THREE.Color(0xFFFFFF); // multiplied with material colour

    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i);
      let y = pos.getY(i);
      const t = (y + 0.8) / 1.6;          // 0 base -> 1 tip

      // Heart-shape silhouette: width follows a sine curve, narrowing toward the tip
      const widthAtT = Math.sin(Math.PI * Math.min(1, t * 1.05)) * 1.05;
      x = x * widthAtT;

      // Curl backward (carve a cup shape)
      let z = -Math.pow(t, 1.4) * 0.55;

      // Edge curl — petals fold a little at the rim
      const edgeCurl = Math.pow(Math.abs(x), 2) * 0.55 * t;
      z -= edgeCurl;

      // Subtle tip ripples for organic feel
      const wave = Math.sin(x * 6.5) * 0.03 * Math.pow(t, 2.2);
      z += wave;

      // Slight inward droop at the very tip
      if (t > 0.85) z -= (t - 0.85) * 0.4;

      pos.setXYZ(i, x, y, z);

      // Colour: edges + tips a tint paler (looks like sheen catching the light)
      const edgeFactor = Math.pow(Math.abs(x) / Math.max(0.001, widthAtT), 2);
      const tipFactor = Math.pow(t, 2.5);
      const mix = Math.min(1, edgeFactor * 0.7 + tipFactor * 0.5);
      const c = baseLo.clone().lerp(baseHi, mix * 0.55);
      colors.push(c.r, c.g, c.b);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }

  // ---------- Geometry: leaf -----------------------------------------------
  function buildLeafGeometry() {
    const wSeg = IS_MOBILE ? 6  : 8;
    const hSeg = IS_MOBILE ? 10 : 16;
    const geo = new THREE.PlaneGeometry(0.7, 1.4, wSeg, hSeg);
    const pos = geo.attributes.position;
    const colors = [];
    const lo = new THREE.Color(0xFFFFFF);
    const hi = new THREE.Color(0xC8D4B0); // pale silvery green
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i);
      let y = pos.getY(i);
      const t = (y + 0.7) / 1.4;
      // Almond silhouette
      const widthAtT = Math.sin(Math.PI * t) * (1 - 0.25 * Math.abs(t - 0.5));
      x = x * widthAtT;
      // Cup curl + central vein groove
      const z = Math.sin(x * 2) * 0.05 - Math.pow(t - 0.5, 2) * 0.10 - Math.abs(x) * 0.05;
      pos.setXYZ(i, x, y, z);
      const edgeFactor = Math.pow(Math.abs(x) / Math.max(0.001, widthAtT), 2);
      const c = lo.clone().lerp(hi, edgeFactor * 0.5);
      colors.push(c.r, c.g, c.b);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }

  // ---------- Build a complete rose ---------------------------------------
  // Returns a Group whose children carry their full-bloom transform on
  // userData. The animate loop interpolates from a closed-bud state -> full
  // open over the bloomT range so the intro feels alive.
  // `premium` enables clearcoat/transmission (centerpiece only).
  function buildRose(THREE, color, petalGeo, leafGeo, premium) {
    const rose = new THREE.Group();

    const petalMatOpts = {
      color: color,
      vertexColors: true,
      roughness: 0.58,
      metalness: 0,
      sheen: 1,
      sheenRoughness: 0.35,
      sheenColor: new THREE.Color(0xF8D9D1),
      side: THREE.DoubleSide,
    };
    if (premium && !IS_MOBILE) {
      petalMatOpts.clearcoat = 0.25;
      petalMatOpts.clearcoatRoughness = 0.7;
      petalMatOpts.transmission = 0.05;
      petalMatOpts.thickness = 0.4;
    }
    const petalMat = new THREE.MeshPhysicalMaterial(petalMatOpts);

    // Each petal layer: count, size, tilt from vertical, ring radius, vertical offset
    let layers = [
      { count: 4,  scale: 0.45, tilt: 0.08, ringR: 0.00, yOff: 0.10 },
      { count: 5,  scale: 0.62, tilt: 0.45, ringR: 0.05, yOff: 0.05 },
      { count: 6,  scale: 0.82, tilt: 0.85, ringR: 0.16, yOff: 0.00 },
      { count: 8,  scale: 1.00, tilt: 1.25, ringR: 0.30, yOff: -0.06 },
      { count: 10, scale: 1.20, tilt: 1.55, ringR: 0.42, yOff: -0.12 },
      { count: 12, scale: 1.35, tilt: 1.78, ringR: 0.52, yOff: -0.18 },
    ];
    // On mobile drop the outermost 2 layers (saves ~22 petals per rose).
    if (IS_MOBILE) layers = layers.slice(0, 4);

    layers.forEach((layer, li) => {
      // Tiny per-petal random offset so layers don't look synthetic
      for (let i = 0; i < layer.count; i++) {
        const goldenSkew = li * 2.4;
        const a = (i / layer.count) * Math.PI * 2 + goldenSkew + (Math.random() - 0.5) * 0.05;
        const petal = new THREE.Mesh(petalGeo, petalMat);
        const jitter = (Math.random() - 0.5) * 0.08;
        const tilt = layer.tilt + jitter;
        const scale = layer.scale * (1 + (Math.random() - 0.5) * 0.06);
        const ringR = layer.ringR;
        const yOff = layer.yOff;

        // Full-bloom transform (target)
        const targetPos = new THREE.Vector3(Math.cos(a) * ringR, yOff, Math.sin(a) * ringR);
        const targetRot = new THREE.Euler(-tilt, -a + Math.PI, (Math.random() - 0.5) * 0.15);
        const targetScale = scale;

        // Closed-bud transform: petals tucked inward, vertical
        const closedRingR = ringR * 0.10;
        const closedPos = new THREE.Vector3(Math.cos(a) * closedRingR, yOff * 0.3 + 0.05, Math.sin(a) * closedRingR);
        const closedRot = new THREE.Euler(-0.05, -a + Math.PI, 0);
        const closedScale = scale * 0.55;

        petal.userData = {
          targetPos, targetRot, targetScale,
          closedPos, closedRot, closedScale,
          layer: li
        };

        // Start in closed state — animate to target via bloomT
        petal.position.copy(closedPos);
        petal.rotation.copy(closedRot);
        petal.scale.setScalar(closedScale);

        rose.add(petal);
      }
    });

    // Inner bud (small dark sphere centre)
    const bud = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, IS_MOBILE ? 12 : 18, IS_MOBILE ? 10 : 14),
      new THREE.MeshPhysicalMaterial({
        color: 0x4A1722, roughness: 0.7, sheen: 0.5,
        sheenColor: new THREE.Color(0x7B2A3D)
      })
    );
    bud.position.y = 0.10;
    rose.add(bud);

    // Stem: gently curved CatmullRom -> TubeGeometry
    const stemCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -0.20, 0),
      new THREE.Vector3(0.05, -0.55, 0.04),
      new THREE.Vector3(-0.02, -0.95, -0.06),
      new THREE.Vector3(0.04, -1.40, 0.02),
      new THREE.Vector3(0, -1.85, 0.08),
    ]);
    const stem = new THREE.Mesh(
      new THREE.TubeGeometry(stemCurve, IS_MOBILE ? 18 : 28, 0.026, IS_MOBILE ? 6 : 10, false),
      new THREE.MeshStandardMaterial({ color: 0x4F5C3F, roughness: 0.85, metalness: 0 })
    );
    rose.add(stem);

    // Sepal — green tuft just under the bud
    const sepalMat = new THREE.MeshStandardMaterial({ color: 0x4F5C3F, roughness: 0.8, side: THREE.DoubleSide });
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const sep = new THREE.Mesh(
        new THREE.ConeGeometry(0.06, 0.22, 8, 1),
        sepalMat
      );
      sep.position.set(Math.cos(a) * 0.16, -0.18, Math.sin(a) * 0.16);
      sep.rotation.x = 0.6;
      sep.rotation.y = -a;
      sep.rotation.z = Math.PI / 2 + 0.4;
      rose.add(sep);
    }

    // Two leaves on the stem
    const leafMatOpts = {
      color: 0x6F7E5A, vertexColors: true,
      roughness: 0.7, sheen: 0.6,
      sheenColor: new THREE.Color(0xC3D2A5),
      side: THREE.DoubleSide,
    };
    if (premium && !IS_MOBILE) {
      leafMatOpts.clearcoat = 0.15;
      leafMatOpts.clearcoatRoughness = 0.6;
    }
    const leafMat = new THREE.MeshPhysicalMaterial(leafMatOpts);
    [-1, 1].forEach((side, idx) => {
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.position.set(side * 0.12, -0.65 - idx * 0.30, 0);
      leaf.rotation.z = side * 0.55;
      leaf.rotation.y = side * 0.30;
      leaf.scale.setScalar(0.55 + idx * 0.05);
      rose.add(leaf);
    });

    return rose;
  }

  // ---------- Floating petal particles -------------------------------------
  // Sprite-based: 1 plane each, billboarded toward the camera, subtle drift.
  function buildPetalParticles(count) {
    const group = new THREE.Group();
    const petalGeo = new THREE.PlaneGeometry(0.18, 0.28, 1, 1);
    const colors = [0xC24A60, 0xD9A5A0, 0xF2D9D5, 0xE2C888];
    for (let i = 0; i < count; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: colors[(Math.random() * colors.length) | 0],
        transparent: true,
        opacity: 0.55 + Math.random() * 0.35,
        side: THREE.DoubleSide,
      });
      const p = new THREE.Mesh(petalGeo, mat);
      p.position.set(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 5,
        (Math.random() - 0.5) * 6 - 1
      );
      p.userData = {
        vx: -0.05 + Math.random() * 0.1,
        vy: -0.15 - Math.random() * 0.15,
        rotZ: (Math.random() - 0.5) * 0.02,
        sway: Math.random() * Math.PI * 2,
        swaySpeed: 0.5 + Math.random() * 0.8
      };
      p.rotation.set(Math.random(), Math.random(), Math.random() * Math.PI * 2);
      group.add(p);
    }
    return group;
  }

  // ---------- Lifecycle ----------------------------------------------------
  // init() is now lightweight: only allocates renderer + scene + observer.
  // Heavy geometry/mesh build happens in buildScene() the first time the
  // canvas is within ~1 viewport of being visible.
  function init(canvasEl) {
    if (renderer) dispose();
    canvas = canvasEl;

    scene = new THREE.Scene();

    // Sky gradient via fog + clear colour
    scene.background = null;
    scene.fog = new THREE.Fog(0xFAF4EC, 6, 14);

    camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0.6, 5.6);
    camera.lookAt(0, -0.2, 0);

    // Tighter pixel-ratio cap.
    const dprCap = IS_MOBILE ? 1.25 : 1.5;
    const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
    renderer = new THREE.WebGLRenderer({ canvas, antialias: !IS_MOBILE, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(dpr);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    clock = new THREE.Clock();

    onResize();
    if ('ResizeObserver' in window) {
      resizeObs = new ResizeObserver(onResize);
      resizeObs.observe(canvas);
    }
    window.addEventListener('resize', onResize);

    canvas.addEventListener('mousemove', onMouseMove, { passive: true });
    canvas.addEventListener('touchmove', onTouchMove, { passive: true });

    // Lazy build: defer the heavy mesh work until canvas is near viewport.
    // rootMargin gives ~1 viewport of headroom so build finishes before the
    // user scrolls in.
    io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        const wasVisible = visible;
        visible = e.isIntersecting;
        if (visible) {
          if (!built) buildScene();
          if (!wasVisible) {
            if (clock) clock.getDelta(); // discard the gap
            // Reduced-motion: render one frame and stop.
            if (REDUCED_MOTION) {
              renderer.render(scene, camera);
              return;
            }
            animate();
          }
        }
      });
    }, { threshold: 0, rootMargin: '100% 0px 100% 0px' });
    io.observe(canvas);
  }

  // Heavy build (geometries + meshes + lights). Called lazily.
  function buildScene() {
    if (built || !scene) return;
    built = true;

    // ---- Lighting ----
    const hemi = new THREE.HemisphereLight(0xFFE3D0, 0x4F4030, 0.65);
    scene.add(hemi);

    const key = new THREE.DirectionalLight(0xFFE9CF, 1.5);
    key.position.set(2.5, 4, 3);
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xD9A5A0, 0.7);
    fill.position.set(-3, 1.5, -1);
    scene.add(fill);

    const rim = new THREE.PointLight(0xE2C888, 1.2, 8, 1.4);
    rim.position.set(0, 1.4, -2);
    scene.add(rim);

    const accent = new THREE.PointLight(0xA03E52, 0.5, 6, 1.4);
    accent.position.set(0, -0.5, 3);
    scene.add(accent);

    // ---- Build roses ----
    // Shared geometries across all roses (single allocation each).
    const petalGeo = buildPetalGeometry();
    const leafGeo = buildLeafGeometry();
    group = new THREE.Group();
    scene.add(group);

    let placements = [
      { x:  0.0, y:  0.0,  z:  0.0,  s: 1.30, c: 0xA03E52, sway: 0.9 },
      { x: -1.9, y: -0.30, z: -1.0,  s: 0.90, c: 0x7B2A3D, sway: 0.7 },
      { x:  1.7, y: -0.40, z: -0.9,  s: 0.85, c: 0xC24A60, sway: 0.8 },
      { x: -0.9, y:  0.25, z: -2.4,  s: 0.65, c: 0xD9A5A0, sway: 0.6 },
      { x:  1.0, y:  0.30, z: -2.5,  s: 0.62, c: 0x8B3447, sway: 0.65 },
      { x: -2.6, y:  0.05, z: -2.8,  s: 0.55, c: 0xC24A60, sway: 0.5 },
      { x:  2.4, y:  0.10, z: -2.7,  s: 0.55, c: 0xA03E52, sway: 0.55 },
    ];
    // Mobile: 4 roses (centerpiece + 3 supporting) instead of 7.
    if (IS_MOBILE) placements = placements.slice(0, 4);

    placements.forEach((p, i) => {
      // Only the centerpiece (index 0) gets clearcoat/transmission.
      const r = buildRose(THREE, p.c, petalGeo, leafGeo, i === 0);
      r.position.set(p.x, p.y, p.z);
      r.scale.setScalar(p.s);
      r.userData = {
        baseY: p.y,
        baseRotY: 0,
        sway: p.sway,
        phase: Math.random() * Math.PI * 2,
        bloomDelay: i * 0.18  // stagger blooms
      };
      group.add(r);
    });

    // ---- Floating petal particles ----
    const particleCount = IS_MOBILE ? 10 : 28;
    bgGroup = buildPetalParticles(particleCount);
    scene.add(bgGroup);

    bloomT = 0;
  }

  function onResize() {
    if (!canvas || !renderer) return;
    const r = canvas.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / Math.max(1, r.height);
    camera.updateProjectionMatrix();
  }

  function onMouseMove(e) {
    const r = canvas.getBoundingClientRect();
    mouseX = ((e.clientX - r.left) / r.width  - 0.5) * 2;
    mouseY = ((e.clientY - r.top)  / r.height - 0.5) * 2;
  }
  function onTouchMove(e) {
    if (!e.touches[0]) return;
    const r = canvas.getBoundingClientRect();
    mouseX = ((e.touches[0].clientX - r.left) / r.width  - 0.5) * 2;
    mouseY = ((e.touches[0].clientY - r.top)  / r.height - 0.5) * 2;
  }

  // ---- Animate ----
  // Smoothstep easing for the bloom intro
  const ease = (t) => t * t * (3 - 2 * t);

  function animate() {
    if (!visible || !renderer || !built) { raf = 0; return; }
    raf = requestAnimationFrame(animate);
    const dt = Math.min(0.05, clock.getDelta());
    const t = clock.elapsedTime;

    // Bloom intro: 2.4 second open
    if (bloomT < 1) bloomT = Math.min(1, bloomT + dt / 2.4);

    // Mouse parallax (camera tilt)
    mxLerp += (mouseX - mxLerp) * 0.04;
    myLerp += (mouseY - myLerp) * 0.04;
    camera.position.x = mxLerp * 0.6;
    camera.position.y = 0.6 + myLerp * -0.25;
    camera.lookAt(0, -0.1 + myLerp * -0.05, 0);

    // Roses: bloom + sway
    group.children.forEach((rose) => {
      const u = rose.userData;
      const localBloom = Math.max(0, Math.min(1, (bloomT - u.bloomDelay * 0.04) * 1.4));
      const k = ease(localBloom);

      // Rose-level sway
      rose.rotation.y = u.baseRotY + Math.sin(t * 0.4 * u.sway + u.phase) * 0.10
                                    + mxLerp * 0.10;
      rose.rotation.z = Math.sin(t * 0.3 * u.sway + u.phase) * 0.05
                                    + myLerp * -0.05;
      rose.position.y = u.baseY + Math.sin(t * 0.5 * u.sway + u.phase) * 0.04;

      // Each petal: lerp from closed to target driven by k
      rose.children.forEach((child) => {
        const cd = child.userData;
        if (!cd || !cd.targetPos) return;
        child.position.lerpVectors(cd.closedPos, cd.targetPos, k);
        child.rotation.x = cd.closedRot.x + (cd.targetRot.x - cd.closedRot.x) * k;
        child.rotation.y = cd.closedRot.y + (cd.targetRot.y - cd.closedRot.y) * k;
        child.rotation.z = cd.closedRot.z + (cd.targetRot.z - cd.closedRot.z) * k;
        const sLerp = cd.closedScale + (cd.targetScale - cd.closedScale) * k;
        child.scale.setScalar(sLerp);
        // Gentle outer-petal flutter on the most-open layer (skip on mobile).
        if (!IS_MOBILE && cd.layer >= 4 && k > 0.95) {
          child.rotation.x += Math.sin(t * 1.2 + cd.layer * 0.3) * 0.012;
        }
      });
    });

    // Petal particles
    bgGroup.children.forEach((p) => {
      const ud = p.userData;
      ud.sway += dt * ud.swaySpeed;
      p.position.x += (ud.vx + Math.sin(ud.sway) * 0.4) * dt;
      p.position.y += ud.vy * dt;
      p.rotation.z += ud.rotZ;
      p.rotation.y += dt * 0.4;
      if (p.position.y < -3.5) {
        p.position.y = 3.5;
        p.position.x = (Math.random() - 0.5) * 8;
      }
      if (p.position.x < -5) p.position.x = 5;
      if (p.position.x > 5) p.position.x = -5;
    });

    renderer.render(scene, camera);
  }

  function dispose() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    if (resizeObs) { try { resizeObs.disconnect(); } catch {} resizeObs = null; }
    if (io) { try { io.disconnect(); } catch {} io = null; }
    window.removeEventListener('resize', onResize);
    if (canvas) {
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('touchmove', onTouchMove);
    }
    if (scene) {
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose && obj.geometry.dispose();
        if (obj.material) {
          const m = Array.isArray(obj.material) ? obj.material : [obj.material];
          m.forEach((mm) => mm.dispose && mm.dispose());
        }
      });
    }
    if (renderer) renderer.dispose();
    scene = camera = renderer = canvas = group = bgGroup = null;
    built = false;
  }

  window.RoseGarden = { init, dispose };
})();
