// POST /api/delete — admin removes a slot's photo.
// Body: { id }
// Header: x-admin-password
import { supabase, envMissing, applyCors, checkAuth } from './_supabase.js';

const BUCKET = 'photos';

export default async function handler(req, res) {
  applyCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).end();
  if (envMissing()) return res.status(503).json({ error: 'supabase not configured' });
  if (!checkAuth(req)) return res.status(401).json({ error: 'unauthorized' });

  try {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: 'missing id' });

    const { data: prev } = await supabase
      .from('slots').select('url').eq('id', id).maybeSingle();
    if (prev && prev.url) {
      const path = extractPath(prev.url);
      if (path) await supabase.storage.from(BUCKET).remove([path]);
    }
    await supabase.from('slots').delete().eq('id', id);

    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message || String(e) });
  }
}

function extractPath(url) {
  if (!url) return null;
  const i = url.indexOf(`/${BUCKET}/`);
  return i >= 0 ? url.slice(i + BUCKET.length + 2) : null;
}
