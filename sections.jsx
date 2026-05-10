// Secciones principales del sitio para Mari
const { useState, useEffect, useRef, useCallback } = React;

/* ===========  Floral SVG ornaments  =========== */
function Ornament({ className = '', style = {} }) {
  return (
    <svg className={className} style={style} viewBox="0 0 120 30" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M2 15 Q30 0 60 15 T118 15" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
      <circle cx="60" cy="15" r="2.6" fill="currentColor" />
      <circle cx="14" cy="15" r="1" fill="currentColor" />
      <circle cx="106" cy="15" r="1" fill="currentColor" />
      <path d="M60 15 q -8 -10 0 -14 q 8 4 0 14 z" fill="currentColor" opacity=".55" />
    </svg>
  );
}

function CornerOrn({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 110 110" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ color: 'var(--gold)' }}>
      <path d="M5 5 Q 5 60 55 60 Q 105 60 105 5" stroke="currentColor" strokeWidth="0.7" strokeLinecap="round" />
      <path d="M5 5 Q 40 30 55 60" stroke="currentColor" strokeWidth="0.7" strokeLinecap="round" />
      <circle cx="5" cy="5" r="2" fill="currentColor" />
      <circle cx="55" cy="60" r="2.4" fill="currentColor" />
      <circle cx="105" cy="5" r="2" fill="currentColor" />
      <path d="M55 60 q -10 -8 -2 -16 q 8 -8 14 0 q -2 8 -12 16 z" fill="currentColor" opacity=".5" />
      <path d="M55 60 q 10 -8 2 -16 q -8 -8 -14 0 q 2 8 12 16 z" fill="currentColor" opacity=".5" />
    </svg>
  );
}

