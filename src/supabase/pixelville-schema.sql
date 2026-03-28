-- PixelVille — Community Sim Game Schema
-- Run this in Supabase SQL Editor to create all tables.

-- ---------------------------------------------------------------------------
-- Item Catalog (seed data, not user-writable)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pixelville_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('seed','crop','furniture','clothing','tool','animal','material')),
  description TEXT NOT NULL DEFAULT '',
  buy_price INT,
  sell_price INT,
  premium BOOLEAN NOT NULL DEFAULT FALSE,
  rarity TEXT NOT NULL DEFAULT 'common' CHECK (rarity IN ('common','uncommon','rare','legendary')),
  properties JSONB NOT NULL DEFAULT '{}',
  sprite_key TEXT NOT NULL DEFAULT ''
);

-- ---------------------------------------------------------------------------
-- Player Game State
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pixelville_players (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT 'Villager',
  coins BIGINT NOT NULL DEFAULT 0,
  xp BIGINT NOT NULL DEFAULT 0,
  level INT NOT NULL DEFAULT 1,
  energy INT NOT NULL DEFAULT 100,
  max_energy INT NOT NULL DEFAULT 100,
  energy_recharged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  avatar_config JSONB NOT NULL DEFAULT '{"body":0,"hair":1,"hairColor":0,"shirt":2,"pants":4,"shoes":0,"hat":0,"accessory":0}',
  current_room_id UUID,
  x INT NOT NULL DEFAULT 5,
  y INT NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE pixelville_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players can read all players" ON pixelville_players
  FOR SELECT USING (TRUE);

CREATE POLICY "Players can update own row" ON pixelville_players
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Players can insert own row" ON pixelville_players
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- Rooms
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pixelville_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users ON DELETE SET NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('town_square','market','park','arcade','farm','home')),
  width INT NOT NULL DEFAULT 20,
  height INT NOT NULL DEFAULT 15,
  background TEXT NOT NULL DEFAULT 'grass',
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  max_occupants INT NOT NULL DEFAULT 50,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE pixelville_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read public rooms" ON pixelville_rooms
  FOR SELECT USING (is_public OR auth.uid() = owner_id);

CREATE POLICY "Players can insert own rooms" ON pixelville_rooms
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Players can update own rooms" ON pixelville_rooms
  FOR UPDATE USING (auth.uid() = owner_id);

-- Add FK after rooms table exists
ALTER TABLE pixelville_players
  ADD CONSTRAINT fk_current_room
  FOREIGN KEY (current_room_id) REFERENCES pixelville_rooms(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- Room Items (placed furniture, crops, etc.)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pixelville_room_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES pixelville_rooms ON DELETE CASCADE,
  item_id TEXT NOT NULL REFERENCES pixelville_items ON DELETE CASCADE,
  x INT NOT NULL DEFAULT 0,
  y INT NOT NULL DEFAULT 0,
  rotation INT NOT NULL DEFAULT 0,
  state JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_room_items_room ON pixelville_room_items(room_id);

ALTER TABLE pixelville_room_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read room items in rooms they can see" ON pixelville_room_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pixelville_rooms r
      WHERE r.id = room_id AND (r.is_public OR r.owner_id = auth.uid())
    )
  );

CREATE POLICY "Room owners can manage their items" ON pixelville_room_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM pixelville_rooms r
      WHERE r.id = room_id AND r.owner_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Player Inventory
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pixelville_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  item_id TEXT NOT NULL REFERENCES pixelville_items ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1,
  metadata JSONB NOT NULL DEFAULT '{}',
  UNIQUE(player_id, item_id)
);

CREATE INDEX idx_inventory_player ON pixelville_inventory(player_id);

ALTER TABLE pixelville_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players can read own inventory" ON pixelville_inventory
  FOR SELECT USING (auth.uid() = player_id);

CREATE POLICY "Players can manage own inventory" ON pixelville_inventory
  FOR ALL USING (auth.uid() = player_id);

-- ---------------------------------------------------------------------------
-- Chat Messages
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pixelville_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES pixelville_rooms ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  player_name TEXT NOT NULL DEFAULT 'Villager',
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'chat' CHECK (message_type IN ('chat','emote','system','trade')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_room ON pixelville_messages(room_id, created_at DESC);

ALTER TABLE pixelville_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read messages in rooms they can see" ON pixelville_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pixelville_rooms r
      WHERE r.id = room_id AND (r.is_public OR r.owner_id = auth.uid())
    )
  );

CREATE POLICY "Players can insert messages" ON pixelville_messages
  FOR INSERT WITH CHECK (auth.uid() = player_id);

-- ---------------------------------------------------------------------------
-- Friends
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pixelville_friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','blocked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(player_id, friend_id)
);

CREATE INDEX idx_friends_player ON pixelville_friends(player_id);

ALTER TABLE pixelville_friends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players can read own friendships" ON pixelville_friends
  FOR SELECT USING (auth.uid() = player_id OR auth.uid() = friend_id);

CREATE POLICY "Players can manage own friendships" ON pixelville_friends
  FOR ALL USING (auth.uid() = player_id);

-- ---------------------------------------------------------------------------
-- Daily Quests
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pixelville_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  quest_date DATE NOT NULL DEFAULT CURRENT_DATE,
  quest_type TEXT NOT NULL,
  progress INT NOT NULL DEFAULT 0,
  target INT NOT NULL DEFAULT 1,
  reward_coins INT NOT NULL DEFAULT 0,
  reward_xp INT NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE(player_id, quest_date, quest_type)
);

ALTER TABLE pixelville_quests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players can read own quests" ON pixelville_quests
  FOR SELECT USING (auth.uid() = player_id);

CREATE POLICY "Players can manage own quests" ON pixelville_quests
  FOR ALL USING (auth.uid() = player_id);
