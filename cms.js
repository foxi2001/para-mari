/* ---------------------------------------------------------------------------
 * cms.js — read-only sync layer for image-slot.
 *
 * On the public site (Mari's view) all this does is:
 *   1. Intercept fetch('.image-slots.state.json') from image-slot.js.
 *   2. Serve the latest manifest from Supabase via GET /api/slots, cached in
 *      IndexedDB so reloads are instant.
 *
 * Writes (uploads, recrops, deletes) are NOT handled here — they live in the
 * admin dashboard at /admin.html which sets its own window.omelette.writeFile
 * and orchestrates uploads against /api/upload, /api/recrop, /api/delete.
 *
 * Outside the dashboard, image-slot stays read-only (data-editable only flips
 * on when window.omelette.writeFile is defined).
 * --------------------------------------------------------------------------- */
(() => {
  const STATE_FILE = '.image-slots.state.json';
  const DB_NAME = 'mari-cms';
  const STORE = 'kv';

  /* ──────────────────────  IndexedDB helpers  ────────────────────────── */
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
  async function kvDel(key) {
    try {
      const db = await openDB();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        const r = tx.objectStore(STORE).delete(key);
        r.onsuccess = () => resolve();
        r.onerror = () => reject(r.error);
      });
    } catch {}
  }

  /* ──────────────────────  Sync from Supabase  ───────────────────────── */
  const _fetch = window.fetch.bind(window);
  let modeReady = null;

  async function refreshFromApi() {
    try {
      const r = await _fetch('/api/slots', { cache: 'no-cache' });
      if (r.ok) {
        const j = await r.json();
        if (j && typeof j === 'object') {
          await kvSet('image-slots', j);
          window.dispatchEvent(new CustomEvent('mari:slots-synced', { detail: { slots: j } }));
          return j;
        }
      }
    } catch {}
    return null;
  }

  // Fire one refresh at boot. The result lands in IDB before the first
  // image-slot fetch resolves (race protected by the monkey-patch below).
  modeReady = refreshFromApi();

  /* ──────────────────────  fetch monkey-patch  ───────────────────────── */
  // Order of preference for image-slot state:
  //   1. live /api/slots (waited for at most ~1.2s)
  //   2. IndexedDB cache from a previous session
  //   3. native fetch — falls through to a baseline `.image-slots.state.json`
  //      shipped in the repo, if any.
  window.fetch = async function (input, init) {
    const url = typeof input === 'string' ? input : (input && input.url) || '';
    const isStateFile = url === STATE_FILE || url.endsWith('/' + STATE_FILE);
    if (isStateFile) {
      try { await Promise.race([modeReady, new Promise((r) => setTimeout(r, 1200))]); } catch {}

      let stored = await kvGet('image-slots');

      // First visit / cleared cache: IDB empty — try the API live.
      if (!stored || Object.keys(stored).length === 0) {
        const fresh = await refreshFromApi();
        if (fresh) stored = fresh;
      }

      if (stored && Object.keys(stored).length > 0) {
        return new Response(JSON.stringify(stored), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    return _fetch(input, init);
  };

  /* ──────────────────────  Public surface  ──────────────────────────── */
  // Used by the admin dashboard to share the same IDB cache and the same
  // refresh path, without re-implementing them.
  window.MariCMS = {
    kvGet, kvSet, kvDel,
    refresh: refreshFromApi,
  };
})();
