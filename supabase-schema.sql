-- ============================================================================
-- Para Mari · Supabase schema
--
-- Run this once in your Supabase project:
--   1. Open https://supabase.com/dashboard -> your project -> "SQL Editor"
--   2. Paste the whole file, click "Run"
--   3. Then create the storage bucket "photos" (see end of file)
-- ============================================================================

-- Slot manifest: one row per image-slot id on the site
create table if not exists public.slots (
  id          text primary key,
  url         text not null,
  crop        jsonb default '{"s":1,"x":0,"y":0}'::jsonb,
  updated_at  timestamptz default now()
);

-- Site copy: a singleton row that holds the entire editable content blob.
-- One row, id = 1, containing JSON for hero/letter/quotes/etc.
create table if not exists public.site_content (
  id          smallint primary key default 1,
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz default now(),
  constraint singleton check (id = 1)
);
-- Public read; writes only via the service-role key (used by /api/content POST).
alter table public.site_content enable row level security;
drop policy if exists "site_content public read" on public.site_content;
create policy "site_content public read"
  on public.site_content for select
  to anon, authenticated
  using (true);
-- Seed the singleton so GET always returns a row.
insert into public.site_content (id, data) values (1, '{}'::jsonb)
  on conflict (id) do nothing;

-- Public read; writes only via the service-role key (used by /api/* on Vercel).
alter table public.slots enable row level security;

drop policy if exists "slots public read" on public.slots;
create policy "slots public read"
  on public.slots for select
  to anon, authenticated
  using (true);

-- Helper trigger to keep updated_at fresh on UPDATE
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_slots_touch on public.slots;
create trigger trg_slots_touch
  before update on public.slots
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_site_content_touch on public.site_content;
create trigger trg_site_content_touch
  before update on public.site_content
  for each row execute function public.touch_updated_at();

-- ============================================================================
-- STORAGE BUCKET — create from the Dashboard UI (faster than SQL):
--
--   1. Storage -> "New bucket" -> name: photos
--   2. Toggle "Public bucket" ON  (Mari needs to read images directly)
--   3. Save.
--
-- Writes happen from /api/upload using the SERVICE ROLE key, so no extra
-- policies are needed — service role bypasses RLS / storage policies.
-- ============================================================================
