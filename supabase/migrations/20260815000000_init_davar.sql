-- Davar web backend schema (Supabase)
-- Apply in Supabase SQL editor or via `supabase db push`

create extension if not exists "pgcrypto";

-- Playlists owned by authenticated (including anonymous) users
create table if not exists public.playlists (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text,
  items jsonb not null default '[]'::jsonb,
  translation text not null default 'KJV',
  total_duration integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  source_type text not null default 'manual',
  prompt_used text,
  tags jsonb not null default '[]'::jsonb,
  is_favorite boolean not null default false,
  is_downloaded boolean not null default false,
  last_played_at timestamptz,
  last_played_item_id text,
  last_played_position double precision,
  completed_count integer not null default 0
);

create index if not exists playlists_user_id_idx on public.playlists (user_id);
create index if not exists playlists_updated_at_idx on public.playlists (updated_at desc);

-- Analytics events (optional user association)
create table if not exists public.analytics_events (
  id bigint generated always as identity primary key,
  event_name text not null,
  properties jsonb not null default '{}'::jsonb,
  timestamp timestamptz not null default now(),
  user_id uuid references auth.users (id) on delete set null,
  session_id text,
  device_info jsonb not null default '{}'::jsonb
);

create index if not exists analytics_events_timestamp_idx on public.analytics_events (timestamp desc);
create index if not exists analytics_events_user_id_idx on public.analytics_events (user_id);
create index if not exists analytics_events_name_idx on public.analytics_events (event_name);

alter table public.playlists enable row level security;
alter table public.analytics_events enable row level security;

-- Playlists: users manage only their own rows
drop policy if exists "playlists_select_own" on public.playlists;
create policy "playlists_select_own"
  on public.playlists for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "playlists_insert_own" on public.playlists;
create policy "playlists_insert_own"
  on public.playlists for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "playlists_update_own" on public.playlists;
create policy "playlists_update_own"
  on public.playlists for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "playlists_delete_own" on public.playlists;
create policy "playlists_delete_own"
  on public.playlists for delete
  to authenticated
  using (auth.uid() = user_id);

-- Analytics: authenticated users can insert; service role reads in dashboard
drop policy if exists "analytics_insert_authenticated" on public.analytics_events;
create policy "analytics_insert_authenticated"
  on public.analytics_events for insert
  to authenticated
  with check (user_id is null or auth.uid() = user_id);

drop policy if exists "analytics_select_own" on public.analytics_events;
create policy "analytics_select_own"
  on public.analytics_events for select
  to authenticated
  using (user_id is null or auth.uid() = user_id);
