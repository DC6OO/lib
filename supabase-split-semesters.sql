-- Split existing year documents evenly into Semester 1 and Semester 2.
-- Run once in Supabase SQL Editor, then click Run.
-- Leaves Books (year = 'all') unchanged.

with ranked as (
  select
    id,
    year,
    row_number() over (
      partition by library, year
      order by created_at, id
    ) as rn,
    count(*) over (partition by library, year) as total
  from public.documents
  where year in ('1', '2', '3', '4')
)
update public.documents d
set year = case
  when r.rn <= ceil(r.total::numeric / 2) then r.year || '-s1'
  else r.year || '-s2'
end
from ranked r
where d.id = r.id;

-- Allow future metadata updates from the app if needed
drop policy if exists "Public can update documents" on public.documents;
create policy "Public can update documents"
  on public.documents for update
  to anon, authenticated
  using (true)
  with check (true);
