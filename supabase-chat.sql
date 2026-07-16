-- Run in Supabase SQL Editor (safe to re-run)
-- Adds upvotes + auto-deletes lowest-voted messages after 7 days

-- Votes column on messages
alter table public.chat_messages
  add column if not exists votes integer not null default 0;

create index if not exists chat_messages_votes_idx
  on public.chat_messages (votes);

-- One vote per browser/device per message
create table if not exists public.chat_votes (
  message_id uuid not null references public.chat_messages(id) on delete cascade,
  voter_key text not null,
  created_at timestamptz not null default now(),
  primary key (message_id, voter_key)
);

alter table public.chat_votes enable row level security;

drop policy if exists "Public can read votes" on public.chat_votes;
drop policy if exists "Public can cast votes" on public.chat_votes;

create policy "Public can read votes"
  on public.chat_votes for select
  to anon, authenticated
  using (true);

create policy "Public can cast votes"
  on public.chat_votes for insert
  to anon, authenticated
  with check (char_length(trim(voter_key)) between 8 and 80);

-- Upvote a message (blocks duplicate votes from same voter_key)
create or replace function public.upvote_chat_message(p_message_id uuid, p_voter_key text)
returns public.chat_messages
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_row public.chat_messages;
begin
  if p_voter_key is null or char_length(trim(p_voter_key)) < 8 then
    raise exception 'Invalid voter key';
  end if;

  insert into public.chat_votes (message_id, voter_key)
  values (p_message_id, trim(p_voter_key));

  update public.chat_messages
  set votes = votes + 1
  where id = p_message_id
  returning * into updated_row;

  if updated_row.id is null then
    raise exception 'Message not found';
  end if;

  return updated_row;
exception
  when unique_violation then
    raise exception 'You already upvoted this message';
end;
$$;

grant execute on function public.upvote_chat_message(uuid, text) to anon, authenticated;

-- Delete messages that are 7+ days old and have the lowest vote count
-- among those old messages (usually 0-vote messages)
create or replace function public.cleanup_low_vote_chat()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
  lowest integer;
begin
  select coalesce(min(votes), 0)
  into lowest
  from public.chat_messages
  where created_at < now() - interval '7 days';

  delete from public.chat_messages
  where created_at < now() - interval '7 days'
    and votes <= lowest;

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

grant execute on function public.cleanup_low_vote_chat() to anon, authenticated;

-- Enable realtime updates for vote counts
do $$
begin
  alter publication supabase_realtime add table public.chat_messages;
exception
  when duplicate_object then null;
end $$;
