/* ----------------------------------------------------------------------------
 * admin.jsx — single-page React admin for Mari's Mother's Day site.
 *
 * Responsibilities:
 *   1. Login gate — verifies the shared ADMIN_PASSWORD via /api/verify and
 *      caches it in localStorage under `mari-admin-pw`.
 *   2. Edits the site_content JSON (loaded from /api/content, merged with
 *      window.SiteDefaults) section-by-section. Saves the FULL merged JSON
 *      via POST /api/content per section save (or debounced auto-save).
 *   3. Wires <image-slot> uploads straight to /api/upload (and /api/delete)
 *      via window.omelette.writeFile, mirroring the diff/sync in cms.js.
 *   4. Hydrates IndexedDB from /api/slots so embedded image-slots display
 *      the latest manifest (the same fetch monkey-patch trick cms.js uses).
 * -------------------------------------------------------------------------- */

const { useState, useEffect, useMemo, useRef, useCallback } = React;
const h = React.createElement;

const PW_KEY = 'mari-admin-pw';
const STATE_FILE = '.image-slots.state.json';
const DB_NAME = 'mari-cms';
const STORE = 'kv';

/* ─────────────────────────── IndexedDB helpers ─────────────────────────── */
/* Same KV helpers as cms.js — image-slot.js fetches `.image-slots.state.json`
 * and we serve the IDB blob via the monkey-patch below. */
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function kvGet(key) {
  try {
    const db = await openDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const r = tx.objectStore(STORE).get(key);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
  } catch { return null; }
}
async function kvSet(key, value) {
  try {
    const db = await openDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const r = tx.objectStore(STORE).put(value, key);
      r.onsuccess = () => resolve();
      r.onerror = () => reject(r.error);
    });
  } catch {}
}

/* ────────────────────── fetch monkey-patch + slot sync ─────────────────── */
/* Image-slot fetches `.image-slots.state.json`; we hijack that and serve the
 * latest manifest from IDB (or, if empty, fall back to /api/slots). This is
 * the minimum subset of cms.js needed for image-slots to render correctly. */
let lastSlots = null;          // last known slots snapshot for diffing
let slotsHydrated = null;      // promise that resolves when IDB has data

(function installFetchShim() {
  const _fetch = window.fetch.bind(window);
  slotsHydrated = (async () => {
    try {
      const r = await _fetch('/api/slots', { cache: 'no-cache' });
      if (r.ok) {
        const j = await r.json();
        if (j && typeof j === 'object') {
          await kvSet('image-slots', j);
          lastSlots = JSON.parse(JSON.stringify(j));
          window.dispatchEvent(new CustomEvent('mari:slots-synced'));
          return j;
        }
      }
    } catch {}
    const cached = (await kvGet('image-slots')) || {};
    lastSlots = JSON.parse(JSON.stringify(cached));
    return cached;
  })();

  window.fetch = async function (input, init) {
    const url = typeof input === 'string' ? input : (input && input.url) || '';
    const isStateFile = url === STATE_FILE || url.endsWith('/' + STATE_FILE);
    if (isStateFile) {
      try { await Promise.race([slotsHydrated, new Promise(r => setTimeout(r, 1200))]); } catch {}
      const stored = (await kvGet('image-slots')) || {};
      return new Response(JSON.stringify(stored), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    return _fetch(input, init);
  };
})();

/* ────────────────────── /api/* helpers (slot writes) ───────────────────── */
function getPw() { return localStorage.getItem(PW_KEY) || ''; }

async function apiVerify(pw) {
  try {
    const r = await fetch('/api/verify', { method: 'POST', headers: { 'x-admin-password': pw } });
    return r.ok;
  } catch { return false; }
}

async function apiUpload(id, dataUrl, crop) {
  const pw = getPw(); if (!pw) return null;
  const r = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-password': pw },
    body: JSON.stringify({ id, dataUrl, crop })
  });
  if (!r.ok) throw new Error('upload ' + r.status);
  return r.json().catch(() => null);
}
async function apiRecrop(id, crop) {
  const pw = getPw(); if (!pw) return;
  await fetch('/api/recrop', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-password': pw },
    body: JSON.stringify({ id, crop })
  });
}
async function apiDelete(id) {
  const pw = getPw(); if (!pw) return;
  await fetch('/api/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-password': pw },
    body: JSON.stringify({ id })
  });
}

/* Diff prev→next slots and route each change to the right API. Mirrors
 * cms.js#syncDiff so behaviour stays identical. */
function num(v, d) { const n = Number(v); return Number.isFinite(n) ? n : d; }
function sameCrop(a, b) {
  return num(a && a.s, 1) === num(b && b.s, 1)
      && num(a && a.x, 0) === num(b && b.x, 0)
      && num(a && a.y, 0) === num(b && b.y, 0);
}
function sameSlot(a, b) {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return a.u === b.u && sameCrop(a, b);
}
async function syncSlotDiff(prev, next, onToast) {
  const prevKeys = new Set(Object.keys(prev || {}));
  const nextKeys = new Set(Object.keys(next || {}));
  for (const id of prevKeys) {
    if (!nextKeys.has(id)) await apiDelete(id);
  }
  for (const id of nextKeys) {
    const a = prev[id], b = next[id];
    if (sameSlot(a, b)) continue;
    const url = (b && b.u) || '';
    const crop = { s: num(b && b.s, 1), x: num(b && b.x, 0), y: num(b && b.y, 0) };
    if (a && a.u && a.u === url && !sameCrop(a, b)) {
      await apiRecrop(id, crop);
    } else if (/^data:image\//i.test(url)) {
      try {
        const json = await apiUpload(id, url, crop);
        if (json && json.url) {
          // Replace the data: URL with the public one in IDB so a subsequent
          // sync isn't tricked into re-uploading the same bytes.
          const cur = (await kvGet('image-slots')) || {};
          cur[id] = { u: json.url, ...crop };
          await kvSet('image-slots', cur);
          lastSlots = JSON.parse(JSON.stringify(cur));
        }
        if (onToast) onToast('Foto subida');
      } catch (e) {
        if (onToast) onToast('Error subiendo foto', true);
      }
    } else if (/^https?:\/\//i.test(url) && !sameCrop(a, b)) {
      await apiRecrop(id, crop);
    }
  }
}

/* Set the omelette.writeFile shim image-slot looks for. Without it the
 * custom element stays read-only. */
