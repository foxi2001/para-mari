// POST /api/verify — checks the admin password without doing any work.
// Used by cms.js to let Joel test the password before uploading.
// Header: x-admin-password
import { applyCors, checkAuth } from './_supabase.js';

export default function handler(req, res) {
  applyCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).end();
  if (!checkAuth(req)) return res.status(401).json({ ok: false });
  res.status(200).json({ ok: true });
}
