-- Allow admins to move documents between course / year / semester
-- Run once in Supabase SQL Editor if Move fails with a permission error

drop policy if exists "Public can update documents" on public.documents;

create policy "Public can update documents"
  on public.documents for update
  to anon, authenticated
  using (true)
  with check (true);
