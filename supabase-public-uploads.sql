-- Run once in Supabase SQL Editor to enable the admin "Allow public uploads" toggle

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default 'false'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;

drop policy if exists "Public can read settings" on public.app_settings;
drop policy if exists "Public can upsert settings" on public.app_settings;

create policy "Public can read settings"
  on public.app_settings for select
  to anon, authenticated
  using (true);

-- Writes are still gated in the website by admin password
create policy "Public can upsert settings"
  on public.app_settings for insert
  to anon, authenticated
  with check (true);

create policy "Public can update settings"
  on public.app_settings for update
  to anon, authenticated
  using (true)
  with check (true);

insert into public.app_settings (key, value)
values ('public_uploads', 'false'::jsonb)
on conflict (key) do nothing;
