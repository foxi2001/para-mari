// POST /api/recrop — admin updates only the crop (s/x/y) without re-uploading.
// Used when the user double-clicks an existing photo and adjusts the framing.
// Body: { id, crop: { s, x, y } }
// Header: x-admin-password
import { supabase, envMissing, applyCors, checkAuth } from './_supabase.js';

export default async function handler(req, res) {
  applyCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).end();
  if (envMissing()) return res.status(503).json({ error: 'supabase not configured' });
  if (!checkAuth(req)) return res.status(401).json({ error: 'unauthorized' });

  try {
    const { id, crop } = req.body || {};
    if (!id || !crop) return res.status(400).json({ error: 'missing id or crop' });
    const safe = {
      s: clamp(num(crop.s, 1), 0.1, 10),
      x: num(crop.x, 0),
      y: num(crop.y, 0),
    };
    const { error } = await supabase.from('slots').update({ crop: safe }).eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message || String(e) });
  }
}

function num(v, d) { const n = Number(v); return Number.isFinite(n) ? n : d; }
function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
