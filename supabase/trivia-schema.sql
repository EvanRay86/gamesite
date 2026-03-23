-- Trivia puzzles table
-- Run this in your Supabase SQL editor

create table if not exists trivia_puzzles (
  id uuid default gen_random_uuid() primary key,
  puzzle_date date unique not null,
  questions jsonb not null,
  created_at timestamptz default now()
);

create index if not exists idx_trivia_puzzles_date on trivia_puzzles (puzzle_date);

alter table trivia_puzzles enable row level security;

create policy "Trivia puzzles are publicly readable"
  on trivia_puzzles for select
  using (puzzle_date <= current_date);
