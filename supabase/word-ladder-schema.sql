-- Word Ladder puzzle storage
-- Run this in your Supabase SQL editor to set up the table

create table if not exists word_ladder_puzzles (
  id uuid default gen_random_uuid() primary key,
  puzzle_date date unique not null,
  start_word varchar(4) not null,
  end_word varchar(4) not null,
  solution jsonb not null,
  created_at timestamptz default now()
);

-- Index for fast daily lookup
create index if not exists idx_word_ladder_puzzles_date on word_ladder_puzzles (puzzle_date);

-- Enable RLS
alter table word_ladder_puzzles enable row level security;

-- Allow public read access once date arrives
create policy "Word ladders are publicly readable"
  on word_ladder_puzzles for select
  using (puzzle_date <= current_date);
