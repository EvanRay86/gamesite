-- ============================================================================
-- Koala Saves Schema
-- Cloud save storage for Koala Clicker game
-- ============================================================================

create table if not exists koala_saves (
  id uuid default gen_random_uuid() primary key,
  player_id text unique not null,
  save_data jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Index for player lookups
create index if not exists idx_koala_saves_player on koala_saves(player_id);

-- RLS policies
alter table koala_saves enable row level security;

-- Anyone can read their own save (matched by player_id passed in request)
create policy "Anyone can read saves by player_id"
  on koala_saves for select
  using (true);

-- Anyone can upsert their own save (anonymous game, no auth required)
create policy "Anyone can upsert saves"
  on koala_saves for insert
  with check (true);

create policy "Anyone can update saves"
  on koala_saves for update
  using (true);

-- Prevent deletion of saves
-- No delete policy = no one can delete saves via the API
