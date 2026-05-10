// Bouquet, Timeline, Quotes, Recipe, Music, Constellation, Gift, Finale
const { useState, useEffect, useRef, useCallback } = React;

/* ===========  BOUQUET DIVIDER  =========== */
function Bouquet({ flip = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { el.classList.add('in'); io.unobserve(el); }
      });
    }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div className="bouquet" ref={ref} style={flip ? { transform: 'scaleX(-1)' } : null}>
      <svg viewBox="0 0 720 180" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path className="stem" d="M360 178 Q 360 130 360 80" stroke="var(--leaf)" strokeWidth="1.4" strokeLinecap="round" />
        <path className="stem" d="M360 178 Q 280 130 220 90" stroke="var(--leaf)" strokeWidth="1.2" strokeLinecap="round" />
        <path className="stem" d="M360 178 Q 440 130 500 90" stroke="var(--leaf)" strokeWidth="1.2" strokeLinecap="round" />
        <path className="stem" d="M360 178 Q 320 140 280 110" stroke="var(--leaf)" strokeWidth="1" strokeLinecap="round" />
        <path className="stem" d="M360 178 Q 400 140 440 110" stroke="var(--leaf)" strokeWidth="1" strokeLinecap="round" />
        <path className="stem" d="M360 178 Q 200 140 140 100" stroke="var(--leaf)" strokeWidth="0.9" strokeLinecap="round" />
        <path className="stem" d="M360 178 Q 520 140 580 100" stroke="var(--leaf)" strokeWidth="0.9" strokeLinecap="round" />

        <g className="bloom" style={{ transformOrigin: '320px 130px', transitionDelay: '500ms' }}>
          <path d="M320 130 q -28 -6 -36 -28 q 22 -2 36 28 z" fill="var(--leaf)" opacity=".8" />
        </g>
        <g className="bloom" style={{ transformOrigin: '400px 130px', transitionDelay: '600ms' }}>
          <path d="M400 130 q 28 -6 36 -28 q -22 -2 -36 28 z" fill="var(--leaf)" opacity=".8" />
        </g>
        <g className="bloom" style={{ transformOrigin: '260px 145px', transitionDelay: '650ms' }}>
          <path d="M260 145 q -22 -2 -28 -20 q 18 -4 28 20 z" fill="var(--leaf-deep)" opacity=".7" />
        </g>
        <g className="bloom" style={{ transformOrigin: '460px 145px', transitionDelay: '700ms' }}>
          <path d="M460 145 q 22 -2 28 -20 q -18 -4 -28 20 z" fill="var(--leaf-deep)" opacity=".7" />
        </g>

        {/* Center rose */}
        <g className="bloom" style={{ transformOrigin: '360px 70px', transitionDelay: '800ms' }}>
          <circle cx="360" cy="70" r="26" fill="var(--rose-soft)" />
          <circle cx="360" cy="70" r="20" fill="var(--rose)" />
          <circle cx="360" cy="70" r="13" fill="var(--rose-deep)" />
          <circle cx="360" cy="70" r="6" fill="var(--gold)" />
          <path d="M360 60 q -7 5 -7 12 q 0 6 7 8 q 7 -2 7 -8 q 0 -7 -7 -12 z" fill="rgba(255,255,255,.18)" />
        </g>
        <g className="bloom" style={{ transformOrigin: '220px 80px', transitionDelay: '1000ms' }}>
          <circle cx="220" cy="80" r="18" fill="var(--rose-soft)" />
          <circle cx="220" cy="80" r="11" fill="var(--rose)" />
          <circle cx="220" cy="80" r="4" fill="var(--gold)" />
        </g>
        <g className="bloom" style={{ transformOrigin: '500px 80px', transitionDelay: '1100ms' }}>
          <circle cx="500" cy="80" r="18" fill="var(--rose-soft)" />
          <circle cx="500" cy="80" r="11" fill="var(--rose)" />
          <circle cx="500" cy="80" r="4" fill="var(--gold)" />
        </g>

        <g className="bloom" style={{ transformOrigin: '140px 100px', transitionDelay: '1200ms' }}>
          <circle cx="140" cy="100" r="10" fill="var(--rose-tint)" />
          <circle cx="140" cy="100" r="5" fill="var(--rose-soft)" />
        </g>
        <g className="bloom" style={{ transformOrigin: '580px 100px', transitionDelay: '1250ms' }}>
          <circle cx="580" cy="100" r="10" fill="var(--rose-tint)" />
          <circle cx="580" cy="100" r="5" fill="var(--rose-soft)" />
        </g>

        <g className="bloom" style={{ transformOrigin: '280px 100px', transitionDelay: '1300ms' }}>
          <circle cx="280" cy="100" r="6" fill="var(--gold-soft)" />
          <circle cx="280" cy="100" r="3" fill="var(--gold)" />
        </g>
        <g className="bloom" style={{ transformOrigin: '440px 100px', transitionDelay: '1400ms' }}>
          <circle cx="440" cy="100" r="6" fill="var(--gold-soft)" />
          <circle cx="440" cy="100" r="3" fill="var(--gold)" />
        </g>
        <g className="bloom" style={{ transformOrigin: '320px 50px', transitionDelay: '1500ms' }}>
          <circle cx="320" cy="50" r="4" fill="var(--rose-soft)" />
        </g>
        <g className="bloom" style={{ transformOrigin: '400px 50px', transitionDelay: '1600ms' }}>
          <circle cx="400" cy="50" r="4" fill="var(--rose-soft)" />
        </g>

        {/* ribbon */}
        <g className="bloom" style={{ transformOrigin: '360px 165px', transitionDelay: '1800ms' }}>
          <path d="M345 162 q 15 -6 30 0 l -2 14 q -13 4 -26 0 z" fill="var(--gold)" />
          <path d="M345 162 q -8 8 -16 6" stroke="var(--gold)" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M375 162 q 8 8 16 6" stroke="var(--gold)" strokeWidth="2" fill="none" strokeLinecap="round" />
          <circle cx="360" cy="166" r="3" fill="var(--gold-deep)" />
        </g>
      </svg>
    </div>
  );
}

