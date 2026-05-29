-- Outrank — "Which Is More?" async-duel game storage
-- Run this in your Supabase SQL editor to set up the tables.

-- ── Comparison item bank ────────────────────────────────────────────────────
-- Each item belongs to a category whose metric/prompt/unit live in code
-- (src/lib/outrank-categories.ts). `value` is always stored in that category's
-- canonical unit so comparisons are a pure numeric `>`.
create table if not exists outrank_items (
  id uuid default gen_random_uuid() primary key,
  category text not null,
  label text not null,
  value double precision not null,
  emoji text,
  image_url text,
  source text,
  blurb text,
  active boolean not null default true,
  created_at timestamptz default now()
);

create index if not exists idx_outrank_items_category
  on outrank_items (category) where active = true;

alter table outrank_items enable row level security;

create policy "Outrank items are publicly readable"
  on outrank_items for select
  using (active = true);

-- ── Stored async challenges (the shareable viral artifact) ───────────────────
-- `seed` is the 32-bit value the challenger actually played, stored so a friend
-- replays the byte-identical sequence. bigint because seeds are unsigned 32-bit.
create table if not exists outrank_challenges (
  id text primary key,
  seed bigint not null,
  challenger_name text not null,
  challenger_score integer not null,
  category_set text not null default 'mixed',
  pool_version integer not null default 1,
  created_at timestamptz default now(),
  ip_hash text
);

create index if not exists idx_outrank_challenges_created
  on outrank_challenges (created_at desc);

alter table outrank_challenges enable row level security;

create policy "Outrank challenges are publicly readable"
  on outrank_challenges for select
  using (true);
-- No insert/update/delete policy → writes happen only through the
-- service-role API route (src/app/api/outrank/challenge/route.ts).

-- ── Friend rematch attempts (optional analytics / "N friends tried") ─────────
create table if not exists outrank_attempts (
  id uuid default gen_random_uuid() primary key,
  challenge_id text not null references outrank_challenges(id) on delete cascade,
  player_name text not null,
  score integer not null,
  beat boolean not null,
  created_at timestamptz default now(),
  ip_hash text
);

create index if not exists idx_outrank_attempts_challenge
  on outrank_attempts (challenge_id, score desc);

alter table outrank_attempts enable row level security;

create policy "Outrank attempts are publicly readable"
  on outrank_attempts for select
  using (true);
