/* ---------------------------------------------------------------------------
 * content-defaults.js — single source of truth for every text bit on the site.
 *
 * The site renders from `window.SiteContent` if it exists, otherwise from
 * `window.SiteDefaults`. The admin dashboard edits a copy of this object,
 * saves it to Supabase via /api/content, and the site fetches it on load.
 * --------------------------------------------------------------------------- */
window.SiteDefaults = {
  meta: {
    boot_name: 'Mari',
    boot_sub: 'Hecho por <strong>Joel</strong> con mucho cariño',
    page_title: 'Para Mari · Día de la Madre · 2026'
  },

  hero: {
    eyebrow: 'Día de la Madre · 2026',
    num: 'N.º 01',
    title_1: 'Para mi chinita,',
    title_2: 'para mi',
    title_name: 'Mari.',
    blurb: 'Llevamos casi 3 años y todavía me sigues sorprendiendo. Hoy el mundo celebra a las madres, pero yo quiero celebrarte a ti — por la forma en que cuidas, en que amas, y en que haces que todo lo que tocas se sienta como hogar.',
    date_big: '10 · Mayo · 2026',
    date_small: 'Hecho por Joel, con mucho cariño',
    stats: [
      { big: '~3', lbl: 'Años a tu lado' },
      { big: '01', lbl: 'Chinita en mi mundo' },
      { big: '∞',  lbl: 'Veces que te quiero' }
    ],
    marquee: 'Te amo · Mi chinita hermosa · Casi 3 años contigo · Mi calma · Mi compañera · Mi hogar · Te amo por todo lo que pasamos',
    scroll_hint: 'Desliza'
  },

  motherhood: {
    badge: 'Para mi chinita · La madre que eres',
    title_1: 'Te miro y veo',
    title_2: 'el hogar entero.',
    paragraphs: [
      'Eres **madre con el alma** — antes incluso de las palabras. Cuidas con una paciencia que parece infinita, abrazas como si el mundo cupiera ahí dentro, y haces que cada pequeño gesto se sienta importante.',
      'Te he visto cansada y aun así sonriendo, ocupada y aun así presente, con las manos llenas de cosas y, sin embargo, con el corazón siempre disponible. **Esa es la madre que eres.**',
      'Y yo, todos los días — desde hace casi tres años — no me canso de pensar en lo afortunado que soy de tenerte a mi lado. **Te amo, mi chinita.**'
    ],
    photo_caption: '— mi Mari —',
    stamp_top: 'Para',
    stamp_bot: 'siempre'
  },

  letter: {
    num: 'N.º 02',
    eyebrow: 'Una carta para ti',
    title_1: 'Lo que llevo escrito',
    title_2: 'dentro del pecho',
    greeting: 'Mari, mi chinita hermosa —',
    paragraphs: [
      'Hay días que uno guarda en el bolsillo del alma — y este es uno de ellos. Quiero que sepas que cada cosa pequeña que haces, cada gesto silencioso, cada vez que sonríes sin saber que te estoy mirando, hace que mi mundo se ordene.',
      'Llevamos casi tres años juntos, y aunque parezca poco en un calendario, en mí cabe entera una vida nueva. Te amo por todo lo que hemos pasado, por lo bonito y por lo difícil, porque cada cosa que vivimos me terminó enseñando a quererte mejor.',
      'Eres luz, calma y fuerza al mismo tiempo. Eres la persona que convierte los lunes en algo bonito y los domingos en algo eterno. Si tuviera que escribir un libro entero sobre lo que admiro de ti, los capítulos no acabarían nunca.',
      'Hoy, en el Día de la Madre, te celebro por la mujer increíble que eres y por todo el amor que llevas dentro. Te celebro por enseñarme que amar bien también es un arte. Te amo, mi chinita hermosa.'
    ],
    sign: 'Tuyo, siempre — Joel.',
    sign_meta: '10 / 05 / 2026 · J + M · casi 3 años',
    seal: 'M'
  },

  garden: {
    num: 'N.º 03 · bis',
    title_1: 'Un jardín',
    title_2: 'hecho de rosas',
    title_3: 'que florece para ti.',
    blurb: 'Cada rosa está esculpida en vivo por tu navegador — pétalo a pétalo, curvada con matemáticas, iluminada con cariño. Mueve el mouse para que el jardín te siga.',
    chips: ['Three.js · WebGL', 'Pétalos paramétricos', 'Iluminación cinematográfica', 'Para Mari · con cariño']
  },

  timeline: {
    num: 'N.º 03',
    title_1: 'Nuestros',
    title_2: 'días — uno a uno',
    blurb: 'Una pequeña línea de tiempo de lo nuestro — sin fechas exactas, porque el amor no se mide en calendarios. Desliza para recorrerlo.',
    items: [
      { when: 'El día que te conocí',     title: 'Empezamos sin saberlo',   txt: 'Una conversación cualquiera, y ya no quise irme.' },
      { when: 'Nuestra primera vez',      title: 'Tu mano en la mía',       txt: 'Como si la vida hubiera ensayado ese momento siempre.' },
      { when: 'Nuestra primera casa',     title: 'Hogar, despacio',         txt: 'Tazas, plantas, luz de tarde — y tú haciendo todo bonito.' },
      { when: 'Aquellos días difíciles',  title: 'Nos cuidamos',            txt: 'Aprendí que el amor también se ve en lo que sostiene.' },
      { when: 'Cada mañana contigo',      title: 'La rutina más bonita',    txt: 'Café en silencio, tu voz despertando — empieza el día.' },
      { when: 'Hoy',                       title: 'Te celebro',              txt: 'Por la madre, la mujer, la compañera que eres.' },
      { when: 'Mañana',                    title: 'Para siempre',            txt: 'Lo nuestro tiene la forma de algo que no se acaba.' }
    ]
  },

  gallery: {
    num: 'N.º 04',
    title_1: 'Trozos de',
    title_2: 'nuestra vida',
    blurb: 'Una galería viva — arrastra aquí tus fotos favoritas. Cada marco te espera, listo para guardarte un recuerdo. Toca cualquiera para verlo grande.',
    items: [
      { id: 'foto-1', placeholder: 'Tu foto favorita',  caption: 'Aquella tarde, cuando el sol nos pintó.' },
      { id: 'foto-2', placeholder: 'Un momento juntos', caption: 'Risas que valen el universo.' },
      { id: 'foto-3', placeholder: 'Detalle / flor',    caption: 'Pequeñas cosas que amo.' },
      { id: 'foto-4', placeholder: 'Tu sonrisa',        caption: 'La razón de mis días.' },
      { id: 'foto-5', placeholder: 'Una vista bonita',  caption: 'Donde el tiempo se detuvo.' },
      { id: 'foto-6', placeholder: 'Una mañana',        caption: 'Café, tú, y todo en su sitio.' },
      { id: 'foto-7', placeholder: 'Un recuerdo',       caption: 'Para que nunca se nos olvide.' }
    ]
  },

  quotes: {
    label: '— Pensamientos sueltos —',
    items: [
      { text: 'Casi tres años contigo y todavía me sigues sorprendiendo — eres la clase de mujer que hace que el amor parezca fácil, aunque sea el arte más difícil del mundo.', cite: 'Para ti, mi chinita' },
      { text: 'Te amo por todo lo que hemos pasado — por lo bonito, por lo difícil, por cada día que terminó haciéndome quererte un poquito mejor.', cite: 'Por todo · de Joel' },
      { text: 'En tus manos cabe la ternura, en tu mirada cabe el descanso, y en tu risa cabe entero mi día favorito.', cite: 'Lo que pienso al verte' },
      { text: 'Hay madres que crían con el cuerpo, otras con el alma — tú haces las dos cosas a la vez, y haces que parezca un milagro normal.', cite: 'Sobre tu maternidad' },
      { text: 'Mi suerte se mide en pequeños momentos: tu mano sobre la mía, tu voz al despertarte, y la certeza de que estás conmigo.', cite: 'Mi mayor suerte' },
      { text: 'Si todos los días son una carta, tú eres la frase que la abre y la firma que la cierra.', cite: 'Mi todo · mi chinita' }
    ]
  },

  recipe: {
    num: 'N.º 05',
    title_1: 'La receta',
    title_2: 'de quererte',
    quote: '"El amor no es una receta exacta — pero contigo, todo me sale bien."',
    stamp: '— De la cocina del alma —',
    title: 'Mari, mi chinita — mi receta favorita',
    meta: 'Tiempo: ~3 años (y los que vienen) · Sirve: para siempre',
    ingredients: [
      { qty: '1 taza',     ing: 'de paciencia infinita' },
      { qty: '2 cdas.',    ing: 'de risa contagiosa' },
      { qty: 'al gusto',   ing: 'de ternura — siempre extra' },
      { qty: '3 pizcas',   ing: 'de valentía silenciosa' },
      { qty: '1 chorrito', ing: 'de café compartido' },
      { qty: 'un puñado',  ing: 'de miradas largas y dulces' },
      { qty: '∞',          ing: 'de amor — sin medida' }
    ],
    footnote: 'Mezclar todo con calma, dejar reposar entre dos miradas, servir en cualquier día — y repetir, mañana, también.'
  },

  reasons: {
    num: 'N.º 06',
    title_1: 'Ocho razones',
    title_2: 'entre miles',
    blurb: 'Cada tarjeta esconde una cosa que admiro de ti. Tócalas — gíralas — son tuyas.',
    items: [
      { n: 'I',    title: 'Tu manera de cuidar',          back: 'Cuidas con detalle, con paciencia, con un corazón que no se cansa.' },
      { n: 'II',   title: 'Tu risa',                       back: 'Es la melodía que pongo en bucle en mi cabeza cuando el día se pone gris.' },
      { n: 'III',  title: 'Tu fuerza silenciosa',          back: 'Sostienes mundos enteros sin pedir aplausos. Yo te aplaudo igualmente.' },
      { n: 'IV',   title: 'La forma en que amas',          back: 'Amas en presente, sin reservas, y haces que amar parezca lo más natural.' },
      { n: 'V',    title: 'Tu mirada',                     back: 'En tus ojos cabe todo lo bueno que conozco del mundo.' },
      { n: 'VI',   title: 'Tu valentía',                   back: 'Te enfrentas a lo difícil con elegancia. Eres mi referente más bonito.' },
      { n: 'VII',  title: 'Tu ternura',                    back: 'Es el tipo de ternura que no se finge, la que se siente con los huesos.' },
      { n: 'VIII', title: 'Por ser tú',                    back: 'No necesitas ser nada más. Tú, exactamente como eres, ya eres todo.' }
    ]
  },

  promises: {
    num: 'N.º 07',
    title_1: 'Cinco promesas',
    title_2: 'que te firmo hoy',
    items: [
      { n: '01', text: 'Acompañarte en lo bonito y, sobre todo, en lo difícil.', meta: 'siempre' },
      { n: '02', text: 'Hacerte el café exactamente como te gusta — en silencio, en cama.', meta: 'cada mañana' },
      { n: '03', text: 'Recordarte lo extraordinaria que eres cuando se te olvide.', meta: 'todos los días' },
      { n: '04', text: 'Bailar contigo aunque no haya música.', meta: 'cuando sea' },
      { n: '05', text: 'Cuidar lo nuestro como se cuida lo más bonito que se tiene.', meta: 'para siempre' }
    ],
    sig_meta: '— firmado, con todo —'
  },

  music: {
    num: 'N.º 08',
    title_1: 'Una canción,',
    title_2: 'hecha para ti',
    blurb: 'Pulsa para encender una pequeña melodía suave, escrita en este sitio nota a nota — para que te acompañe mientras lees.',
    track_title: '"Para Mari"',
    track_sub: '(en piano y harpa)',
    track_meta: '— compuesta a mano, con código —'
  },

  stars: {
    badge: 'Constelación de deseos',
    title_1: 'Cada toque',
    title_2: 'es una estrella para ti.',
    blurb: 'Pulsa donde quieras: cada estrella se queda guardada y se va uniendo a las anteriores. Tu propio cielo, hecho de pensamientos.',
    hint: '— pulsa para añadir una estrella —',
    empty: 'Aún no hay estrellas. Empieza la constelación.'
  },

  heart: {
    num: 'N.º 09 — el más bonito',
    title_1: 'Toca el corazón',
    title_2: 'cada vez que pienses en mí',
    blurb: 'Cada toque queda guardado en este sitio — como una pequeña constelación de momentos en los que te acordaste de mí.',
    label: '— pulsa —',
    counter_unit: 'veces que te quise hoy'
  },

  gift: {
    badge: 'Tu regalo',
    title_1: 'Toca el lazo,',
    title_2: 'ábrelo con calma.',
    seal: 'M',
    message: 'Mi regalo de hoy es **una promesa simple**: seguir eligiéndote cada mañana, cuidar lo nuestro como un jardín, y recordarte — una y otra vez — que **la madre, la mujer, la compañera** que eres es lo más bonito que me ha pasado.\n\nFeliz Día de la Madre, Mari. **Te quiero.**',
    cta: '— pulsa para abrir —'
  },

  finale: {
    name: 'Mari',
    lines: [
      'Por la **madre**, la **mujer**, la **compañera** y el **hogar** que eres.',
      'Por la forma en la que cuidas, en la que amas, y en la que llenas todo de luz.',
      'Por casi **tres años** y por todo lo que hemos pasado.',
      'Hoy, mañana, y siempre — **te elijo a ti, mi chinita**.'
    ],
    from: '— Hecho por JOEL con mucho cariño —'
  },

  footer: {
    title_1: 'Feliz Día de la Madre,',
    title_2: 'mi chinita.',
    sub_1: 'Hecho por JOEL ♥ con mucho cariño · 10 · 05 · 2026',
    sub_2: 'Casi 3 años contigo · y los que vienen · J + M'
  },

  nav: {
    brand: 'Para Mari',
    links: [
      { label: 'Carta',          href: '#carta' },
      { label: 'Jardín 3D',      href: '#jardin' },
      { label: 'Nuestros días',  href: '#nuestros-dias' },
      { label: 'Memorias',       href: '#galeria' },
      { label: 'Razones',        href: '#razones' },
      { label: 'Promesas',       href: '#promesas' },
      { label: '♡',              href: '#corazon' }
    ]
  }
};

/* Helper used by the React components.
 * `c('hero.blurb')` returns whatever the user has set in the dashboard,
 * falling back to SiteDefaults if not set / invalid. */
window.c = function (path, fallback) {
  const src = window.SiteContent || window.SiteDefaults || {};
  const parts = String(path || '').split('.');
  let v = src;
  for (const k of parts) {
    if (v == null) break;
    v = v[k];
  }
  if (v == null) {
    // Fall through to defaults if SiteContent is missing this leaf.
    if (window.SiteContent && window.SiteContent !== window.SiteDefaults) {
      v = window.SiteDefaults;
      for (const k of parts) {
        if (v == null) break;
        v = v[k];
      }
    }
  }
  return v == null ? (fallback != null ? fallback : '') : v;
};

/* Tiny inline-formatting helper: turns **bold** into <strong>...</strong>
 * Used for any field that may carry light markdown from the dashboard. */
window.cFmt = function (text) {
  if (text == null) return null;
  const s = String(text);
  // split by ** keeping bold segments
  const parts = s.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (/^\*\*.+\*\*$/.test(part)) {
      return React.createElement('strong', { key: i }, part.slice(2, -2));
    }
    return part;
  });
};
