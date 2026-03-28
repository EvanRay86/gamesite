-- PixelVille — Seed Data: Item Catalog + Public Rooms
-- Run AFTER pixelville-schema.sql

-- ---------------------------------------------------------------------------
-- Seeds
-- ---------------------------------------------------------------------------
INSERT INTO pixelville_items (id, name, category, description, buy_price, sell_price, rarity, properties, sprite_key) VALUES
  ('tomato_seed',    'Tomato Seeds',    'seed', 'Grows juicy tomatoes.',         10, 2,  'common', '{"growTimeMs":60000,"cropItemId":"tomato","xpReward":5,"energyCost":2}',  'seed_tomato'),
  ('corn_seed',      'Corn Seeds',      'seed', 'Tall stalks of golden corn.',   15, 3,  'common', '{"growTimeMs":120000,"cropItemId":"corn","xpReward":8,"energyCost":2}',   'seed_corn'),
  ('pumpkin_seed',   'Pumpkin Seeds',   'seed', 'Big, round pumpkins.',          25, 5,  'uncommon','{"growTimeMs":180000,"cropItemId":"pumpkin","xpReward":12,"energyCost":3}','seed_pumpkin'),
  ('sunflower_seed', 'Sunflower Seeds', 'seed', 'Bright, cheerful sunflowers.',  20, 4,  'common', '{"growTimeMs":90000,"cropItemId":"sunflower","xpReward":7,"energyCost":2}','seed_sunflower'),
  ('strawberry_seed','Strawberry Seeds','seed', 'Sweet red strawberries.',        30, 6,  'uncommon','{"growTimeMs":150000,"cropItemId":"strawberry","xpReward":10,"energyCost":3}','seed_strawberry'),
  ('carrot_seed',    'Carrot Seeds',    'seed', 'Crunchy orange carrots.',        12, 2,  'common', '{"growTimeMs":75000,"cropItemId":"carrot","xpReward":6,"energyCost":2}',  'seed_carrot');

-- ---------------------------------------------------------------------------
-- Crops (harvested items)
-- ---------------------------------------------------------------------------
INSERT INTO pixelville_items (id, name, category, description, sell_price, rarity, sprite_key) VALUES
  ('tomato',     'Tomato',     'crop', 'A ripe red tomato.',       15, 'common',   'crop_tomato'),
  ('corn',       'Corn',       'crop', 'A golden ear of corn.',    25, 'common',   'crop_corn'),
  ('pumpkin',    'Pumpkin',    'crop', 'A hefty orange pumpkin.',   40, 'uncommon', 'crop_pumpkin'),
  ('sunflower',  'Sunflower',  'crop', 'A bright yellow sunflower.',20,'common',   'crop_sunflower'),
  ('strawberry', 'Strawberry', 'crop', 'A juicy red strawberry.',   35, 'uncommon', 'crop_strawberry'),
  ('carrot',     'Carrot',     'crop', 'A crunchy orange carrot.',  18, 'common',   'crop_carrot');

-- ---------------------------------------------------------------------------
-- Furniture
-- ---------------------------------------------------------------------------
INSERT INTO pixelville_items (id, name, category, description, buy_price, sell_price, rarity, properties, sprite_key) VALUES
  ('wooden_table',   'Wooden Table',   'furniture', 'A sturdy oak table.',         50,  10, 'common',   '{"width":2,"height":1}', 'furn_table'),
  ('wooden_chair',   'Wooden Chair',   'furniture', 'A simple wooden chair.',      30,  6,  'common',   '{"width":1,"height":1}', 'furn_chair'),
  ('cozy_rug',       'Cozy Rug',       'furniture', 'A soft, colorful rug.',       40,  8,  'common',   '{"width":2,"height":2}', 'furn_rug'),
  ('table_lamp',     'Table Lamp',     'furniture', 'A warm glowing lamp.',        35,  7,  'common',   '{"width":1,"height":1,"light":true}', 'furn_lamp'),
  ('bookshelf',      'Bookshelf',      'furniture', 'Filled with old stories.',    80,  16, 'uncommon', '{"width":2,"height":1}', 'furn_bookshelf'),
  ('flower_pot',     'Flower Pot',     'furniture', 'A decorative potted plant.',  25,  5,  'common',   '{"width":1,"height":1}', 'furn_flowerpot'),
  ('single_bed',     'Single Bed',     'furniture', 'A cozy bed for one.',        100,  20, 'common',   '{"width":2,"height":1}', 'furn_bed'),
  ('fireplace',      'Fireplace',      'furniture', 'A warm crackling fireplace.',200,  40, 'rare',     '{"width":2,"height":1,"light":true}', 'furn_fireplace'),
  ('fence',          'Wooden Fence',   'furniture', 'A short picket fence.',       15,  3,  'common',   '{"width":1,"height":1}', 'furn_fence'),
  ('mailbox',        'Mailbox',        'furniture', 'Check your mail!',            20,  4,  'common',   '{"width":1,"height":1}', 'furn_mailbox'),
  ('fountain',       'Stone Fountain', 'furniture', 'A beautiful water fountain.',500, 100, 'rare',     '{"width":2,"height":2,"animated":true}', 'furn_fountain'),
  ('garden_bench',   'Garden Bench',   'furniture', 'Sit and enjoy the view.',     60,  12, 'common',   '{"width":2,"height":1}', 'furn_bench');

