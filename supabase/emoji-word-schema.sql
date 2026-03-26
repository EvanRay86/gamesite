-- Emoji Decoder puzzles
create table if not exists emoji_word_puzzles (
  id          uuid default gen_random_uuid() primary key,
  puzzle_date date not null unique,
  rounds      jsonb not null,          -- array of { emojis, answer, hint?, difficulty }
  created_at  timestamptz default now()
);

-- Index for date lookups
create index if not exists idx_emoji_word_puzzles_date
  on emoji_word_puzzles (puzzle_date);

-- Row-level security
alter table emoji_word_puzzles enable row level security;

-- Public read access
create policy "emoji_word_puzzles_public_read"
  on emoji_word_puzzles for select
  using (true);
