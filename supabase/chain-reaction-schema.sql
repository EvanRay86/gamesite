-- Chain Reaction daily puzzle table
create table if not exists chain_reaction_puzzles (
  id uuid default gen_random_uuid() primary key,
  puzzle_date date unique not null,
  chain jsonb not null, -- JSON array of 5 strings: ["word1","word2","word3","word4","word5"]
  created_at timestamptz default now()
);

create index if not exists idx_chain_reaction_puzzles_date
  on chain_reaction_puzzles (puzzle_date);

alter table chain_reaction_puzzles enable row level security;

create policy "Chain reaction puzzles are publicly readable"
  on chain_reaction_puzzles for select
  using (puzzle_date <= current_date);
