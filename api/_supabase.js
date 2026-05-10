// Shared Supabase client for /api/* routes.
// Uses the SERVICE ROLE key — never ship this to the browser.
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabase = url && key
  ? createClient(url, key, { auth: { persistSession: false } })
  : null;

export function envMissing() {
  return !supabase;
}

// CORS allowance: same-origin only by default. If you need to call from
// another origin, set ALLOWED_ORIGIN in Vercel env vars.
export function applyCors(req, res) {
  const allowed = process.env.ALLOWED_ORIGIN || '';
  if (allowed) {
    res.setHeader('Access-Control-Allow-Origin', allowed);
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-password');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  }
}

export function checkAuth(req) {
  const want = process.env.ADMIN_PASSWORD;
  if (!want) return false;
  const got = req.headers['x-admin-password'];
  return got === want;
}
