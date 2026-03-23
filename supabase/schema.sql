-- Connections puzzle storage
-- Run this in your Supabase SQL editor to set up the table

create table if not exists puzzles (
  id uuid default gen_random_uuid() primary key,
  puzzle_date date unique not null,
  groups jsonb not null,
  created_at timestamptz default now()
);

-- Index for fast daily lookup
create index if not exists idx_puzzles_date on puzzles (puzzle_date);

-- Enable RLS
alter table puzzles enable row level security;

-- Allow public read access (puzzles are not secret once the date arrives)
create policy "Puzzles are publicly readable"
  on puzzles for select
  using (puzzle_date <= current_date);

-- Example insert (run seed.sql for full data)
-- insert into puzzles (puzzle_date, groups) values (
--   '2026-03-22',
--   '[{"category":"Things that drip","color":"#f9df6d","words":["FAUCET","CANDLE","ICICLE","PAINT"],"difficulty":0}, ...]'
-- );
