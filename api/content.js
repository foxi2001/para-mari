// GET /api/content   — public read of the site content JSON.
// POST /api/content  — admin replaces the whole content blob (with password).
//
// Body shape: any JSON object. The dashboard sends the entire merged tree
// every save; partial saves are achieved by reading first then merging on
// the client.
import { supabase, envMissing, applyCors, checkAuth } from './_supabase.js';

export const config = { api: { bodyParser: { sizeLimit: '2mb' } } };

export default async function handler(req, res) {
  applyCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (envMissing()) return res.status(503).json({ error: 'supabase not configured' });

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('site_content')
        .select('data')
        .eq('id', 1)
        .maybeSingle();
      if (error) throw error;
      res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=60');
      res.status(200).json((data && data.data) || {});
    } catch (e) {
      res.status(500).json({ error: e.message || String(e) });
    }
    return;
  }

  if (req.method === 'POST') {
    if (!checkAuth(req)) return res.status(401).json({ error: 'unauthorized' });
    try {
      const body = req.body;
      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return res.status(400).json({ error: 'body must be a JSON object' });
      }
      const { error } = await supabase
        .from('site_content')
        .upsert({ id: 1, data: body });
      if (error) throw error;
      res.status(200).json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message || String(e) });
    }
    return;
  }

  res.status(405).json({ error: 'method not allowed' });
}