/* ===========  3D ROSE GARDEN  =========== */
function RoseGarden3D() {
  const ref = useReveal(0.05);
  const canvasRef = useRef(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (!window.THREE || !window.RoseGarden) {
      setSupported(false);
      return;
    }
    // WebGL availability check
    try {
      const tc = document.createElement('canvas');
      const gl = tc.getContext('webgl2') || tc.getContext('webgl');
      if (!gl) { setSupported(false); return; }
    } catch { setSupported(false); return; }

    if (canvasRef.current) {
      // Defer one frame so the canvas has its layout box.
      requestAnimationFrame(() => {
        try { window.RoseGarden.init(canvasRef.current); }
        catch (err) { console.warn('[garden]', err); setSupported(false); }
      });
    }
    return () => { try { window.RoseGarden.dispose && window.RoseGarden.dispose(); } catch {} };
  }, []);

  const chips = c('garden.chips', ['Three.js · WebGL', 'Pétalos paramétricos', 'Iluminación cinematográfica', 'Para Mari · con cariño']);

  return (
    <section id="jardin" className="garden-section" ref={ref}>
      <div className="head">
        <span className="num-tag reveal">{c('garden.num', 'N.º 03 · bis')}</span>
        <h2 className="reveal delay-1">
          <StaggerText text={c('garden.title_1', 'Un jardín')} wordDelay={90} />{' '}
          <em><StaggerText text={c('garden.title_2', 'hecho de rosas')} wordDelay={90} baseDelay={300} /></em>
          <br />
          <StaggerText text="—" wordDelay={90} baseDelay={550} />{' '}
          <em><StaggerText text={c('garden.title_3', 'que florece para ti.')} wordDelay={90} baseDelay={650} /></em>
        </h2>
        <p className="reveal delay-2">
          {c('garden.blurb', 'Cada rosa está esculpida en vivo por tu navegador — pétalo a pétalo, curvada con matemáticas, iluminada con cariño. Mueve el mouse para que el jardín te siga.')}
        </p>
      </div>

      <div className="garden-stage reveal delay-3" data-cursor>
        {supported
          ? <canvas ref={canvasRef}></canvas>
          : <div className="garden-fallback">Tu navegador no soporta 3D. Pero el resto del sitio te quiere igual ♥</div>}
        <div className="garden-vignette" aria-hidden="true"></div>
      </div>

      <div className="garden-tag-row reveal delay-4">
        {(chips || []).map((chip, i) => (
          <span key={i} className="badge-chip"><span className="pip"></span>{chip}</span>
        ))}
      </div>
    </section>
  );
}