/* Floating SVG flowers used as parallax layers */
function FloatingBloom({ kind = 'rose', size = 200 }) {
  if (kind === 'rose') {
    return (
      <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
        <g style={{ transformOrigin: '50% 50%' }}>
          <circle cx="50" cy="50" r="32" fill="var(--rose-soft)" opacity=".7"/>
          <circle cx="50" cy="50" r="22" fill="var(--rose)" opacity=".85"/>
          <circle cx="50" cy="50" r="13" fill="var(--rose-deep)" />
          <circle cx="50" cy="50" r="6" fill="var(--gold)" />
          <path d="M50 40 q -8 4 -8 10 q 0 6 8 10 q 8 -4 8 -10 q 0 -6 -8 -10 z" fill="var(--rose-soft)" opacity=".5"/>
        </g>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <g>
        {[0,60,120,180,240,300].map((a,i) => (
          <ellipse key={i} cx="50" cy="32" rx="11" ry="20"
            fill="var(--rose-soft)" opacity=".7"
            transform={`rotate(${a} 50 50)`} />
        ))}
        <circle cx="50" cy="50" r="8" fill="var(--gold)" />
        <circle cx="50" cy="50" r="4" fill="var(--gold-deep)" />
      </g>
    </svg>
  );
}

/* ===========  HERO  =========== */
function Hero() {
  const sectionRef = useRef(null);
  const titleRef = useMouseTilt(4);
  const layer1 = useParallax(0.10);
  const layer2 = useParallax(0.18);
  const layer3 = useParallax(0.05);
  const [booted, setBooted] = useState(() => document.body.classList.contains('booted'));

  // Run hero reveal AFTER the boot loader has faded, so the user actually
  // sees the staggered text rather than catching only its tail.
  useEffect(() => {
    if (booted) return;
    const onBoot = () => setBooted(true);
    window.addEventListener('mari:booted', onBoot);
    return () => window.removeEventListener('mari:booted', onBoot);
  }, [booted]);

  useEffect(() => {
    if (!booted || !sectionRef.current) return;
    sectionRef.current.classList.add('in');
    sectionRef.current.querySelectorAll('.reveal').forEach((d) => d.classList.add('in'));
  }, [booted]);

  const stats = c('hero.stats', [
    { big: '~3', lbl: 'Años a tu lado' },
    { big: '01', lbl: 'Chinita en mi mundo' },
    { big: '∞',  lbl: 'Veces que te quiero' },
  ]);

  const marqueeParts = String(c('hero.marquee', 'Te amo · Mi chinita hermosa · Casi 3 años contigo · Mi calma · Mi compañera · Mi hogar · Te amo por todo lo que pasamos'))
    .split('·').map((s) => s.trim()).filter(Boolean);

  return (
    <section id="hero" className="hero" ref={sectionRef}>
      <CornerOrn className="corner-orn corner-tl" />
      <CornerOrn className="corner-orn corner-tr" />

      <div ref={layer1} className="hero-layer l1"><FloatingBloom kind="rose" size={320} /></div>
      <div ref={layer2} className="hero-layer l2"><FloatingBloom kind="daisy" size={260} /></div>
      <div ref={layer3} className="hero-layer l3"><FloatingBloom kind="rose" size={120} /></div>

      <div className="meta reveal">
        <span className="num">{c('hero.num', 'N.º 01')}</span>
        <span className="rule" />
        <span className="eyebrow">{c('hero.eyebrow', 'Día de la Madre · 2026')}</span>
      </div>

      <h1 className="serif-h1 reveal" ref={titleRef}>
        <StaggerText as="span" text={c('hero.title_1', 'Para mi chinita,')} wordDelay={120} baseDelay={300} />
        <br />
        <StaggerText as="span" text={c('hero.title_2', 'para mi')} wordDelay={120} baseDelay={900} />{' '}
        <span className="mari stagger-word" style={{ transitionDelay: '1400ms' }}>{c('hero.title_name', 'Mari.')}</span>
      </h1>

      <div className="row reveal delay-3">
        <p className="blurb body-lg">
          {cFmt(c('hero.blurb', 'Llevamos casi **3 años** y todavía me sigues sorprendiendo. Hoy el mundo celebra a las madres, pero yo quiero celebrarte a ti — por la forma en que cuidas, en que amas, y en que haces que todo lo que tocas se sienta como hogar.'))}
        </p>
        <div className="date-stamp">
          <div className="big">{c('hero.date_big', '10 · Mayo · 2026')}</div>
          <div className="small">{c('hero.date_small', 'Hecho por Joel, con mucho cariño')}</div>
        </div>
      </div>

      <div className="stat-row reveal delay-4">
        {(stats || []).map((s, i) => (
          <div className="stat" key={i}>
            <span className="big">{s.big}</span>
            <span className="lbl">{s.lbl}</span>
          </div>
        ))}
      </div>

      {/* Marquee */}
      <div className="marquee reveal delay-5" data-cursor>
        <div className="track">
          {[0, 1].map((k) => (
            <span key={k}>
              {marqueeParts.map((p, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <span className="star"> ✦ </span>}
                  {cFmt(p)}
                </React.Fragment>
              ))}
              {marqueeParts.length > 0 && <span className="star"> ✦ </span>}
            </span>
          ))}
        </div>
      </div>

      <div className="scroll-hint reveal delay-5">
        <span>{c('hero.scroll_hint', 'Desliza')}</span>
        <div className="bar" />
      </div>
    </section>
  );
}

