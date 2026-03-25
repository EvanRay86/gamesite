-- Anagram Scramble puzzle storage
-- Run this in your Supabase SQL editor to set up the table

create table if not exists anagram_puzzles (
  id uuid default gen_random_uuid() primary key,
  puzzle_date date unique not null,
  words jsonb not null,
  created_at timestamptz default now()
);

-- Index for fast daily lookup
create index if not exists idx_anagram_puzzles_date on anagram_puzzles (puzzle_date);

-- Enable RLS
alter table anagram_puzzles enable row level security;

-- Allow public read access once date arrives
create policy "Anagram puzzles are publicly readable"
  on anagram_puzzles for select
  using (puzzle_date <= current_date);
