-- RIFT — Conquer the Map Through Brain Power
-- Database schema for Supabase PostgreSQL

-- ── Seasons ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS rift_seasons (
  id SERIAL PRIMARY KEY,
  season_number INT NOT NULL UNIQUE,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  winner_faction TEXT CHECK (winner_faction IN ('crimson', 'verdant', 'azure')),
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Only one active season at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_rift_seasons_active
  ON rift_seasons (is_active) WHERE is_active = true;

-- ── Players ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS rift_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  faction TEXT NOT NULL CHECK (faction IN ('crimson', 'verdant', 'azure')),
  elo INT NOT NULL DEFAULT 1000,
  season_id INT NOT NULL REFERENCES rift_seasons(id) ON DELETE CASCADE,
  attack_tokens INT NOT NULL DEFAULT 5,
  tokens_refreshed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  wins INT NOT NULL DEFAULT 0,
  losses INT NOT NULL DEFAULT 0,
  hexes_captured INT NOT NULL DEFAULT 0,
  hexes_defended INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, season_id)
);

CREATE INDEX IF NOT EXISTS idx_rift_players_season ON rift_players(season_id);
CREATE INDEX IF NOT EXISTS idx_rift_players_faction ON rift_players(season_id, faction);
CREATE INDEX IF NOT EXISTS idx_rift_players_elo ON rift_players(season_id, elo DESC);

-- ── Hex Map ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS rift_hexes (
  id SERIAL PRIMARY KEY,
  season_id INT NOT NULL REFERENCES rift_seasons(id) ON DELETE CASCADE,
  q INT NOT NULL,
  r INT NOT NULL,
  hex_type TEXT NOT NULL DEFAULT 'plains'
    CHECK (hex_type IN ('plains', 'fortress', 'capital', 'ruins')),
  faction TEXT CHECK (faction IN ('crimson', 'verdant', 'azure')),
  captured_at TIMESTAMPTZ,
  captured_by UUID REFERENCES rift_players(id),
  UNIQUE(season_id, q, r)
);

CREATE INDEX IF NOT EXISTS idx_rift_hexes_season ON rift_hexes(season_id);
CREATE INDEX IF NOT EXISTS idx_rift_hexes_faction ON rift_hexes(season_id, faction);

-- ── Duels ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS rift_duels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id INT NOT NULL REFERENCES rift_seasons(id) ON DELETE CASCADE,
  hex_id INT NOT NULL REFERENCES rift_hexes(id),
  attacker_id UUID NOT NULL REFERENCES rift_players(id),
  defender_id UUID REFERENCES rift_players(id),
  puzzle_type TEXT NOT NULL
    CHECK (puzzle_type IN (
      'word_blitz', 'number_crunch', 'quick_fire',
      'chain_link', 'letter_lock', 'rank_it'
    )),
  puzzle_data JSONB NOT NULL DEFAULT '{}',
  attacker_score REAL,
  defender_score REAL,
  winner_id UUID REFERENCES rift_players(id),
  attacker_elo_change INT,
  defender_elo_change INT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'completed', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_rift_duels_season ON rift_duels(season_id);
CREATE INDEX IF NOT EXISTS idx_rift_duels_status ON rift_duels(status) WHERE status IN ('pending', 'active');
CREATE INDEX IF NOT EXISTS idx_rift_duels_attacker ON rift_duels(attacker_id);
CREATE INDEX IF NOT EXISTS idx_rift_duels_defender ON rift_duels(defender_id);

-- ── Activity Feed ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS rift_events (
  id SERIAL PRIMARY KEY,
  season_id INT NOT NULL REFERENCES rift_seasons(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL
    CHECK (event_type IN ('capture', 'defend', 'season_start', 'season_end')),
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rift_events_season ON rift_events(season_id, created_at DESC);

-- ── Row-Level Security ───────────────────────────────────────────────────────

ALTER TABLE rift_seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE rift_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE rift_hexes ENABLE ROW LEVEL SECURITY;
ALTER TABLE rift_duels ENABLE ROW LEVEL SECURITY;
ALTER TABLE rift_events ENABLE ROW LEVEL SECURITY;

-- Everyone can read seasons, hexes, events
CREATE POLICY rift_seasons_read ON rift_seasons FOR SELECT USING (true);
CREATE POLICY rift_hexes_read ON rift_hexes FOR SELECT USING (true);
CREATE POLICY rift_events_read ON rift_events FOR SELECT USING (true);

-- Players can read all players (for leaderboard) but only update their own
CREATE POLICY rift_players_read ON rift_players FOR SELECT USING (true);
CREATE POLICY rift_players_insert ON rift_players FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY rift_players_update ON rift_players FOR UPDATE
  USING (auth.uid() = user_id);

-- Duels: everyone can read, participants can update
CREATE POLICY rift_duels_read ON rift_duels FOR SELECT USING (true);
CREATE POLICY rift_duels_insert ON rift_duels FOR INSERT
  WITH CHECK (auth.uid() = (SELECT user_id FROM rift_players WHERE id = attacker_id));

-- ── Token refresh function ───────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION rift_refresh_tokens(p_player_id UUID, p_max_tokens INT DEFAULT 5)
RETURNS INT AS $$
DECLARE
  current_tokens INT;
  last_refresh TIMESTAMPTZ;
  today_start TIMESTAMPTZ;
BEGIN
  SELECT attack_tokens, tokens_refreshed_at
  INTO current_tokens, last_refresh
  FROM rift_players WHERE id = p_player_id;

  today_start := date_trunc('day', NOW() AT TIME ZONE 'UTC');

  IF last_refresh < today_start THEN
    UPDATE rift_players
    SET attack_tokens = p_max_tokens,
        tokens_refreshed_at = NOW()
    WHERE id = p_player_id;
    RETURN p_max_tokens;
  END IF;

  RETURN current_tokens;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Deduct attack token ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION rift_use_attack_token(p_player_id UUID)
RETURNS INT AS $$
DECLARE
  remaining INT;
BEGIN
  UPDATE rift_players
  SET attack_tokens = attack_tokens - 1
  WHERE id = p_player_id AND attack_tokens > 0
  RETURNING attack_tokens INTO remaining;

  IF remaining IS NULL THEN
    RETURN -1; -- no tokens available
  END IF;

  RETURN remaining;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