/* ===========  MOTHERHOOD  =========== */
function Motherhood() {
  const ref = useReveal(0.05);
  const paragraphs = c('motherhood.paragraphs', [
    'Eres **madre con el alma** — antes incluso de las palabras. Cuidas con una paciencia que parece infinita, abrazas como si el mundo cupiera ahí dentro, y haces que cada pequeño gesto se sienta importante.',
    'Te he visto cansada y aun así sonriendo, ocupada y aun así presente, con las manos llenas de cosas y, sin embargo, con el corazón siempre disponible. **Esa es la madre que eres.**',
    'Y yo, todos los días — desde hace casi tres años — no me canso de pensar en lo afortunado que soy de tenerte a mi lado. **Te amo, mi chinita.**'
  ]);
  return (
    <section id="madre" className="mother-section" ref={ref}>
      <div className="mother-grid">
        <div className="mother-text">
          <span className="badge-chip reveal"><span className="pip"></span>{c('motherhood.badge', 'Para mi chinita · La madre que eres')}</span>
          <h2 className="reveal delay-1">
            <StaggerText text={c('motherhood.title_1', 'Te miro y veo')} wordDelay={90} />
            <br />
            <em><StaggerText text={c('motherhood.title_2', 'el hogar entero.')} wordDelay={90} baseDelay={300} /></em>
          </h2>
          {(paragraphs || []).map((p, i) => (
            <p key={i} className={`stanza reveal delay-${i + 2}`}>
              {cFmt(p)}
            </p>
          ))}
        </div>
        <div className="mother-art reveal delay-2">
          <div className="frame-deco b" aria-hidden="true"></div>
          <div className="frame-deco" aria-hidden="true"></div>
          <image-slot id="mother-portrait" placeholder="Foto de Mari (arrástrala)" shape="rect"></image-slot>
          <div className="badge">{c('motherhood.photo_caption', '— mi Mari —')}</div>
          <div className="stamp">{c('motherhood.stamp_top', 'Para')}<br/><em>{c('motherhood.stamp_bot', 'siempre')}</em></div>
        </div>
      </div>
    </section>
  );
}

/* ===========  LETTER  =========== */
const LETTER_TEXT_PARAGRAPHS_DEFAULTS = [
  "Hay días que uno guarda en el bolsillo del alma — y este es uno de ellos. Quiero que sepas que cada cosa pequeña que haces, cada gesto silencioso, cada vez que sonríes sin saber que te estoy mirando, hace que mi mundo se ordene.",
  "Llevamos casi tres años juntos, y aunque parezca poco en un calendario, en mí cabe entera una vida nueva. Te amo por todo lo que hemos pasado, por lo bonito y por lo difícil, porque cada cosa que vivimos me terminó enseñando a quererte mejor.",
  "Eres luz, calma y fuerza al mismo tiempo. Eres la persona que convierte los lunes en algo bonito y los domingos en algo eterno. Si tuviera que escribir un libro entero sobre lo que admiro de ti, los capítulos no acabarían nunca.",
  "Hoy, en el Día de la Madre, te celebro por la mujer increíble que eres y por todo el amor que llevas dentro. Te celebro por enseñarme que amar bien también es un arte. Te amo, mi chinita hermosa."
];

function Letter() {
  const ref = useReveal(0.1);
  const paras = c('letter.paragraphs', LETTER_TEXT_PARAGRAPHS_DEFAULTS) || LETTER_TEXT_PARAGRAPHS_DEFAULTS;
  const parasRef = useRef(paras);
  parasRef.current = paras;
  const [stage, setStage] = useState(0);
  const [shown, setShown] = useState(() => paras.map(() => ''));
  const startedRef = useRef(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !startedRef.current) {
          startedRef.current = true;
          typePara(0);
          io.disconnect();
        }
      });
    }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  function typePara(idx) {
    const list = parasRef.current || [];
    if (idx >= list.length) return;
    const text = list[idx] || '';
    let i = 0;
    const speed = 12;
    const tick = () => {
      i++;
      setShown((s) => { const n = [...s]; n[idx] = text.slice(0, i); return n; });
      if (i < text.length) setTimeout(tick, speed + (Math.random() * 10));
      else { setStage(idx + 1); setTimeout(() => typePara(idx + 1), 380); }
    };
    tick();
  }

  return (
    <section id="carta" className="letter-section" ref={ref}>
      <div className="sec-head" style={{ margin: '0 auto', textAlign: 'center', alignItems: 'center' }}>
        <span className="num-tag reveal">{c('letter.num', 'N.º 02')}</span>
        <div className="ornament reveal delay-1" style={{ width: 'min(420px, 60vw)', margin: '0 auto' }}>
          <span style={{ fontSize: 22 }}>✿</span>
        </div>
        <span className="eyebrow reveal delay-2"><span className="dot"></span>{c('letter.eyebrow', 'Una carta para ti')}<span className="dot"></span></span>
        <h2 className="serif-h2 reveal delay-3" style={{ textAlign: 'center', margin: 0 }}>
          <StaggerText text={c('letter.title_1', 'Lo que llevo escrito')} wordDelay={90} baseDelay={100} />
          <br />
          <em><StaggerText text={c('letter.title_2', 'dentro del pecho')} wordDelay={90} baseDelay={500} /></em>
        </h2>
      </div>

      <div className="letter-wrap reveal delay-3" ref={sectionRef}>
        <article className="letter-paper">
          <CornerOrn className="corner-orn corner-tl" />
          <CornerOrn className="corner-orn corner-br" />
          <span className="greet">{c('letter.greeting', 'Mari, mi chinita hermosa —')}</span>
          {paras.map((full, idx) => {
            const shownText = shown[idx] != null ? shown[idx] : '';
            return (
              <p key={idx} className={idx > 0 ? 'indent' : ''}>
                {shownText}
                {stage === idx && shownText.length < (full || '').length && (
                  <span className="typing-cursor" style={{ height: '0.95em' }}>&nbsp;</span>
                )}
              </p>
            );
          })}
          <span className="sign">{c('letter.sign', 'Tuyo, siempre — Joel.')}</span>
          <div className="sign-meta">{c('letter.sign_meta', '10 / 05 / 2026 · J + M · casi 3 años')}</div>
          <div className="seal-wax" aria-hidden="true">{c('letter.seal', 'M')}</div>
        </article>
      </div>
    </section>
  );
}

