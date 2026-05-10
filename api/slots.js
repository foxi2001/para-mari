// GET /api/slots — public read of the slot manifest.
// Returns { [id]: { u, s, x, y } } in the same shape image-slot.js expects.
import { supabase, envMissing, applyCors } from './_supabase.js';

export default async function handler(req, res) {
  applyCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'method not allowed' });
  if (envMissing()) return res.status(503).json({ error: 'supabase not configured' });

  try {
    const { data, error } = await supabase.from('slots').select('id, url, crop');
    if (error) throw error;
    const out = {};
    for (const r of data || []) {
      const c = r.crop || {};
      out[r.id] = { u: r.url, s: c.s ?? 1, x: c.x ?? 0, y: c.y ?? 0 };
    }
    // Short edge cache so a redeploy or photo update propagates quickly,
    // but a flood of visits doesn't hammer Postgres.
    res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=60');
    res.status(200).json(out);
  } catch (e) {
    res.status(500).json({ error: e.message || String(e) });
  }
}