-- ---------------------------------------------------------------------------
-- Clothing
-- ---------------------------------------------------------------------------
INSERT INTO pixelville_items (id, name, category, description, buy_price, rarity, sprite_key) VALUES
  ('red_shirt',     'Red Shirt',      'clothing', 'A bright red t-shirt.',        20, 'common',   'cloth_shirt_red'),
  ('blue_shirt',    'Blue Shirt',     'clothing', 'A cool blue t-shirt.',         20, 'common',   'cloth_shirt_blue'),
  ('green_shirt',   'Green Shirt',    'clothing', 'A fresh green t-shirt.',       20, 'common',   'cloth_shirt_green'),
  ('cowboy_hat',    'Cowboy Hat',     'clothing', 'Yeehaw! A classic cowboy hat.', 75, 'uncommon', 'cloth_hat_cowboy'),
  ('beanie',        'Cozy Beanie',   'clothing', 'A warm knitted beanie.',        40, 'common',   'cloth_hat_beanie'),
  ('crown',         'Golden Crown',  'clothing', 'Fit for royalty.',             500, 'legendary','cloth_hat_crown'),
  ('sunglasses',    'Sunglasses',    'clothing', 'Look cool in any weather.',     50, 'uncommon', 'cloth_acc_sunglasses'),
  ('scarf',         'Knit Scarf',    'clothing', 'A colorful knitted scarf.',     35, 'common',   'cloth_acc_scarf');

-- ---------------------------------------------------------------------------
-- Tools
-- ---------------------------------------------------------------------------
INSERT INTO pixelville_items (id, name, category, description, buy_price, rarity, properties, sprite_key) VALUES
  ('basic_hoe',    'Basic Hoe',    'tool', 'Till the soil for planting.',     0,   'common',   '{"speed":1.0}', 'tool_hoe'),
  ('watering_can', 'Watering Can', 'tool', 'Water your crops to help them grow.',50,'common', '{"speed":1.0}', 'tool_water'),
  ('bronze_hoe',   'Bronze Hoe',   'tool', 'A better hoe. 20% faster.',     200,  'uncommon', '{"speed":1.2}', 'tool_hoe_bronze'),
  ('silver_hoe',   'Silver Hoe',   'tool', 'A fine hoe. 40% faster.',       500,  'rare',     '{"speed":1.4}', 'tool_hoe_silver');

-- ---------------------------------------------------------------------------
-- Public Rooms
-- ---------------------------------------------------------------------------
INSERT INTO pixelville_rooms (id, owner_id, name, type, width, height, background, is_public, max_occupants) VALUES
  ('00000000-0000-0000-0000-000000000001', NULL, 'Town Square',  'town_square', 24, 18, 'stone',  TRUE, 50),
  ('00000000-0000-0000-0000-000000000002', NULL, 'Market',       'market',      20, 15, 'wood',   TRUE, 30),
  ('00000000-0000-0000-0000-000000000003', NULL, 'Park',         'park',        28, 20, 'grass',  TRUE, 40);

-- ---------------------------------------------------------------------------
-- Pre-placed items in public rooms
-- ---------------------------------------------------------------------------

-- Town Square decorations
INSERT INTO pixelville_room_items (room_id, item_id, x, y) VALUES
  ('00000000-0000-0000-0000-000000000001', 'fountain',     11, 8),
  ('00000000-0000-0000-0000-000000000001', 'garden_bench',  6, 10),
  ('00000000-0000-0000-0000-000000000001', 'garden_bench', 16, 10),
  ('00000000-0000-0000-0000-000000000001', 'table_lamp',    3, 3),
  ('00000000-0000-0000-0000-000000000001', 'table_lamp',   20, 3),
  ('00000000-0000-0000-0000-000000000001', 'flower_pot',    8, 5),
  ('00000000-0000-0000-0000-000000000001', 'flower_pot',   15, 5);

-- Market decorations
INSERT INTO pixelville_room_items (room_id, item_id, x, y) VALUES
  ('00000000-0000-0000-0000-000000000002', 'wooden_table',  3, 4),
  ('00000000-0000-0000-0000-000000000002', 'wooden_table',  8, 4),
  ('00000000-0000-0000-0000-000000000002', 'wooden_table', 13, 4),
  ('00000000-0000-0000-0000-000000000002', 'bookshelf',     2, 1),
  ('00000000-0000-0000-0000-000000000002', 'table_lamp',   17, 2);

-- Park decorations
INSERT INTO pixelville_room_items (room_id, item_id, x, y) VALUES
  ('00000000-0000-0000-0000-000000000003', 'garden_bench',  5, 8),
  ('00000000-0000-0000-0000-000000000003', 'garden_bench', 15, 8),
  ('00000000-0000-0000-0000-000000000003', 'garden_bench', 22, 12),
  ('00000000-0000-0000-0000-000000000003', 'flower_pot',    8, 4),
  ('00000000-0000-0000-0000-000000000003', 'flower_pot',   12, 4),
  ('00000000-0000-0000-0000-000000000003', 'flower_pot',   20, 6),
  ('00000000-0000-0000-0000-000000000003', 'fountain',     13, 14),
  ('00000000-0000-0000-0000-000000000003', 'fence',         0, 0),
  ('00000000-0000-0000-0000-000000000003', 'fence',         1, 0),
  ('00000000-0000-0000-0000-000000000003', 'fence',         2, 0);