/* ===========  GALLERY (with lightbox)  =========== */
function Gallery() {
  const ref = useReveal(0.05);
  const gridRef = useRef(null);

  const items = c('gallery.items', [
    { id: 'foto-1', placeholder: 'Tu foto favorita',  caption: 'Aquella tarde, cuando el sol nos pintó.' },
    { id: 'foto-2', placeholder: 'Un momento juntos', caption: 'Risas que valen el universo.' },
    { id: 'foto-3', placeholder: 'Detalle / flor',    caption: 'Pequeñas cosas que amo.' },
    { id: 'foto-4', placeholder: 'Tu sonrisa',        caption: 'La razón de mis días.' },
    { id: 'foto-5', placeholder: 'Una vista bonita',  caption: 'Donde el tiempo se detuvo.' },
    { id: 'foto-6', placeholder: 'Una mañana',        caption: 'Café, tú, y todo en su sitio.' },
    { id: 'foto-7', placeholder: 'Un recuerdo',       caption: 'Para que nunca se nos olvide.' }
  ]);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const frames = grid.querySelectorAll('.frame');
    const handlers = [];
    frames.forEach((frame) => {
      const onMove = (e) => {
        const r = frame.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        frame.style.transform = `perspective(900px) rotateY(${x * 7}deg) rotateX(${-y * 7}deg) translateY(-6px) scale(1.01)`;
      };
      const onLeave = () => { frame.style.transform = ''; };
      frame.addEventListener('mousemove', onMove);
      frame.addEventListener('mouseleave', onLeave);
      handlers.push([frame, onMove, onLeave]);
    });
    return () => handlers.forEach(([f, m, l]) => { f.removeEventListener('mousemove', m); f.removeEventListener('mouseleave', l); });
  }, [items]);

  return (
    <section id="galeria" className="gallery-section" ref={ref}>
      <div className="sec-head">
        <div className="row">
          <div>
            <span className="num-tag reveal">{c('gallery.num', 'N.º 04')}</span>
            <h2 className="serif-h2 reveal" style={{ marginTop: 14 }}>
              <StaggerText text={c('gallery.title_1', 'Trozos de')} wordDelay={90} />{' '}
              <em><StaggerText text={c('gallery.title_2', 'nuestra vida')} wordDelay={90} baseDelay={300} /></em>
            </h2>
          </div>
          <p className="body-lg reveal delay-2" style={{ maxWidth: 360 }}>
            {c('gallery.blurb', 'Una galería viva — arrastra aquí tus fotos favoritas. Cada marco te espera, listo para guardarte un recuerdo. Toca cualquiera para verlo grande.')}
          </p>
        </div>
      </div>

      <div className="gallery-grid reveal delay-3" ref={gridRef}>
        {(items || []).map((g, i) => {
          const cls = 'f' + (i + 1);
          return (
            <div key={g.id || i}
                 className={`frame ${cls} reveal`}
                 style={{ transitionDelay: `${i * 90}ms` }}
                 data-cursor
                 onClick={() => Lightbox.open(g.id, g.caption)}>
              <span className="corner tl"></span><span className="corner tr"></span>
              <span className="corner bl"></span><span className="corner br"></span>
              <image-slot id={g.id} placeholder={g.placeholder} shape="rect"></image-slot>
              <div className="caption">{g.caption}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ===========  REASONS (flip cards)  =========== */
function ReasonCard({ r, idx }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div className={`reason-card reveal ${flipped ? 'flipped' : ''}`}
         style={{ transitionDelay: `${idx * 70}ms` }}
         data-cursor
         onClick={() => setFlipped((f) => !f)}>
      <div className="inner">
        <div className="face front">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="num">{r.n}</span>
            <span className="hint">Toca</span>
          </div>
          <h3>{r.title}</h3>
          <Ornament style={{ width: '60%', color: 'var(--gold)' }} />
        </div>
        <div className="face back">
          <span className="glyph">"</span>
          <p>{r.back}</p>
          <span className="hint" style={{ color: 'rgba(255,249,238,.6)', fontSize: 9, letterSpacing: '.35em', textTransform: 'uppercase' }}>{r.n}</span>
        </div>
      </div>
    </div>
  );
}

function Reasons() {
  const ref = useReveal(0.05);
  const items = c('reasons.items', [
    { n: 'I',    title: 'Tu manera de cuidar',          back: 'Cuidas con detalle, con paciencia, con un corazón que no se cansa.' },
    { n: 'II',   title: 'Tu risa',                       back: 'Es la melodía que pongo en bucle en mi cabeza cuando el día se pone gris.' },
    { n: 'III',  title: 'Tu fuerza silenciosa',          back: 'Sostienes mundos enteros sin pedir aplausos. Yo te aplaudo igualmente.' },
    { n: 'IV',   title: 'La forma en que amas',          back: 'Amas en presente, sin reservas, y haces que amar parezca lo más natural.' },
    { n: 'V',    title: 'Tu mirada',                     back: 'En tus ojos cabe todo lo bueno que conozco del mundo.' },
    { n: 'VI',   title: 'Tu valentía',                   back: 'Te enfrentas a lo difícil con elegancia. Eres mi referente más bonito.' },
    { n: 'VII',  title: 'Tu ternura',                    back: 'Es el tipo de ternura que no se finge, la que se siente con los huesos.' },
    { n: 'VIII', title: 'Por ser tú',                    back: 'No necesitas ser nada más. Tú, exactamente como eres, ya eres todo.' }
  ]);
  return (
    <section id="razones" className="reasons-section" ref={ref}>
      <div className="sec-head">
        <div className="row">
          <div>
            <span className="num-tag reveal">{c('reasons.num', 'N.º 06')}</span>
            <h2 className="serif-h2 reveal delay-1" style={{ marginTop: 14 }}>
              <em><StaggerText text={c('reasons.title_1', 'Ocho razones')} wordDelay={90} /></em>
              <br />
              <StaggerText text={c('reasons.title_2', 'entre miles')} wordDelay={90} baseDelay={300} />
            </h2>
          </div>
          <p className="body-lg reveal delay-2" style={{ maxWidth: 380 }}>
            {c('reasons.blurb', 'Cada tarjeta esconde una cosa que admiro de ti. Tócalas — gíralas — son tuyas.')}
          </p>
        </div>
      </div>
      <div className="reasons-grid">
        {(items || []).map((r, i) => <ReasonCard key={r.n || i} r={r} idx={i} />)}
      </div>
    </section>
  );
}

/* ===========  PROMISES + signature  =========== */
function Promises() {
  const ref = useReveal(0.05);
  const sigRef = useReveal(0.4);
  const items = c('promises.items', [
    { n: '01', text: 'Acompañarte en lo bonito y, sobre todo, en lo difícil.', meta: 'siempre' },
    { n: '02', text: 'Hacerte el café exactamente como te gusta — en silencio, en cama.', meta: 'cada mañana' },
    { n: '03', text: 'Recordarte lo extraordinaria que eres cuando se te olvide.', meta: 'todos los días' },
    { n: '04', text: 'Bailar contigo aunque no haya música.', meta: 'cuando sea' },
    { n: '05', text: 'Cuidar lo nuestro como se cuida lo más bonito que se tiene.', meta: 'para siempre' }
  ]);
  return (
    <section id="promesas" className="promise-section" ref={ref}>
      <div className="sec-head" style={{ margin: '0 auto', textAlign: 'center', alignItems: 'center' }}>
        <span className="num-tag reveal">{c('promises.num', 'N.º 07')}</span>
        <h2 className="serif-h2 reveal delay-1" style={{ textAlign: 'center', margin: 0 }}>
          <StaggerText text={c('promises.title_1', 'Cinco promesas')} wordDelay={90} />
          <br />
          <em><StaggerText text={c('promises.title_2', 'que te firmo hoy')} wordDelay={90} baseDelay={400} /></em>
        </h2>
      </div>

      <div className="promise-list">
        {(items || []).map((p, i) => (
          <div key={p.n || i} className="promise-row reveal" style={{ transitionDelay: `${i * 110}ms` }}>
            <span className="num">{p.n}</span>
            <span className="text">{p.text}</span>
            <span className="meta">{p.meta}</span>
          </div>
        ))}
      </div>

      <div className="signature-box reveal" ref={sigRef}>
        <svg viewBox="0 0 480 140" xmlns="http://www.w3.org/2000/svg" aria-label="Firma">
          <path className="pen" d="
            M30 90
            C 60 30, 110 30, 120 80
            C 124 110, 100 120, 90 100
            C 80 80, 110 60, 140 70
            C 175 82, 175 110, 200 95
            Q 220 84, 230 70
            C 240 56, 260 56, 260 80
            C 260 110, 290 110, 300 90
            C 310 70, 330 60, 340 80
            C 350 100, 370 100, 380 80
            Q 395 56, 420 60
            C 440 64, 450 90, 430 100" />
          <path className="pen" d="M30 110 L 440 110" style={{ strokeWidth: .8, strokeDasharray: 410 }} />
        </svg>
        <div className="meta">{c('promises.sig_meta', '— firmado, con todo —')}</div>
      </div>
    </section>
  );
}

/* ===========  HEART CLICKER  =========== */
function HeartSection() {
  const ref = useReveal(0.05);
  const [count, setCount] = useState(() => {
    const v = parseInt(localStorage.getItem('mari-hearts') || '0', 10);
    return isNaN(v) ? 0 : v;
  });
  const [floats, setFloats] = useState([]);
  const btnRef = useRef(null);
  const [pulse, setPulse] = useState(false);

  const onClick = () => {
    setCount((c) => {
      const next = c + 1;
      localStorage.setItem('mari-hearts', String(next));
      return next;
    });
    setPulse(true);
    setTimeout(() => setPulse(false), 240);
    const id = Math.random().toString(36).slice(2);
    const dx = (Math.random() - 0.5) * 180;
    const rot = (Math.random() - 0.5) * 60;
    const r = btnRef.current.getBoundingClientRect();
    const cx = r.width / 2;
    const cy = r.height * 0.3;
    setFloats((arr) => [...arr, { id, x: cx, y: cy, dx, rot }]);
    setTimeout(() => setFloats((arr) => arr.filter((f) => f.id !== id)), 2400);
    emitHearts(btnRef.current, 3);
  };

  return (
    <section id="corazon" className="heart-section" ref={ref}>
      <span className="num-tag reveal">{c('heart.num', 'N.º 09 — el más bonito')}</span>
      <h2 className="serif-h2 reveal delay-1" style={{ marginTop: 14 }}>
        <StaggerText text={c('heart.title_1', 'Toca el corazón')} wordDelay={90} />
        <br />
        <em><StaggerText text={c('heart.title_2', 'cada vez que pienses en mí')} wordDelay={90} baseDelay={400} /></em>
      </h2>
      <p className="body-lg reveal delay-2" style={{ maxWidth: 520, margin: '24px auto 0' }}>
        {c('heart.blurb', 'Cada toque queda guardado en este sitio — como una pequeña constelación de momentos en los que te acordaste de mí.')}
      </p>

      <button className="heart-button reveal delay-3" onClick={onClick} ref={btnRef} aria-label="Latido" data-cursor>
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="heartG" cx="40%" cy="35%" r="80%">
              <stop offset="0%" stopColor="#E48798" />
              <stop offset="55%" stopColor="#A03E52" />
              <stop offset="100%" stopColor="#5E1F2C" />
            </radialGradient>
            <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="0.6" />
            </filter>
          </defs>
          <g transform="translate(100,108)" style={{ transformOrigin: 'center', animation: pulse ? 'beat .24s ease' : 'beatSlow 2.6s ease-in-out infinite' }}>
            <path
              d="M0,52 C-46,18 -82,-12 -82,-44 C-82,-72 -56,-86 -34,-86 C-16,-86 -4,-74 0,-58 C4,-74 16,-86 34,-86 C56,-86 82,-72 82,-44 C82,-12 46,18 0,52 Z"
              fill="url(#heartG)" />
            <path
              d="M0,52 C-46,18 -82,-12 -82,-44 C-82,-72 -56,-86 -34,-86 C-16,-86 -4,-74 0,-58 C4,-74 16,-86 34,-86 C56,-86 82,-72 82,-44 C82,-12 46,18 0,52 Z"
              fill="none" stroke="rgba(255,249,238,.2)" strokeWidth="1.2" />
            <ellipse cx="-30" cy="-50" rx="14" ry="8" fill="rgba(255,249,238,.35)" filter="url(#soft)" />
          </g>
        </svg>
        <span className="label">{c('heart.label', '— pulsa —')}</span>
        {floats.map((f) => (
          <span key={f.id} className="floating-heart"
                style={{ left: f.x, top: f.y, '--dx': `${f.dx}px`, '--rot': `${f.rot}deg` }}>
            ♥
          </span>
        ))}
      </button>

      <div className="heart-counter reveal delay-4">
        {count.toLocaleString('es-ES')}
        <span className="unit">{c('heart.counter_unit', 'veces que te quise hoy')}</span>
      </div>

      <style>{`
        @keyframes beatSlow {
          0%, 100% { transform: scale(1); }
          12% { transform: scale(1.08); }
          24% { transform: scale(1); }
          36% { transform: scale(1.05); }
          48% { transform: scale(1); }
        }
        @keyframes beat {
          0% { transform: scale(1); }
          50% { transform: scale(1.22); }
          100% { transform: scale(1); }
        }
      `}</style>
    </section>
  );
}

/* ===========  FOOTER  =========== */
function FooterEnd() {
  const ref = useReveal(0.1);
  return (
    <footer className="end" ref={ref}>
      <h2 className="reveal">
        <em>{c('footer.title_1', 'Feliz Día de la Madre,')}</em> <span style={{ color: 'var(--rose-soft)' }}>{c('footer.title_2', 'mi chinita.')}</span>
      </h2>
      <p className="reveal delay-1">
        {c('footer.sub_1', 'Hecho por JOEL ♥ con mucho cariño · 10 · 05 · 2026')}
      </p>
      <p className="reveal delay-2" style={{ marginTop: 14, color: 'rgba(250,244,236,.45)' }}>
        {c('footer.sub_2', 'Casi 3 años contigo · y los que vienen · J + M')}
      </p>
    </footer>
  );
}

Object.assign(window, { Hero, Letter, Gallery, Reasons, Promises, HeartSection, FooterEnd, Motherhood, Ornament, CornerOrn, FloatingBloom });