function installOmelette(onToast) {
  if (!window.omelette) window.omelette = {};
  window.omelette.writeFile = async (filename, content) => {
    const base = String(filename || '').split('/').pop();
    if (base !== STATE_FILE) return;
    let next; try { next = JSON.parse(content); } catch { return; }
    await kvSet('image-slots', next);
    await syncSlotDiff(lastSlots || {}, next || {}, onToast);
    lastSlots = JSON.parse(JSON.stringify(next || {}));
  };
}

/* ─────────────────────────── Deep merge (defaults ⊕ saved) ─────────────── */
/* Recursively merges `over` onto `base` so a partial saved JSON still has
 * every key the UI expects. Arrays from `over` win wholesale (so removing
 * an item really removes it), and objects merge key-wise. */
function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}
function mergeDefaults(base, over) {
  if (over === undefined) return clone(base);
  if (Array.isArray(base)) return Array.isArray(over) ? clone(over) : clone(base);
  if (isPlainObject(base)) {
    const out = {};
    const keys = new Set([...Object.keys(base), ...(isPlainObject(over) ? Object.keys(over) : [])]);
    for (const k of keys) {
      if (k in (over || {}) && (over || {})[k] !== undefined) {
        out[k] = mergeDefaults(base[k], over[k]);
      } else {
        out[k] = clone(base[k]);
      }
    }
    return out;
  }
  return over !== undefined ? over : base;
}
function clone(v) { return v == null ? v : JSON.parse(JSON.stringify(v)); }

/* ─────────────────────────── Sidebar config ────────────────────────────── */
/* The order here drives the sidebar order. Each entry maps to a section key
 * in window.SiteDefaults plus a render fn (defined below in SECTIONS). */
const SECTION_LIST = [
  { key: 'hero',       label: 'Inicio',           num: '01' },
  { key: 'motherhood', label: 'La madre',         num: '02' },
  { key: 'letter',     label: 'Carta',            num: '03' },
  { key: 'garden',     label: 'Jardín 3D',        num: '04' },
  { key: 'timeline',   label: 'Nuestros días',    num: '05' },
  { key: 'gallery',    label: 'Memorias / Fotos', num: '06' },
  { key: 'quotes',     label: 'Quotes',           num: '07' },
  { key: 'recipe',     label: 'Receta',           num: '08' },
  { key: 'reasons',    label: 'Razones',          num: '09' },
  { key: 'promises',   label: 'Promesas',         num: '10' },
  { key: 'music',      label: 'Canción',          num: '11' },
  { key: 'stars',      label: 'Cielo',            num: '12' },
  { key: 'heart',      label: 'Corazón',          num: '13' },
  { key: 'gift',       label: 'Regalo',           num: '14' },
  { key: 'finale',     label: 'Final',            num: '15' },
  { key: 'footer',     label: 'Footer',           num: '16' },
  { key: 'nav',        label: 'Nav',              num: '17' },
  { key: 'meta',       label: 'Meta',             num: '18' }
];
const PHOTOS_TAB_KEY = '__photos__';

/* ─────────────────────────── Editing primitives ────────────────────────── */
function TextInput({ label, value, onChange, hint, placeholder }) {
  return (
    <div className="field">
      {label && <label>{label}</label>}
      <input
        className="input"
        type="text"
        value={value == null ? '' : value}
        placeholder={placeholder || ''}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint && <div className="field-hint">{hint}</div>}
    </div>
  );
}

function TextArea({ label, value, onChange, rows, hint, placeholder }) {
  return (
    <div className="field">
      {label && <label>{label}</label>}
      <textarea
        className="textarea"
        rows={rows || 3}
        value={value == null ? '' : value}
        placeholder={placeholder || ''}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint && <div className="field-hint">{hint}</div>}
    </div>
  );
}

/* HtmlInput — same as TextArea but monospace, for fields that contain
 * raw HTML like meta.boot_sub. */
function HtmlInput({ label, value, onChange, rows, hint }) {
  return (
    <div className="field">
      {label && <label>{label}</label>}
      <textarea
        className="textarea html-input"
        rows={rows || 2}
        value={value == null ? '' : value}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="field-hint">{hint || 'HTML permitido — p. ej. <strong>texto</strong>'}</div>
    </div>
  );
}

/* ListEditor — generic add/move/remove wrapper for arrays of objects.
 * `renderItem(item, update)` returns the row's input fields. `template`
 * supplies the default new-item shape. */
function ListEditor({ label, items, onChange, renderItem, template, addLabel, emptyHint }) {
  const list = Array.isArray(items) ? items : [];
  const update = (idx, patch) => {
    const next = list.slice();
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };
  const move = (idx, dir) => {
    const j = idx + dir;
    if (j < 0 || j >= list.length) return;
    const next = list.slice();
    [next[idx], next[j]] = [next[j], next[idx]];
    onChange(next);
  };
  const remove = (idx) => {
    if (!confirm('¿Borrar este elemento?')) return;
    const next = list.slice(); next.splice(idx, 1); onChange(next);
  };
  const add = () => {
    const next = list.slice(); next.push(clone(template) || {}); onChange(next);
  };
  return (
    <div className="field">
      {label && <label>{label}</label>}
      <div className="list-editor">
        {list.length === 0 && (
          <div className="list-empty">{emptyHint || 'Sin elementos. Pulsa Añadir.'}</div>
        )}
        {list.map((item, idx) => (
          <div className="list-row" key={idx}>
            <div className="list-row-fields">
              {renderItem(item, (patch) => update(idx, patch), idx)}
            </div>
            <div className="list-row-actions">
              <button className="btn btn-tiny btn-ghost" onClick={() => move(idx, -1)} disabled={idx === 0} title="Subir">↑</button>
              <button className="btn btn-tiny btn-ghost" onClick={() => move(idx,  1)} disabled={idx === list.length - 1} title="Bajar">↓</button>
              <button className="btn btn-tiny btn-danger" onClick={() => remove(idx)} title="Borrar">✕</button>
            </div>
          </div>
        ))}
        <button className="btn list-add" onClick={add}>+ {addLabel || 'Añadir'}</button>
      </div>
    </div>
  );
}

/* PhotoCard — embeds a real <image-slot> so the same drop / reframe / save
 * flow works inside the dashboard. */
