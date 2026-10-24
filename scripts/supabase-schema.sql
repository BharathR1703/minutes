-- Minutes schema on Supabase (Postgres): per-user rows with RLS everywhere.
-- Run with: psql "$(PGURL)" -f scripts/supabase-schema.sql

-- every per-user artifact: upcoming bookings ("event") and minutes ("meeting")
create table if not exists public.minutes_rows (
  user_id    uuid        not null,
  id         text        not null,
  kind       text        not null check (kind in ('event', 'meeting', 'armed')),
  payload    jsonb       not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

-- recordings the user gave Minutes (audio kept in storage, metadata here)
create table if not exists public.minutes_recordings (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid        not null,
  meeting_id   text,
  file_name    text,
  file_size    integer,
  mime         text,
  storage_path text,
  created_at   timestamptz not null default now()
);

create index if not exists minutes_rows_user_recent
  on public.minutes_rows (user_id, updated_at desc);

alter table public.minutes_rows enable row level security;
alter table public.minutes_recordings enable row level security;

drop policy if exists "own minutes rows" on public.minutes_rows;
create policy "own minutes rows" on public.minutes_rows
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "own recordings" on public.minutes_recordings;
create policy "own recordings" on public.minutes_recordings
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- attachments storage: private bucket, folder-per-user
insert into storage.buckets (id, name, public)
values ('minutes-audio', 'minutes-audio', false)
on conflict (id) do nothing;

drop policy if exists "minutes audio own" on storage.objects;
create policy "minutes audio own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'minutes-audio' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "minutes audio read" on storage.objects;
create policy "minutes audio read" on storage.objects
  for select to authenticated
  using (bucket_id = 'minutes-audio' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "minutes audio delete" on storage.objects;
create policy "minutes audio delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'minutes-audio' and (storage.foldername(name))[1] = auth.uid()::text);