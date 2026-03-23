-- Seed puzzles: assigns one puzzle per day starting from 2026-03-18
-- Run this in your Supabase SQL editor after running schema.sql

INSERT INTO puzzles (puzzle_date, groups) VALUES
(
  '2026-03-18',
  '[
    {"category":"Things that drip","color":"#FF6B6B","words":["FAUCET","CANDLE","ICICLE","PAINT"],"difficulty":0},
    {"category":"_____ shot","color":"#4ECDC4","words":["MOON","LONG","SLAP","BIG"],"difficulty":1},
    {"category":"Silent letters","color":"#45B7D1","words":["KNIGHT","PSALM","GNAW","WRAP"],"difficulty":2},
    {"category":"Famous Alberts","color":"#F7B731","words":["EINSTEIN","BROOKS","CAMUS","PUJOLS"],"difficulty":3}
  ]'
),
(
  '2026-03-19',
  '[
    {"category":"Found in a wallet","color":"#FF6B6B","words":["CASH","LICENSE","RECEIPT","PHOTO"],"difficulty":0},
    {"category":"Breakfast ______","color":"#4ECDC4","words":["BURRITO","CLUB","TABLE","NOOK"],"difficulty":1},
    {"category":"Types of wave","color":"#45B7D1","words":["SOUND","HEAT","RADIO","TIDAL"],"difficulty":2},
    {"category":"Taylor Swift albums","color":"#F7B731","words":["FOLKLORE","LOVER","REPUTATION","MIDNIGHTS"],"difficulty":3}
  ]'
),
(
  '2026-03-20',
  '[
    {"category":"Things with keys","color":"#FF6B6B","words":["PIANO","KEYBOARD","MAP","LOCK"],"difficulty":0},
    {"category":"Types of roll","color":"#4ECDC4","words":["DRUM","BARREL","EGG","ROCK"],"difficulty":1},
    {"category":"_____ park","color":"#45B7D1","words":["THEME","BALL","NATIONAL","SKATE"],"difficulty":2},
    {"category":"Words before house","color":"#F7B731","words":["WARE","POWER","GREEN","FIRE"],"difficulty":3}
  ]'
),
(
  '2026-03-21',
  '[
    {"category":"Red things","color":"#FF6B6B","words":["LOBSTER","CARDINAL","MARS","RUBY"],"difficulty":0},
    {"category":"Parts of a river","color":"#4ECDC4","words":["MOUTH","BANK","BED","DELTA"],"difficulty":1},
    {"category":"_______ board","color":"#45B7D1","words":["CHALK","SKATE","DART","SURF"],"difficulty":2},
    {"category":"Poker terms","color":"#F7B731","words":["FLUSH","RIVER","BLIND","FLOP"],"difficulty":3}
  ]'
),
(
  '2026-03-22',
  '[
    {"category":"Round things","color":"#FF6B6B","words":["GLOBE","PIZZA","CLOCK","TIRE"],"difficulty":0},
    {"category":"Double letters","color":"#4ECDC4","words":["LLAMA","AARDVARK","MOOSE","BEET"],"difficulty":1},
    {"category":"_____ dog","color":"#45B7D1","words":["HOT","CORN","PRAIRIE","TOP"],"difficulty":2},
    {"category":"Oscar-winning directors","color":"#F7B731","words":["COPPOLA","SPIELBERG","ZHAO","BONG"],"difficulty":3}
  ]'
)
ON CONFLICT (puzzle_date) DO NOTHING;
