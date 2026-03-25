-- Anagram Scramble seed data — 10 days starting 2026-03-25
-- Run in Supabase SQL editor after creating the table (anagram-schema.sql)

INSERT INTO anagram_puzzles (puzzle_date, words) VALUES
('2026-03-25', '[
  {"word": "PLANET", "scrambled": "LENTAP", "hint": "Space"},
  {"word": "BRIDGE", "scrambled": "DGEBIR", "hint": "Structure"},
  {"word": "CASTLE", "scrambled": "CLATSE", "hint": "Medieval"},
  {"word": "FROZEN", "scrambled": "NORFEZ", "hint": "Temperature"},
  {"word": "GUITAR", "scrambled": "TIRGUA", "hint": "Music"}
]'::jsonb),
('2026-03-26', '[
  {"word": "ROCKET", "scrambled": "COKRET", "hint": "Space"},
  {"word": "JUNGLE", "scrambled": "LUNGJE", "hint": "Nature"},
  {"word": "MUSEUM", "scrambled": "USEMMU", "hint": "Culture"},
  {"word": "SILVER", "scrambled": "LIVERS", "hint": "Metal"},
  {"word": "GARDEN", "scrambled": "DANGER", "hint": "Outdoors"}
]'::jsonb),
('2026-03-27', '[
  {"word": "TROPHY", "scrambled": "PYTHRO", "hint": "Award"},
  {"word": "ANCHOR", "scrambled": "RANCHO", "hint": "Nautical"},
  {"word": "SPIRIT", "scrambled": "TRIPSI", "hint": "Energy"},
  {"word": "CANDLE", "scrambled": "LANCED", "hint": "Light"},
  {"word": "PIRATE", "scrambled": "TAPIRE", "hint": "Adventure"}
]'::jsonb),
('2026-03-28', '[
  {"word": "WIZARD", "scrambled": "ZIDRAW", "hint": "Fantasy"},
  {"word": "TEMPLE", "scrambled": "METPLE", "hint": "Architecture"},
  {"word": "DRAGON", "scrambled": "GRANDO", "hint": "Mythology"},
  {"word": "BREEZE", "scrambled": "ZEBREE", "hint": "Weather"},
  {"word": "VELVET", "scrambled": "LEVVET", "hint": "Fabric"}
]'::jsonb),
('2026-03-29', '[
  {"word": "OYSTER", "scrambled": "STOREY", "hint": "Seafood"},
  {"word": "HAMMER", "scrambled": "MAMHER", "hint": "Tool"},
  {"word": "PUZZLE", "scrambled": "ZULPEZ", "hint": "Game"},
  {"word": "TUNDRA", "scrambled": "UNTRAD", "hint": "Biome"},
  {"word": "SPHINX", "scrambled": "PHINXS", "hint": "Ancient"}
]'::jsonb),
('2026-03-30', '[
  {"word": "PARROT", "scrambled": "RAPTOR", "hint": "Bird"},
  {"word": "MARBLE", "scrambled": "BLAMER", "hint": "Material"},
  {"word": "SUMMIT", "scrambled": "TIMMSU", "hint": "Mountain"},
  {"word": "COBALT", "scrambled": "ALTBOC", "hint": "Color"},
  {"word": "QUARTZ", "scrambled": "TZARQU", "hint": "Mineral"}
]'::jsonb),
('2026-03-31', '[
  {"word": "FALCON", "scrambled": "CLONFA", "hint": "Bird"},
  {"word": "BASKET", "scrambled": "STEABK", "hint": "Container"},
  {"word": "RHYTHM", "scrambled": "THYMRH", "hint": "Music"},
  {"word": "CACTUS", "scrambled": "TCACSU", "hint": "Plant"},
  {"word": "OXYGEN", "scrambled": "GONEXY", "hint": "Element"}
]'::jsonb),
('2026-04-01', '[
  {"word": "KERNEL", "scrambled": "LENREK", "hint": "Computing"},
  {"word": "COYOTE", "scrambled": "TOYCOE", "hint": "Animal"},
  {"word": "MAGNET", "scrambled": "TANGME", "hint": "Physics"},
  {"word": "WALNUT", "scrambled": "NUTLAW", "hint": "Food"},
  {"word": "METEOR", "scrambled": "REMOTE", "hint": "Space"}
]'::jsonb),
('2026-04-02', '[
  {"word": "SAFARI", "scrambled": "FARSAI", "hint": "Travel"},
  {"word": "CIPHER", "scrambled": "PHRICE", "hint": "Code"},
  {"word": "GOBLIN", "scrambled": "BONGIL", "hint": "Fantasy"},
  {"word": "PENCIL", "scrambled": "CLIPEN", "hint": "Writing"},
  {"word": "STEREO", "scrambled": "REESTO", "hint": "Audio"}
]'::jsonb),
('2026-04-03', '[
  {"word": "IGUANA", "scrambled": "GUANAI", "hint": "Reptile"},
  {"word": "ZENITH", "scrambled": "THINZE", "hint": "Astronomy"},
  {"word": "TURBAN", "scrambled": "BURNTA", "hint": "Clothing"},
  {"word": "MANGO", "scrambled": "GOMAN", "hint": "Fruit"},
  {"word": "BEACON", "scrambled": "CANOBE", "hint": "Navigation"}
]'::jsonb);
