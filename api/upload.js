// POST /api/upload — admin uploads a photo for a given slot.
// Body: { id, dataUrl, crop? }
// Header: x-admin-password: <ADMIN_PASSWORD>
//
// Decodes the data URL, replaces any prior file for that slot in Storage,
// and upserts the slots row with the new public URL.
import { supabase, envMissing, applyCors, checkAuth } from './_supabase.js';

// Default Vercel body limit is ~4.5MB; we cap to 6MB to be safe.
// image-slot.js already resizes uploads to <= 1200px WebP @ 0.85 (~150-400KB).
export const config = { api: { bodyParser: { sizeLimit: '6mb' } } };

const BUCKET = 'photos';

export default async function handler(req, res) {
  applyCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });
  if (envMissing()) return res.status(503).json({ error: 'supabase not configured' });
  if (!checkAuth(req)) return res.status(401).json({ error: 'unauthorized' });

  try {
    const { id, dataUrl, crop } = req.body || {};
    if (!id || !dataUrl) return res.status(400).json({ error: 'missing id or dataUrl' });
    if (typeof id !== 'string' || id.length > 80 || !/^[a-z0-9_\-./]+$/i.test(id)) {
      return res.status(400).json({ error: 'invalid id' });
    }

    const m = String(dataUrl).match(/^data:(image\/[a-z0-9+.\-]+);base64,(.+)$/i);
    if (!m) return res.status(400).json({ error: 'bad data url' });
    const mime = m[1];
    const ext = mime.replace('image/', '').replace('jpeg', 'jpg').split('+')[0];
    const buffer = Buffer.from(m[2], 'base64');

    // Remove the previous file (if any) so storage doesn't accumulate.
    try {
      const { data: prev } = await supabase
        .from('slots').select('url').eq('id', id).maybeSingle();
      if (prev && prev.url) {
        const path = extractPath(prev.url);
        if (path) await supabase.storage.from(BUCKET).remove([path]);
      }
    } catch {}

    const path = `${safeId(id)}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType: mime, upsert: false });
    if (upErr) return res.status(500).json({ error: 'upload failed: ' + upErr.message });

    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
    const url = pub.publicUrl;

    const { error: dbErr } = await supabase.from('slots').upsert({
      id,
      url,
      crop: crop || { s: 1, x: 0, y: 0 }
    });
    if (dbErr) return res.status(500).json({ error: 'db upsert failed: ' + dbErr.message });

    res.status(200).json({ ok: true, id, url });
  } catch (e) {
    res.status(500).json({ error: e.message || String(e) });
  }
}

// Pull the storage path from a Supabase public URL.
//   .../storage/v1/object/public/photos/<PATH>
function extractPath(url) {
  if (!url) return null;
  const i = url.indexOf(`/${BUCKET}/`);
  return i >= 0 ? url.slice(i + BUCKET.length + 2) : null;
}

function safeId(id) { return id.replace(/[^a-z0-9_\-]/gi, '_'); }