/* ===========  TIMELINE — Nuestros días  =========== */
function Timeline() {
  const ref = useReveal(0.05);
  const items = c('timeline.items', [
    { when: 'El día que te conocí',     title: 'Empezamos sin saberlo',   txt: 'Una conversación cualquiera, y ya no quise irme.' },
    { when: 'Nuestra primera vez',      title: 'Tu mano en la mía',       txt: 'Como si la vida hubiera ensayado ese momento siempre.' },
    { when: 'Nuestra primera casa',     title: 'Hogar, despacio',         txt: 'Tazas, plantas, luz de tarde — y tú haciendo todo bonito.' },
    { when: 'Aquellos días difíciles',  title: 'Nos cuidamos',            txt: 'Aprendí que el amor también se ve en lo que sostiene.' },
    { when: 'Cada mañana contigo',      title: 'La rutina más bonita',    txt: 'Café en silencio, tu voz despertando — empieza el día.' },
    { when: 'Hoy',                       title: 'Te celebro',              txt: 'Por la madre, la mujer, la compañera que eres.' },
    { when: 'Mañana',                    title: 'Para siempre',            txt: 'Lo nuestro tiene la forma de algo que no se acaba.' }
  ]);
  return (
    <section id="nuestros-dias" className="timeline-section" ref={ref}>
      <div className="head sec-head">
        <span className="num-tag reveal">{c('timeline.num', 'N.º 03')}</span>
        <h2 className="serif-h2 reveal delay-1" style={{ marginTop: 14 }}>
          <StaggerText text={c('timeline.title_1', 'Nuestros')} wordDelay={90} />{' '}
          <em><StaggerText text={c('timeline.title_2', 'días — uno a uno')} wordDelay={90} baseDelay={300} /></em>
        </h2>
        <p className="body-lg reveal delay-2" style={{ maxWidth: 540 }}>
          {c('timeline.blurb', 'Una pequeña línea de tiempo de lo nuestro — sin fechas exactas, porque el amor no se mide en calendarios. Desliza para recorrerlo.')}
        </p>
      </div>
      <div className="timeline-track">
        {(items || []).map((t, i) => (
          <article key={i} className="tl-card reveal" style={{ transitionDelay: `${i * 90}ms` }} data-cursor>
            <span className="pin"></span>
            <div className="when">{t.when}</div>
            <h4>{t.title}</h4>
            <p>{t.txt}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ===========  QUOTES CAROUSEL  =========== */
function QuotesCarousel() {
  const ref = useReveal(0.1);
  const [i, setI] = useState(0);
  const quotes = c('quotes.items', [
    { text: 'Casi tres años contigo y todavía me sigues sorprendiendo — eres la clase de mujer que hace que el amor parezca fácil, aunque sea el arte más difícil del mundo.', cite: 'Para ti, mi chinita' },
    { text: 'Te amo por todo lo que hemos pasado — por lo bonito, por lo difícil, por cada día que terminó haciéndome quererte un poquito mejor.', cite: 'Por todo · de Joel' },
    { text: 'En tus manos cabe la ternura, en tu mirada cabe el descanso, y en tu risa cabe entero mi día favorito.', cite: 'Lo que pienso al verte' },
    { text: 'Hay madres que crían con el cuerpo, otras con el alma — tú haces las dos cosas a la vez, y haces que parezca un milagro normal.', cite: 'Sobre tu maternidad' },
    { text: 'Mi suerte se mide en pequeños momentos: tu mano sobre la mía, tu voz al despertarte, y la certeza de que estás conmigo.', cite: 'Mi mayor suerte' },
    { text: 'Si todos los días son una carta, tú eres la frase que la abre y la firma que la cierra.', cite: 'Mi todo · mi chinita' }
  ]);
  const list = quotes || [];
  const len = list.length || 1;
  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % len), 6500);
    return () => clearInterval(id);
  }, [len]);
  // Clamp index when list shrinks
  const safeI = list.length > 0 ? i % list.length : 0;
  return (
    <section className="quotes-section" ref={ref}>
      <span className="quote-mark" aria-hidden="true">"</span>
      <span className="quote-mark r" aria-hidden="true">"</span>
      <div className="quotes-stage">
        <span className="label reveal">{c('quotes.label', '— Pensamientos sueltos —')}</span>
        <div className="quote-track" aria-live="polite">
          {list.map((q, idx) => (
            <div key={idx} className={`quote-item ${idx === safeI ? 'active' : ''}`}>
              <blockquote>"{String(q.text || '').split('—').map((t, k) => k === 0 ? t : <em key={k}>—{t}</em>)}"</blockquote>
              <cite>{q.cite}</cite>
            </div>
          ))}
        </div>
        <div className="quote-dots">
          {list.map((_, idx) => (
            <button key={idx} className={idx === safeI ? 'on' : ''} onClick={() => setI(idx)} aria-label={`Frase ${idx + 1}`} data-cursor />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ===========  RECIPE OF LOVE  =========== */
function Recipe() {
  const ref = useReveal(0.05);
  const ingredients = c('recipe.ingredients', [
    { qty: '1 taza',     ing: 'de paciencia infinita' },
    { qty: '2 cdas.',    ing: 'de risa contagiosa' },
    { qty: 'al gusto',   ing: 'de ternura — siempre extra' },
    { qty: '3 pizcas',   ing: 'de valentía silenciosa' },
    { qty: '1 chorrito', ing: 'de café compartido' },
    { qty: 'un puñado',  ing: 'de miradas largas y dulces' },
    { qty: '∞',          ing: 'de amor — sin medida' }
  ]);
  return (
    <section id="receta" className="recipe-section" ref={ref}>
      <div className="sec-head" style={{ margin: '0 auto', textAlign: 'center', alignItems: 'center' }}>
        <span className="num-tag reveal">{c('recipe.num', 'N.º 05')}</span>
        <h2 className="serif-h2 reveal delay-1" style={{ textAlign: 'center', margin: 0 }}>
          <StaggerText text={c('recipe.title_1', 'La receta')} wordDelay={90} />{' '}
          <em><StaggerText text={c('recipe.title_2', 'de quererte')} wordDelay={90} baseDelay={300} /></em>
        </h2>
      </div>

      <div className="recipe-grid">
        <div className="reveal delay-2" style={{ position: 'relative' }}>
          <div style={{ position: 'relative', aspectRatio: '4/5', minHeight: 380, border: '1px solid var(--rose-soft)', padding: 14 }}>
            <image-slot id="recipe-photo" placeholder="Una foto que me inspira" shape="rect" style={{ width: '100%', height: '100%' }}></image-slot>
          </div>
          <p className="body-lg" style={{ marginTop: 22, fontFamily: 'var(--serif)', fontSize: 19, fontStyle: 'italic', color: 'var(--ink-soft)' }}>
            {c('recipe.quote', '"El amor no es una receta exacta — pero contigo, todo me sale bien."')}
          </p>
        </div>
        <article className="recipe-card reveal delay-3">
          <span className="stamp">{c('recipe.stamp', '— De la cocina del alma —')}</span>
          <h3>{c('recipe.title', 'Mari, mi chinita — mi receta favorita')}</h3>
          <div className="meta">{c('recipe.meta', 'Tiempo: ~3 años (y los que vienen) · Sirve: para siempre')}</div>
          <ul>
            {(ingredients || []).map((it, i) => (
              <li key={i}>
                <span className="qty">{it.qty}</span>
                <span className="ing">{it.ing}</span>
              </li>
            ))}
          </ul>
          <p className="footnote">
            {c('recipe.footnote', 'Mezclar todo con calma, dejar reposar entre dos miradas, servir en cualquier día — y repetir, mañana, también.')}
          </p>
        </article>
      </div>
    </section>
  );
}

/* ===========  MUSIC BOX (calls into ambience.js)  =========== */
function MusicBox() {
  const ref = useReveal(0.1);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const onState = (e) => setPlaying(!!(e && e.detail && e.detail.on));
    window.addEventListener('mari:audio', onState);
    setPlaying(!!(window.Ambience && window.Ambience.isOn && window.Ambience.isOn()));
    return () => window.removeEventListener('mari:audio', onState);
  }, []);

  const toggle = () => {
    if (window.Ambience) window.Ambience.toggle();
  };

  return (
    <section id="cancion" className="music-section" ref={ref}>
      <span className="num-tag reveal">{c('music.num', 'N.º 08')}</span>
      <h2 className="serif-h2 reveal delay-1" style={{ marginTop: 14, textAlign: 'center' }}>
        <StaggerText text={c('music.title_1', 'Una canción,')} wordDelay={90} />{' '}
        <em><StaggerText text={c('music.title_2', 'hecha para ti')} wordDelay={90} baseDelay={300} /></em>
      </h2>
      <p className="body-lg reveal delay-2" style={{ maxWidth: 560, margin: '20px auto 0', textAlign: 'center' }}>
        {c('music.blurb', 'Pulsa para encender una pequeña melodía suave, escrita en este sitio nota a nota — para que te acompañe mientras lees.')}
      </p>

      <div className={`music-stage reveal delay-3 ${playing ? 'playing' : ''}`}>
        <button className="play-btn" onClick={toggle} aria-label={playing ? 'Pausar' : 'Reproducir'} data-cursor>
          {playing ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M7 5 v14 l12 -7 z" /></svg>
          )}
        </button>
        <h3 className="now">{c('music.track_title', '"Para Mari"')} <em style={{ color: 'var(--rose)' }}>{c('music.track_sub', '(en piano y harpa)')}</em></h3>
        <div className="by">{c('music.track_meta', '— compuesta a mano, con código —')}</div>
        <div className="bars-out" aria-hidden="true">
          <span></span><span></span><span></span><span></span><span></span><span></span><span></span>
        </div>
      </div>
    </section>
  );
}

/* ===========  CONSTELLATION  =========== */
function Constellation() {
  const ref = useReveal(0.05);
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const [stars, setStars] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mari-stars') || '[]'); } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('mari-stars', JSON.stringify(stars));
    drawAll();
  }, [stars]);

  useEffect(() => {
    const onResize = () => drawAll();
    window.addEventListener('resize', onResize);
    drawAll();
    return () => window.removeEventListener('resize', onResize);
  }, []);

  function drawAll() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = r.width * dpr; canvas.height = r.height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, r.width, r.height);
    if (stars.length > 1) {
      ctx.strokeStyle = 'rgba(226,200,136,.45)';
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      stars.forEach((s, idx) => {
        const x = s.x * r.width; const y = s.y * r.height;
        if (idx === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }
    stars.forEach((s) => {
      const x = s.x * r.width; const y = s.y * r.height;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, 22);
      grad.addColorStop(0, 'rgba(255,249,238,1)');
      grad.addColorStop(0.4, 'rgba(226,200,136,.6)');
      grad.addColorStop(1, 'rgba(226,200,136,0)');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(x, y, 22, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,249,238,1)';
      ctx.beginPath(); ctx.arc(x, y, 1.8, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,249,238,.7)';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(x - 7, y); ctx.lineTo(x + 7, y);
      ctx.moveTo(x, y - 7); ctx.lineTo(x, y + 7);
      ctx.stroke();
    });
  }

  function onClick(e) {
    const r = wrapRef.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    setStars((arr) => [...arr, { x, y, t: Date.now() }]);
  }
  function clearStars() { setStars([]); }

  return (
    <section id="cielo" className="stars-section" ref={ref}>
      <div className="head">
        <span className="badge-chip reveal" style={{ borderColor: 'rgba(226,200,136,.5)', color: 'var(--gold-soft)', background: 'rgba(0,0,0,.2)' }}>{c('stars.badge', 'Constelación de deseos')}</span>
        <h2 className="reveal delay-1">
          <StaggerText text={c('stars.title_1', 'Cada toque')} wordDelay={90} />{' '}
          <em><StaggerText text={c('stars.title_2', 'es una estrella para ti.')} wordDelay={90} baseDelay={300} /></em>
        </h2>
        <p className="reveal delay-2">{c('stars.blurb', 'Pulsa donde quieras: cada estrella se queda guardada y se va uniendo a las anteriores. Tu propio cielo, hecho de pensamientos.')}</p>
      </div>
      <div className="star-canvas-wrap reveal delay-3" ref={wrapRef} onClick={onClick} data-cursor>
        <div className="moon" aria-hidden="true"></div>
        <canvas ref={canvasRef}></canvas>
        <span className="hint">{c('stars.hint', '— pulsa para añadir una estrella —')}</span>
      </div>
      <div className="star-counter">
        {stars.length === 0 ? c('stars.empty', 'Aún no hay estrellas. Empieza la constelación.') : `${stars.length} ${stars.length === 1 ? 'estrella' : 'estrellas'} en tu cielo`}
        {stars.length > 0 && (
          <button onClick={clearStars} style={{ marginLeft: 14, background: 'transparent', border: '1px solid rgba(226,200,136,.4)', color: 'var(--gold-soft)', padding: '6px 12px', fontSize: 10, letterSpacing: '.3em', textTransform: 'uppercase', cursor: 'pointer' }} data-cursor>limpiar</button>
        )}
      </div>
    </section>
  );
}

/* ===========  GIFT BOX  =========== */
function GiftBox() {
  const ref = useReveal(0.05);
  const [open, setOpen] = useState(false);
  const sparkles = Array.from({ length: 22 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    delay: Math.random() * 2.4,
    size: 4 + Math.random() * 7
  }));
  const messageRaw = String(c('gift.message', 'Mi regalo de hoy es **una promesa simple**: seguir eligiéndote cada mañana, cuidar lo nuestro como un jardín, y recordarte — una y otra vez — que **la madre, la mujer, la compañera** que eres es lo más bonito que me ha pasado.\n\nFeliz Día de la Madre, Mari. **Te quiero.**'));
  const messageParas = messageRaw.split(/\n\n+/);

  return (
    <section id="regalo" className={`gift-section ${open ? 'opened' : ''}`} ref={ref}>
      {sparkles.map((s) => (
        <span key={s.id} className="sparkle" style={{ left: `${s.left}%`, top: `${s.top}%`, width: s.size, height: s.size, animationDelay: `${s.delay}s` }}></span>
      ))}
      <span className="badge-chip reveal"><span className="pip"></span>{c('gift.badge', 'Tu regalo')}</span>
      <h2 className="serif-h2 reveal delay-1" style={{ margin: '18px auto 30px', maxWidth: 760 }}>
        <StaggerText text={c('gift.title_1', 'Toca el lazo,')} wordDelay={90} />{' '}
        <em><StaggerText text={c('gift.title_2', 'ábrelo con calma.')} wordDelay={90} baseDelay={400} /></em>
      </h2>

      <div className="gift-stage">
        <div className={`gift-box ${open ? 'opened' : ''}`} onClick={() => setOpen((o) => !o)} data-cursor>
          <div className="gift-base"></div>
          <div className="gift-lid"></div>
          <div className="gift-bow">
            <span className="loop l"></span>
            <span className="loop r"></span>
            <span className="knot"></span>
          </div>
        </div>

        <div className="gift-message" aria-hidden={!open}>
          <div className="seal">{c('gift.seal', 'M')}</div>
          {messageParas.map((para, i) => (
            <React.Fragment key={i}>
              {i > 0 && <><br /><br /></>}
              {cFmt(para)}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="gift-cta">{c('gift.cta', '— pulsa para abrir —')}</div>
    </section>
  );
}

/* ===========  FINALE  =========== */
function Finale() {
  const ref = useReveal(0.1);
  const lines = c('finale.lines', [
    'Por la **madre**, la **mujer**, la **compañera** y el **hogar** que eres.',
    'Por la forma en la que cuidas, en la que amas, y en la que llenas todo de luz.',
    'Por casi **tres años** y por todo lo que hemos pasado.',
    'Hoy, mañana, y siempre — **te elijo a ti, mi chinita**.'
  ]);
  return (
    <section id="final" className="finale-section" ref={ref}>
      <div className="ornament reveal" style={{ width: 'min(420px, 60vw)', margin: '0 auto 40px' }}>
        <span style={{ fontSize: 22 }}>✿</span>
      </div>
      <h2 className="finale-mark reveal delay-1">
        {c('finale.name', 'Mari')}
      </h2>
      <p className="lines reveal delay-2">
        {(lines || []).map((line, i) => (
          <React.Fragment key={i}>
            {i > 0 && <br />}
            {cFmt(line)}
          </React.Fragment>
        ))}
      </p>
      <div className="from reveal delay-3">{cFmt(c('finale.from', '— Hecho por **JOEL** con mucho cariño —'))}</div>
    </section>
  );
}

Object.assign(window, { Bouquet, QuotesCarousel, Constellation, GiftBox, Timeline, Recipe, MusicBox, Finale, RoseGarden3D });