function PhotoCard({ slotId, placeholder, caption, onCaptionChange, onDelete, slotsRev }) {
  const ref = useRef(null);
  // Re-mount the slot whenever the manifest hydration completes, so the
  // initial paint reflects what /api/slots returned.
  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = '';
    const el = document.createElement('image-slot');
    el.id = slotId;
    el.setAttribute('placeholder', placeholder || 'Tu foto');
    el.setAttribute('shape', 'rect');
    ref.current.appendChild(el);
  }, [slotId, placeholder, slotsRev]);
  return (
    <div className="photo-card">
      <div className="slot-box" ref={ref}></div>
      <div className="slot-id">{slotId}</div>
      {onCaptionChange != null && (
        <TextInput label="Pie de foto" value={caption || ''} onChange={onCaptionChange} />
      )}
      {onDelete && (
        <div className="slot-actions">
          <button className="btn btn-tiny btn-danger" onClick={onDelete}>Borrar foto</button>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── Section renderers ─────────────────────────── */
/* Each takes the section's slice + an `update(patch)` function and returns
 * the form. Save / reset wraps these — they only render fields. */

function HeroSection({ data, set, slotsRev }) {
  return (
    <>
      <div className="card">
        <h3 className="card-title">Cabecera</h3>
        <div className="field-grid">
          <TextInput label="Eyebrow" value={data.eyebrow} onChange={(v) => set({ eyebrow: v })} />
          <TextInput label="Número (decoración)" value={data.num} onChange={(v) => set({ num: v })} />
          <TextInput label="Título 1" value={data.title_1} onChange={(v) => set({ title_1: v })} />
          <TextInput label="Título 2" value={data.title_2} onChange={(v) => set({ title_2: v })} />
          <TextInput label="Nombre destacado" value={data.title_name} onChange={(v) => set({ title_name: v })} />
        </div>
        <div style={{ height: 12 }} />
        <TextArea label="Blurb" value={data.blurb} rows={4} onChange={(v) => set({ blurb: v })} hint="Soporta **negrita**." />
        <div className="field-grid" style={{ marginTop: 12 }}>
          <TextInput label="Fecha grande" value={data.date_big} onChange={(v) => set({ date_big: v })} />
          <TextInput label="Fecha pequeña" value={data.date_small} onChange={(v) => set({ date_small: v })} />
          <TextInput label="Pista de scroll" value={data.scroll_hint} onChange={(v) => set({ scroll_hint: v })} />
        </div>
        <div style={{ height: 12 }} />
        <TextArea label="Marquee" value={data.marquee} rows={2} onChange={(v) => set({ marquee: v })} hint="Texto que rota en bucle." />
      </div>

      <div className="card">
        <h3 className="card-title">Estadísticas</h3>
        <ListEditor
          items={data.stats}
          template={{ big: '', lbl: '' }}
          addLabel="Añadir estadística"
          renderItem={(item, upd) => (
            <>
              <TextInput label="Valor (big)" value={item.big} onChange={(v) => upd({ big: v })} />
              <TextInput label="Etiqueta" value={item.lbl} onChange={(v) => upd({ lbl: v })} />
            </>
          )}
          onChange={(stats) => set({ stats })}
        />
      </div>
    </>
  );
}

function MotherhoodSection({ data, set, slotsRev }) {
  return (
    <>
      <div className="card">
        <h3 className="card-title">Texto</h3>
        <div className="field-grid">
          <TextInput label="Badge" value={data.badge} onChange={(v) => set({ badge: v })} />
          <TextInput label="Stamp arriba" value={data.stamp_top} onChange={(v) => set({ stamp_top: v })} />
          <TextInput label="Stamp abajo" value={data.stamp_bot} onChange={(v) => set({ stamp_bot: v })} />
          <TextInput label="Título 1" value={data.title_1} onChange={(v) => set({ title_1: v })} />
          <TextInput label="Título 2" value={data.title_2} onChange={(v) => set({ title_2: v })} />
          <TextInput label="Pie de foto" value={data.photo_caption} onChange={(v) => set({ photo_caption: v })} />
        </div>
        <div style={{ height: 12 }} />
        <ListEditor
          label="Párrafos"
          items={(data.paragraphs || []).map((t) => ({ t }))}
          template={{ t: '' }}
          addLabel="Añadir párrafo"
          renderItem={(item, upd) => (
            <TextArea label="" value={item.t} rows={3} onChange={(v) => upd({ t: v })} />
          )}
          onChange={(arr) => set({ paragraphs: arr.map((x) => x.t) })}
        />
      </div>

      <div className="card">
        <h3 className="card-title">Foto de Mari</h3>
        <p className="section-help" style={{ marginTop: 0 }}>Arrastra una foto al marco. Doble-click para reencuadrar.</p>
        <div style={{ maxWidth: 320 }}>
          <PhotoCard slotId="mother-portrait" placeholder="Foto de Mari" slotsRev={slotsRev} />
        </div>
      </div>
    </>
  );
}

function LetterSection({ data, set }) {
  return (
    <>
      <div className="card">
        <h3 className="card-title">Encabezado</h3>
        <div className="field-grid">
          <TextInput label="Número" value={data.num} onChange={(v) => set({ num: v })} />
          <TextInput label="Eyebrow" value={data.eyebrow} onChange={(v) => set({ eyebrow: v })} />
          <TextInput label="Título 1" value={data.title_1} onChange={(v) => set({ title_1: v })} />
          <TextInput label="Título 2" value={data.title_2} onChange={(v) => set({ title_2: v })} />
          <TextInput label="Saludo" value={data.greeting} onChange={(v) => set({ greeting: v })} />
        </div>
      </div>
      <div className="card">
        <h3 className="card-title">Cuerpo de la carta</h3>
        <ListEditor
          items={(data.paragraphs || []).map((t) => ({ t }))}
          template={{ t: '' }}
          addLabel="Añadir párrafo"
          renderItem={(item, upd) => (
            <TextArea label="" value={item.t} rows={4} onChange={(v) => upd({ t: v })} />
          )}
          onChange={(arr) => set({ paragraphs: arr.map((x) => x.t) })}
        />
      </div>
      <div className="card">
        <h3 className="card-title">Firma</h3>
        <div className="field-grid">
          <TextInput label="Firma" value={data.sign} onChange={(v) => set({ sign: v })} />
          <TextInput label="Meta firma" value={data.sign_meta} onChange={(v) => set({ sign_meta: v })} />
          <TextInput label="Sello (1 letra)" value={data.seal} onChange={(v) => set({ seal: v })} />
        </div>
      </div>
    </>
  );
}

function GardenSection({ data, set }) {
  return (
    <div className="card">
      <h3 className="card-title">Texto</h3>
      <div className="field-grid">
        <TextInput label="Número" value={data.num} onChange={(v) => set({ num: v })} />
        <TextInput label="Título 1" value={data.title_1} onChange={(v) => set({ title_1: v })} />
        <TextInput label="Título 2" value={data.title_2} onChange={(v) => set({ title_2: v })} />
        <TextInput label="Título 3" value={data.title_3} onChange={(v) => set({ title_3: v })} />
      </div>
      <div style={{ height: 12 }} />
      <TextArea label="Blurb" value={data.blurb} rows={3} onChange={(v) => set({ blurb: v })} />
      <div style={{ height: 12 }} />
      <ListEditor
        label="Chips"
        items={(data.chips || []).map((t) => ({ t }))}
        template={{ t: '' }}
        addLabel="Añadir chip"
        renderItem={(item, upd) => (
          <TextInput label="" value={item.t} onChange={(v) => upd({ t: v })} />
        )}
        onChange={(arr) => set({ chips: arr.map((x) => x.t) })}
      />
    </div>
  );
}

function TimelineSection({ data, set }) {
  return (
    <>
      <div className="card">
        <h3 className="card-title">Encabezado</h3>
        <div className="field-grid">
          <TextInput label="Número" value={data.num} onChange={(v) => set({ num: v })} />
          <TextInput label="Título 1" value={data.title_1} onChange={(v) => set({ title_1: v })} />
          <TextInput label="Título 2" value={data.title_2} onChange={(v) => set({ title_2: v })} />
        </div>
        <div style={{ height: 12 }} />
        <TextArea label="Blurb" value={data.blurb} rows={2} onChange={(v) => set({ blurb: v })} />
      </div>
      <div className="card">
        <h3 className="card-title">Hitos</h3>
        <ListEditor
          items={data.items}
          template={{ when: '', title: '', txt: '' }}
          addLabel="Añadir hito"
          renderItem={(item, upd) => (
            <>
              <TextInput label="Cuándo" value={item.when} onChange={(v) => upd({ when: v })} />
              <TextInput label="Título" value={item.title} onChange={(v) => upd({ title: v })} />
              <TextArea label="Texto" value={item.txt} rows={2} onChange={(v) => upd({ txt: v })} />
            </>
          )}
          onChange={(items) => set({ items })}
        />
      </div>
    </>
  );
}

function GallerySection({ data, set, slotsRev }) {
  return (
    <>
      <div className="card">
        <h3 className="card-title">Encabezado</h3>
        <div className="field-grid">
          <TextInput label="Número" value={data.num} onChange={(v) => set({ num: v })} />
          <TextInput label="Título 1" value={data.title_1} onChange={(v) => set({ title_1: v })} />
          <TextInput label="Título 2" value={data.title_2} onChange={(v) => set({ title_2: v })} />
        </div>
        <div style={{ height: 12 }} />
        <TextArea label="Blurb" value={data.blurb} rows={2} onChange={(v) => set({ blurb: v })} />
      </div>
      <div className="card">
        <h3 className="card-title">Marcos</h3>
        <p className="section-help" style={{ marginTop: 0, marginBottom: 12 }}>
          Cada marco tiene un id único, un placeholder cuando está vacío, y un pie de foto.
          Arrastra una imagen sobre cualquier marco para subirla.
        </p>
        <div className="photo-grid">
          {(data.items || []).map((it, idx) => (
            <div key={it.id || idx} style={{ display: 'grid', gap: 8 }}>
              <PhotoCard
                slotId={it.id}
                placeholder={it.placeholder}
                slotsRev={slotsRev}
              />
              <TextInput label="ID" value={it.id} onChange={(v) => {
                const items = data.items.slice(); items[idx] = { ...items[idx], id: v }; set({ items });
              }} hint="Cambia esto solo si sabes lo que haces." />
              <TextInput label="Placeholder" value={it.placeholder} onChange={(v) => {
                const items = data.items.slice(); items[idx] = { ...items[idx], placeholder: v }; set({ items });
              }} />
              <TextInput label="Pie de foto" value={it.caption} onChange={(v) => {
                const items = data.items.slice(); items[idx] = { ...items[idx], caption: v }; set({ items });
              }} />
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-tiny btn-ghost" disabled={idx === 0} onClick={() => {
                  const items = data.items.slice();
                  [items[idx - 1], items[idx]] = [items[idx], items[idx - 1]];
                  set({ items });
                }}>↑</button>
                <button className="btn btn-tiny btn-ghost" disabled={idx === data.items.length - 1} onClick={() => {
                  const items = data.items.slice();
                  [items[idx + 1], items[idx]] = [items[idx], items[idx + 1]];
                  set({ items });
                }}>↓</button>
                <button className="btn btn-tiny btn-danger" onClick={() => {
                  if (!confirm('¿Quitar este marco? (No borra la foto del servidor)')) return;
                  const items = data.items.slice(); items.splice(idx, 1); set({ items });
                }}>Quitar marco</button>
              </div>
            </div>
          ))}
        </div>
        <div style={{ height: 12 }} />
        <button className="btn" onClick={() => {
          // Auto-generate the next id (foto-N) so newly added marcos persist.
          const ids = (data.items || []).map((x) => x.id || '').filter((x) => /^foto-\d+$/.test(x));
          const nums = ids.map((x) => parseInt(x.split('-')[1], 10)).filter((n) => Number.isFinite(n));
          const next = (nums.length ? Math.max(...nums) : 0) + 1;
          const items = (data.items || []).slice();
          items.push({ id: 'foto-' + next, placeholder: 'Una foto bonita', caption: '' });
          set({ items });
        }}>+ Añadir marco</button>
      </div>
    </>
  );
}

function QuotesSection({ data, set }) {
  return (
    <div className="card">
      <h3 className="card-title">Pensamientos</h3>
      <TextInput label="Etiqueta" value={data.label} onChange={(v) => set({ label: v })} />
      <div style={{ height: 12 }} />
      <ListEditor
        items={data.items}
        template={{ text: '', cite: '' }}
        addLabel="Añadir pensamiento"
        renderItem={(item, upd) => (
          <>
            <TextArea label="Texto" value={item.text} rows={3} onChange={(v) => upd({ text: v })} />
            <TextInput label="Cita" value={item.cite} onChange={(v) => upd({ cite: v })} />
          </>
        )}
        onChange={(items) => set({ items })}
      />
    </div>
  );
}

function RecipeSection({ data, set, slotsRev }) {
  return (
    <>
      <div className="card">
        <h3 className="card-title">Encabezado</h3>
        <div className="field-grid">
          <TextInput label="Número" value={data.num} onChange={(v) => set({ num: v })} />
          <TextInput label="Título 1" value={data.title_1} onChange={(v) => set({ title_1: v })} />
          <TextInput label="Título 2" value={data.title_2} onChange={(v) => set({ title_2: v })} />
          <TextInput label="Stamp" value={data.stamp} onChange={(v) => set({ stamp: v })} />
        </div>
        <div style={{ height: 12 }} />
        <TextArea label="Cita" value={data.quote} rows={2} onChange={(v) => set({ quote: v })} />
      </div>
      <div className="card">
        <h3 className="card-title">Receta</h3>
        <div className="field-grid">
          <TextInput label="Título de la receta" value={data.title} onChange={(v) => set({ title: v })} />
          <TextInput label="Meta (tiempo / sirve)" value={data.meta} onChange={(v) => set({ meta: v })} />
        </div>
        <div style={{ height: 12 }} />
        <ListEditor
          label="Ingredientes"
          items={data.ingredients}
          template={{ qty: '', ing: '' }}
          addLabel="Añadir ingrediente"
          renderItem={(item, upd) => (
            <>
              <TextInput label="Cantidad" value={item.qty} onChange={(v) => upd({ qty: v })} />
              <TextInput label="Ingrediente" value={item.ing} onChange={(v) => upd({ ing: v })} />
            </>
          )}
          onChange={(ingredients) => set({ ingredients })}
        />
        <div style={{ height: 12 }} />
        <TextArea label="Footnote" value={data.footnote} rows={2} onChange={(v) => set({ footnote: v })} />
      </div>
      <div className="card">
        <h3 className="card-title">Foto de la receta</h3>
        <div style={{ maxWidth: 280 }}>
          <PhotoCard slotId="recipe-photo" placeholder="Una foto que me inspira" slotsRev={slotsRev} />
        </div>
      </div>
    </>
  );
}

function ReasonsSection({ data, set }) {
  return (
    <>
      <div className="card">
        <h3 className="card-title">Encabezado</h3>
        <div className="field-grid">
          <TextInput label="Número" value={data.num} onChange={(v) => set({ num: v })} />
          <TextInput label="Título 1" value={data.title_1} onChange={(v) => set({ title_1: v })} />
          <TextInput label="Título 2" value={data.title_2} onChange={(v) => set({ title_2: v })} />
        </div>
        <div style={{ height: 12 }} />
        <TextArea label="Blurb" value={data.blurb} rows={2} onChange={(v) => set({ blurb: v })} />
      </div>
      <div className="card">
        <h3 className="card-title">Tarjetas</h3>
        <ListEditor
          items={data.items}
          template={{ n: '', title: '', back: '' }}
          addLabel="Añadir tarjeta"
          renderItem={(item, upd) => (
            <>
              <TextInput label="N (romanos)" value={item.n} onChange={(v) => upd({ n: v })} />
              <TextInput label="Título" value={item.title} onChange={(v) => upd({ title: v })} />
              <TextArea label="Reverso" value={item.back} rows={2} onChange={(v) => upd({ back: v })} />
            </>
          )}
          onChange={(items) => set({ items })}
        />
      </div>
    </>
  );
}

function PromisesSection({ data, set }) {
  return (
    <>
      <div className="card">
        <h3 className="card-title">Encabezado</h3>
        <div className="field-grid">
          <TextInput label="Número" value={data.num} onChange={(v) => set({ num: v })} />
          <TextInput label="Título 1" value={data.title_1} onChange={(v) => set({ title_1: v })} />
          <TextInput label="Título 2" value={data.title_2} onChange={(v) => set({ title_2: v })} />
          <TextInput label="Meta firma" value={data.sig_meta} onChange={(v) => set({ sig_meta: v })} />
        </div>
      </div>
      <div className="card">
        <h3 className="card-title">Promesas</h3>
        <ListEditor
          items={data.items}
          template={{ n: '', text: '', meta: '' }}
          addLabel="Añadir promesa"
          renderItem={(item, upd) => (
            <>
              <TextInput label="N" value={item.n} onChange={(v) => upd({ n: v })} />
              <TextArea label="Texto" value={item.text} rows={2} onChange={(v) => upd({ text: v })} />
              <TextInput label="Meta" value={item.meta} onChange={(v) => upd({ meta: v })} />
            </>
          )}
          onChange={(items) => set({ items })}
        />
      </div>
    </>
  );
}

function MusicSection({ data, set }) {
  return (
    <div className="card">
      <h3 className="card-title">Canción</h3>
      <div className="field-grid">
        <TextInput label="Número" value={data.num} onChange={(v) => set({ num: v })} />
        <TextInput label="Título 1" value={data.title_1} onChange={(v) => set({ title_1: v })} />
        <TextInput label="Título 2" value={data.title_2} onChange={(v) => set({ title_2: v })} />
        <TextInput label="Track title" value={data.track_title} onChange={(v) => set({ track_title: v })} />
        <TextInput label="Track sub" value={data.track_sub} onChange={(v) => set({ track_sub: v })} />
        <TextInput label="Track meta" value={data.track_meta} onChange={(v) => set({ track_meta: v })} />
      </div>
      <div style={{ height: 12 }} />
      <TextArea label="Blurb" value={data.blurb} rows={3} onChange={(v) => set({ blurb: v })} />
    </div>
  );
}

function StarsSection({ data, set }) {
  return (
    <div className="card">
      <h3 className="card-title">Cielo de estrellas</h3>
      <div className="field-grid">
        <TextInput label="Badge" value={data.badge} onChange={(v) => set({ badge: v })} />
        <TextInput label="Título 1" value={data.title_1} onChange={(v) => set({ title_1: v })} />
        <TextInput label="Título 2" value={data.title_2} onChange={(v) => set({ title_2: v })} />
        <TextInput label="Hint" value={data.hint} onChange={(v) => set({ hint: v })} />
        <TextInput label="Empty state" value={data.empty} onChange={(v) => set({ empty: v })} />
      </div>
      <div style={{ height: 12 }} />
      <TextArea label="Blurb" value={data.blurb} rows={2} onChange={(v) => set({ blurb: v })} />
    </div>
  );
}

function HeartSection({ data, set }) {
  return (
    <div className="card">
      <h3 className="card-title">Corazón</h3>
      <div className="field-grid">
        <TextInput label="Número" value={data.num} onChange={(v) => set({ num: v })} />
        <TextInput label="Título 1" value={data.title_1} onChange={(v) => set({ title_1: v })} />
        <TextInput label="Título 2" value={data.title_2} onChange={(v) => set({ title_2: v })} />
        <TextInput label="Label" value={data.label} onChange={(v) => set({ label: v })} />
        <TextInput label="Counter unit" value={data.counter_unit} onChange={(v) => set({ counter_unit: v })} />
      </div>
      <div style={{ height: 12 }} />
      <TextArea label="Blurb" value={data.blurb} rows={2} onChange={(v) => set({ blurb: v })} />
    </div>
  );
}

function GiftSection({ data, set }) {
  return (
    <div className="card">
      <h3 className="card-title">Regalo</h3>
      <div className="field-grid">
        <TextInput label="Badge" value={data.badge} onChange={(v) => set({ badge: v })} />
        <TextInput label="Título 1" value={data.title_1} onChange={(v) => set({ title_1: v })} />
        <TextInput label="Título 2" value={data.title_2} onChange={(v) => set({ title_2: v })} />
        <TextInput label="Sello (1 letra)" value={data.seal} onChange={(v) => set({ seal: v })} />
        <TextInput label="CTA" value={data.cta} onChange={(v) => set({ cta: v })} />
      </div>
      <div style={{ height: 12 }} />
      <TextArea label="Mensaje" value={data.message} rows={6} onChange={(v) => set({ message: v })} hint="Soporta **negrita** y saltos de línea." />
    </div>
  );
}

function FinaleSection({ data, set }) {
  return (
    <div className="card">
      <h3 className="card-title">Final</h3>
      <div className="field-grid">
        <TextInput label="Nombre destacado" value={data.name} onChange={(v) => set({ name: v })} />
        <TextInput label="Firma" value={data.from} onChange={(v) => set({ from: v })} />
      </div>
      <div style={{ height: 12 }} />
      <ListEditor
        label="Líneas"
        items={(data.lines || []).map((t) => ({ t }))}
        template={{ t: '' }}
        addLabel="Añadir línea"
        renderItem={(item, upd) => (
          <TextArea label="" value={item.t} rows={2} onChange={(v) => upd({ t: v })} />
        )}
        onChange={(arr) => set({ lines: arr.map((x) => x.t) })}
      />
    </div>
  );
}

function FooterSection({ data, set }) {
  return (
    <div className="card">
      <h3 className="card-title">Footer</h3>
      <div className="field-grid">
        <TextInput label="Título 1" value={data.title_1} onChange={(v) => set({ title_1: v })} />
        <TextInput label="Título 2" value={data.title_2} onChange={(v) => set({ title_2: v })} />
        <TextInput label="Sub 1" value={data.sub_1} onChange={(v) => set({ sub_1: v })} />
        <TextInput label="Sub 2" value={data.sub_2} onChange={(v) => set({ sub_2: v })} />
      </div>
    </div>
  );
}

function NavSection({ data, set }) {
  return (
    <>
      <div className="card">
        <h3 className="card-title">Marca</h3>
        <TextInput label="Brand" value={data.brand} onChange={(v) => set({ brand: v })} />
      </div>
      <div className="card">
        <h3 className="card-title">Enlaces</h3>
        <ListEditor
          items={data.links}
          template={{ label: '', href: '' }}
          addLabel="Añadir enlace"
          renderItem={(item, upd) => (
            <>
              <TextInput label="Etiqueta" value={item.label} onChange={(v) => upd({ label: v })} />
              <TextInput label="Href (#ancla)" value={item.href} onChange={(v) => upd({ href: v })} />
            </>
          )}
          onChange={(links) => set({ links })}
        />
      </div>
    </>
  );
}

function MetaSection({ data, set }) {
  return (
    <div className="card">
      <h3 className="card-title">Meta · pantalla de inicio</h3>
      <div className="field-grid">
        <TextInput label="Boot name" value={data.boot_name} onChange={(v) => set({ boot_name: v })} />
        <TextInput label="Page title (pestaña)" value={data.page_title} onChange={(v) => set({ page_title: v })} />
      </div>
      <div style={{ height: 12 }} />
      <HtmlInput label="Boot sub (HTML)" value={data.boot_sub} onChange={(v) => set({ boot_sub: v })} hint="Ej: Hecho por <strong>Joel</strong> con cariño" />
    </div>
  );
}

/* Map section keys → renderer + help text. */
const SECTIONS = {
  hero:       { title: 'Inicio (hero)',       help: 'La primera pantalla. Lo que Mari ve al abrir el sitio.', render: HeroSection },
  motherhood: { title: 'La madre',            help: 'Bloque dedicado a Mari como madre + foto de retrato.',     render: MotherhoodSection },
  letter:     { title: 'Carta',               help: 'La carta principal — texto en formato carta.',             render: LetterSection },
  garden:     { title: 'Jardín 3D',           help: 'Solo blurb + chips. El 3D está hardcoded.',               render: GardenSection },
  timeline:   { title: 'Nuestros días',       help: 'Línea de tiempo de momentos.',                              render: TimelineSection },
  gallery:    { title: 'Memorias / Fotos',    help: 'Marcos arrastrables. Cada uno persiste por id.',           render: GallerySection },
  quotes:     { title: 'Quotes',              help: 'Carrusel de pensamientos.',                                 render: QuotesSection },
  recipe:     { title: 'Receta',              help: '"La receta de quererte" + foto.',                           render: RecipeSection },
  reasons:    { title: 'Razones',             help: 'Tarjetas que se voltean.',                                  render: ReasonsSection },
  promises:   { title: 'Promesas',            help: 'Las cinco promesas firmadas.',                              render: PromisesSection },
  music:      { title: 'Canción',             help: 'Texto del bloque de la canción.',                          render: MusicSection },
  stars:      { title: 'Cielo de estrellas',  help: 'Constelación de toques.',                                   render: StarsSection },
  heart:      { title: 'Corazón',             help: 'El corazón pulsable.',                                      render: HeartSection },
  gift:       { title: 'Regalo',              help: 'El regalo que se abre con el lazo.',                       render: GiftSection },
  finale:     { title: 'Final',               help: 'El cierre del sitio.',                                      render: FinaleSection },
  footer:     { title: 'Footer',              help: 'Pie de página.',                                            render: FooterSection },
  nav:        { title: 'Nav',                 help: 'Marca + enlaces de la barra superior.',                    render: NavSection },
  meta:       { title: 'Meta',                help: 'Pantalla de inicio (boot) + título de la pestaña.',         render: MetaSection }
};

/* ─────────────────────────── Photos tab ────────────────────────────────── */
function PhotosTab({ content, slotsRev, onDeleteSlot }) {
  // Every image-slot id known to the site: gallery items + the two specials.
  const ids = useMemo(() => {
    const list = [];
    list.push({ id: 'mother-portrait', placeholder: 'Foto de Mari' });
    (((content || {}).gallery || {}).items || []).forEach((it) => {
      if (it && it.id) list.push({ id: it.id, placeholder: it.placeholder || '' });
    });
    list.push({ id: 'recipe-photo', placeholder: 'Foto de la receta' });
    return list;
  }, [content]);

  return (
    <div className="card">
      <h3 className="card-title">Todas las fotos</h3>
      <p className="section-help" style={{ marginTop: 0, marginBottom: 12 }}>
        Cada marco corresponde a un id en el sitio. Arrastra una imagen para reemplazar,
        doble-click para reencuadrar, o pulsa "Borrar" para quitarla del servidor.
      </p>
      <div className="photo-grid">
        {ids.map((it) => (
          <PhotoCard
            key={it.id}
            slotId={it.id}
            placeholder={it.placeholder}
            slotsRev={slotsRev}
            onDelete={() => onDeleteSlot(it.id)}
          />
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────── Toast manager ─────────────────────────────── */
function useToasts() {
  const [items, setItems] = useState([]);
  const idRef = useRef(0);
  const push = useCallback((msg, kind) => {
    const id = ++idRef.current;
    setItems((cur) => [...cur, { id, msg, kind }]);
    setTimeout(() => setItems((cur) => cur.filter((t) => t.id !== id)), 3000);
  }, []);
  const node = h('div', { className: 'toast-stack' },
    items.map((t) => h('div', { key: t.id, className: 'toast' + (t.kind === 'error' ? ' error' : '') }, t.msg))
  );
  return { push, node };
}

/* ─────────────────────────── Login screen ──────────────────────────────── */
function LoginScreen({ onSuccess }) {
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!pw) return;
    setBusy(true); setErr('');
    const ok = await apiVerify(pw);
    setBusy(false);
    if (ok) {
      localStorage.setItem(PW_KEY, pw);
      onSuccess(pw);
    } else {
      setErr('Contraseña incorrecta. Vuelve a intentar.');
    }
  };

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="login-mark">Para Mari · admin</div>
        <h1 className="login-title">Bienvenido, Joel.</h1>
        <p className="login-sub">Introduce la contraseña de admin (la que pusiste en Vercel como ADMIN_PASSWORD).</p>
        <form className="login-form" onSubmit={submit}>
          <label htmlFor="pw">Contraseña</label>
          <input
            id="pw"
            className="input"
            type="password"
            autoFocus
            autoComplete="current-password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="••••••••"
          />
          {err && <div className="login-error">{err}</div>}
          <div style={{ height: 6 }} />
          <button className="btn btn-primary" type="submit" disabled={busy || !pw}>
            {busy ? <><span className="spinner"></span> Verificando…</> : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ─────────────────────────── Dashboard shell ───────────────────────────── */
function Dashboard({ onLogout }) {
  const [active, setActive] = useState('hero');
  const [content, setContent] = useState(null);   // server-known truth (merged w/ defaults)
  const [draft, setDraft] = useState(null);       // working copy
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autosave, setAutosave] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [slotsRev, setSlotsRev] = useState(0);    // bumps when /api/slots data changes

  const { push: toast, node: toasts } = useToasts();

  /* Wire image-slots to /api/upload/delete via the omelette shim. */
  useEffect(() => {
    installOmelette((msg, isErr) => toast(msg, isErr ? 'error' : null));
    // When the slot manifest finishes hydrating, re-mount slot cards.
    const onSync = () => setSlotsRev((r) => r + 1);
    window.addEventListener('mari:slots-synced', onSync);
    slotsHydrated && slotsHydrated.then(() => setSlotsRev((r) => r + 1));
    return () => window.removeEventListener('mari:slots-synced', onSync);
  }, [toast]);

  /* Initial content fetch: defaults ⊕ saved JSON from /api/content. */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const defaults = window.SiteDefaults || {};
      let saved = null;
      try {
        const r = await fetch('/api/content', { cache: 'no-cache' });
        if (r.ok) saved = await r.json();
      } catch {}
      if (cancelled) return;
      const merged = mergeDefaults(defaults, saved || {});
      setContent(merged);
      setDraft(clone(merged));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  /* Per-section dirty check: deep equality between draft slice and content slice. */
  const dirtySection = useMemo(() => {
    if (!content || !draft) return false;
    if (active === PHOTOS_TAB_KEY || active === 'photos') return false;
    return JSON.stringify(content[active]) !== JSON.stringify(draft[active]);
  }, [content, draft, active]);

  /* Set/replace one section's slice. */
  const setSection = (key, slice) => {
    setDraft((cur) => ({ ...(cur || {}), [key]: slice }));
  };
  const patchSection = (key, patch) => {
    setDraft((cur) => ({ ...(cur || {}), [key]: { ...(cur || {})[key], ...patch } }));
  };

  /* Save the FULL merged JSON. The API stores it as a single document. */
  const save = useCallback(async (silent) => {
    if (!draft) return;
    setSaving(true);
    try {
      const r = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': getPw() },
        body: JSON.stringify(draft)
      });
      if (r.status === 401) {
        localStorage.removeItem(PW_KEY);
        toast('Contraseña inválida. Vuelve a entrar.', 'error');
        setSaving(false);
        onLogout();
        return;
      }
      if (!r.ok) {
        const txt = await r.text().catch(() => '');
        toast('Error guardando: ' + (txt || r.status), 'error');
        setSaving(false);
        return;
      }
      setContent(clone(draft));
      if (!silent) toast('Guardado ✓');
    } catch (e) {
      toast('Error de red guardando.', 'error');
    } finally {
      setSaving(false);
    }
  }, [draft, onLogout, toast]);

  /* Auto-save: debounce 1.5s after the last edit when the toggle is on. */
  const autosaveTimer = useRef(null);
  useEffect(() => {
    if (!autosave || !dirtySection) return;
    clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => save(true), 1500);
    return () => clearTimeout(autosaveTimer.current);
  }, [draft, autosave, dirtySection, save]);

  /* Reset the active section back to defaults. */
  const resetSection = () => {
    if (!confirm('¿Restaurar el texto original de esta sección? Se perderán los cambios guardados.')) return;
    const def = clone((window.SiteDefaults || {})[active] || {});
    setSection(active, def);
  };

  /* Delete a slot from the photos tab. */
  const deleteSlot = async (id) => {
    if (!confirm('¿Borrar esta foto del servidor? Esta acción no se puede deshacer.')) return;
    try {
      await apiDelete(id);
      const cur = (await kvGet('image-slots')) || {};
      delete cur[id];
      await kvSet('image-slots', cur);
      lastSlots = JSON.parse(JSON.stringify(cur));
      setSlotsRev((r) => r + 1);
      toast('Foto borrada');
    } catch {
      toast('No se pudo borrar.', 'error');
    }
  };

  if (loading || !draft) {
    return <div className="loading-shell"><span className="spinner dark"></span><span style={{ marginLeft: 10 }}>Cargando…</span></div>;
  }

  /* Sidebar — same on desktop and mobile (drawer collapses on narrow widths). */
  const sidebar = (
    <aside className={'sidebar' + (drawerOpen ? ' open' : '')} onClick={(e) => {
      if (e.target.closest('button')) setDrawerOpen(false);
    }}>
      <div className="sidebar-section-label">Contenido</div>
      {SECTION_LIST.map((s) => (
        <button
          key={s.key}
          className={'sidebar-link' + (active === s.key ? ' active' : '')}
          onClick={() => setActive(s.key)}
        >
          <span className="num">{s.num}</span>
          <span>{s.label}</span>
        </button>
      ))}
      <div className="sidebar-section-label">Medios</div>
      <button
        className={'sidebar-link' + (active === PHOTOS_TAB_KEY ? ' active' : '')}
        onClick={() => setActive(PHOTOS_TAB_KEY)}
      >
        <span className="num">★</span>
        <span>Fotos · todas</span>
      </button>
    </aside>
  );

  /* Render current section. */
  let body;
  if (active === PHOTOS_TAB_KEY) {
    body = (
      <>
        <div className="section-head">
          <div>
            <div className="section-eyebrow">Medios</div>
            <h2 className="section-title">Todas las fotos</h2>
            <p className="section-help">Vista única de cada marco. Reemplaza, reencuadra o borra.</p>
          </div>
        </div>
        <PhotosTab content={draft} slotsRev={slotsRev} onDeleteSlot={deleteSlot} />
      </>
    );
  } else {
    const cfg = SECTIONS[active];
    if (!cfg) {
      body = <div className="card">Sección desconocida.</div>;
    } else {
      const Comp = cfg.render;
      const slice = draft[active] || {};
      body = (
        <>
          <div className="section-head">
            <div>
              <div className="section-eyebrow">{SECTION_LIST.find((s) => s.key === active)?.num} · sección</div>
              <h2 className="section-title">{cfg.title}</h2>
              <p className="section-help">{cfg.help}</p>
            </div>
            <div className="section-actions">
              <button className="btn btn-ghost" onClick={resetSection}>Restaurar texto original</button>
            </div>
          </div>
          <Comp
            data={slice}
            set={(patch) => patchSection(active, patch)}
            slotsRev={slotsRev}
          />
        </>
      );
    }
  }

  return (
    <>
      <div className="app">
        <header className="topbar">
          <button className="menu-btn" onClick={() => setDrawerOpen((v) => !v)} aria-label="Menú">
            <span></span>
          </button>
          <div className="topbar-brand">
            <svg className="heart" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7.5-4.7-9.5-9.2C1.2 9 2.7 5 6.4 5c2.3 0 3.7 1.4 4.6 2.7C12 6.4 13.4 5 15.7 5c3.7 0 5.2 4 3.8 6.8C19.5 16.3 12 21 12 21z"/></svg>
            <span>Para Mari · admin</span>
          </div>
          <div className="topbar-spacer"></div>
          <div className="topbar-actions">
            <label className="autosave-toggle">
              <input type="checkbox" checked={autosave} onChange={(e) => setAutosave(e.target.checked)} />
              Auto-guardar
            </label>
            <a className="btn btn-ghost" href="/" target="_blank" rel="noopener">Ver sitio</a>
            <button className="btn" onClick={() => {
              if (!confirm('¿Cerrar sesión?')) return;
              localStorage.removeItem(PW_KEY);
              onLogout();
            }}>Salir</button>
          </div>
        </header>

        {drawerOpen && <div className="sidebar-backdrop" onClick={() => setDrawerOpen(false)} />}
        {sidebar}

        <main className="main">
          {body}
        </main>
      </div>

      {/* Sticky save bar — only shows when the current section is dirty. */}
      <div className={'savebar' + (dirtySection ? ' visible' : '')}>
        <div className="savebar-msg">
          <span className="dot"></span>
          Cambios sin guardar en {(SECTIONS[active] || {}).title || 'esta sección'}.
        </div>
        <div className="savebar-actions">
          <button className="btn btn-ghost" onClick={() => setDraft((cur) => ({ ...cur, [active]: clone(content[active]) }))} disabled={saving}>
            Descartar
          </button>
          <button className="btn btn-primary" onClick={() => save(false)} disabled={saving}>
            {saving ? <><span className="spinner"></span> Guardando…</> : 'Guardar cambios'}
          </button>
        </div>
      </div>

      {toasts}
    </>
  );
}

/* ─────────────────────────── Root app ──────────────────────────────────── */
function App() {
  const [authed, setAuthed] = useState(!!localStorage.getItem(PW_KEY));
  // Re-verify the cached password on first load so a stale value doesn't
  // silently break later saves.
  useEffect(() => {
    if (!authed) return;
    (async () => {
      const ok = await apiVerify(getPw());
      if (!ok) {
        localStorage.removeItem(PW_KEY);
        setAuthed(false);
      }
    })();
  }, []);
  if (!authed) return <LoginScreen onSuccess={() => setAuthed(true)} />;
  return <Dashboard onLogout={() => setAuthed(false)} />;
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
