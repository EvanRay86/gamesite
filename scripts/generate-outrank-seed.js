// generate-outrank-seed.js — Emits supabase/outrank-seed.sql for the Outrank game.
// Run: node scripts/generate-outrank-seed.js   (or: npm run generate:outrank)
//
// Each item is { label, value, emoji, blurb, source }. `value` is in the
// category's canonical unit (see src/lib/outrank-categories.ts) so comparisons
// are a pure numeric `>`.
//
// IDs are DETERMINISTIC (md5 of "outrank:<category>:<label>"). This keeps the
// engine's sort-by-id pool order stable across reseeds, which protects already
// minted challenge links, and lets the INSERT be safely idempotent via
// `on conflict (id) do nothing`.

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

/** Deterministic UUID-shaped id from a stable key. */
function deterministicId(category, label) {
  const hex = crypto
    .createHash("md5")
    .update(`outrank:${category}:${label}`)
    .digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

// ── Category data ────────────────────────────────────────────────────────────
// Keep values reasonably accurate and, above all, distinct within a category
// (the engine rejects exact ties, but near-ties just feel unfair).

const POPULATION = {
  source: "UN urban agglomeration estimate (2023)",
  items: [
    ["Tokyo", 37000000, "🇯🇵"],
    ["Delhi", 33000000, "🇮🇳"],
    ["Shanghai", 29200000, "🇨🇳"],
    ["Dhaka", 23200000, "🇧🇩"],
    ["São Paulo", 22800000, "🇧🇷"],
    ["Mexico City", 22500000, "🇲🇽"],
    ["Cairo", 22000000, "🇪🇬"],
    ["Beijing", 21800000, "🇨🇳"],
    ["Mumbai", 21300000, "🇮🇳"],
    ["Osaka", 19000000, "🇯🇵"],
    ["New York City", 18800000, "🇺🇸"],
    ["Karachi", 17200000, "🇵🇰"],
    ["Istanbul", 15800000, "🇹🇷"],
    ["Lagos", 15400000, "🇳🇬"],
    ["Buenos Aires", 15200000, "🇦🇷"],
    ["Kolkata", 15300000, "🇮🇳"],
    ["Manila", 14900000, "🇵🇭"],
    ["Rio de Janeiro", 13800000, "🇧🇷"],
    ["Moscow", 12700000, "🇷🇺"],
    ["Los Angeles", 12500000, "🇺🇸"],
    ["Paris", 11200000, "🇫🇷"],
    ["Jakarta", 11000000, "🇮🇩"],
    ["Bangkok", 10900000, "🇹🇭"],
    ["London", 9500000, "🇬🇧"],
    ["Chicago", 8900000, "🇺🇸"],
    ["Bogotá", 11300000, "🇨🇴"],
    ["Lima", 11100000, "🇵🇪"],
    ["Tehran", 9600000, "🇮🇷"],
    ["Hong Kong", 7600000, "🇭🇰"],
    ["Bangalore", 13600000, "🇮🇳"],
    ["Madrid", 6700000, "🇪🇸"],
    ["Toronto", 6400000, "🇨🇦"],
    ["Singapore", 6000000, "🇸🇬"],
    ["Berlin", 3600000, "🇩🇪"],
    ["Sydney", 5300000, "🇦🇺"],
    ["Johannesburg", 6200000, "🇿🇦"],
    ["Nairobi", 5400000, "🇰🇪"],
    ["Rome", 4300000, "🇮🇹"],
    ["Dubai", 3700000, "🇦🇪"],
    ["Amsterdam", 1200000, "🇳🇱"],
  ],
};

const BOX_OFFICE = {
  source: "Lifetime gross per Box Office Mojo",
  items: [
    ["Avatar", 2923000000, "💙"],
    ["Avengers: Endgame", 2799000000, "🦸"],
    ["Avatar: The Way of Water", 2320000000, "💧"],
    ["Titanic", 2257000000, "🚢"],
    ["Star Wars: The Force Awakens", 2071000000, "⚔️"],
    ["Avengers: Infinity War", 2048000000, "🧤"],
    ["Spider-Man: No Way Home", 1922000000, "🕷️"],
    ["Inside Out 2", 1698000000, "🧠"],
    ["Jurassic World", 1671000000, "🦖"],
    ["The Lion King", 1663000000, "🦁"],
    ["The Avengers", 1519000000, "🦸"],
    ["Furious 7", 1515000000, "🏎️"],
    ["Top Gun: Maverick", 1496000000, "✈️"],
    ["Frozen II", 1453000000, "❄️"],
    ["Barbie", 1446000000, "🎀"],
    ["Avengers: Age of Ultron", 1403000000, "🤖"],
    ["The Super Mario Bros. Movie", 1362000000, "🍄"],
    ["Black Panther", 1349000000, "🐆"],
    ["Harry Potter and the Deathly Hallows – Part 2", 1342000000, "⚡"],
    ["Deadpool & Wolverine", 1338000000, "🗡️"],
    ["Star Wars: The Last Jedi", 1332000000, "⚔️"],
    ["Jurassic World: Fallen Kingdom", 1310000000, "🦕"],
    ["Frozen", 1290000000, "⛄"],
    ["Beauty and the Beast", 1266000000, "🌹"],
    ["Incredibles 2", 1242000000, "💥"],
    ["The Fate of the Furious", 1238000000, "🚗"],
    ["Iron Man 3", 1215000000, "🦾"],
    ["Minions", 1159000000, "🍌"],
    ["Captain America: Civil War", 1153000000, "🛡️"],
    ["Aquaman", 1148000000, "🔱"],
    ["The Lord of the Rings: The Return of the King", 1146000000, "💍"],
    ["Transformers: Dark of the Moon", 1124000000, "🤖"],
    ["Skyfall", 1109000000, "🕴️"],
    ["Toy Story 4", 1073000000, "🤠"],
    ["Toy Story 3", 1067000000, "🧸"],
    ["Pirates of the Caribbean: Dead Man's Chest", 1066000000, "🏴‍☠️"],
    ["Finding Dory", 1029000000, "🐠"],
    ["Star Wars: The Rise of Skywalker", 1077000000, "🌌"],
    ["Despicable Me 3", 1034000000, "🦹"],
    ["The Dark Knight Rises", 1081000000, "🦇"],
  ],
};

const ELEVATION = {
  source: "Summit elevation above sea level",
  items: [
    ["Mount Everest", 8849, "🏔️"],
    ["K2", 8611, "🏔️"],
    ["Kangchenjunga", 8586, "🏔️"],
    ["Lhotse", 8516, "🏔️"],
    ["Makalu", 8485, "🏔️"],
    ["Cho Oyu", 8188, "🏔️"],
    ["Dhaulagiri", 8167, "🏔️"],
    ["Manaslu", 8163, "🏔️"],
    ["Nanga Parbat", 8126, "🏔️"],
    ["Annapurna", 8091, "🏔️"],
    ["Aconcagua", 6961, "🏔️"],
    ["Denali", 6190, "🏔️"],
    ["Kilimanjaro", 5895, "🌋"],
    ["Mount Elbrus", 5642, "🌋"],
    ["Pico de Orizaba", 5636, "🌋"],
    ["Mount Kenya", 5199, "🏔️"],
    ["Vinson Massif", 4892, "🏔️"],
    ["Mont Blanc", 4809, "🏔️"],
    ["Mount Whitney", 4421, "🏔️"],
    ["Mount Rainier", 4392, "🌋"],
    ["Pikes Peak", 4302, "🏔️"],
    ["Mauna Kea", 4207, "🌋"],
    ["Matterhorn", 4478, "🏔️"],
    ["Mount Fuji", 3776, "🌋"],
    ["Aoraki / Mount Cook", 3724, "🏔️"],
    ["Mount Etna", 3357, "🌋"],
    ["Mount Olympus", 2917, "🏔️"],
    ["Half Dome", 2694, "🪨"],
    ["Mount St. Helens", 2549, "🌋"],
    ["Mount Kosciuszko", 2228, "🏔️"],
    ["Mount Washington", 1917, "🏔️"],
    ["Ben Nevis", 1345, "🏴󠁧󠁢󠁳󠁣󠁴󠁿"],
    ["Mount Vesuvius", 1281, "🌋"],
    ["Table Mountain", 1086, "🏔️"],
    ["Snowdon", 1085, "🏔️"],
  ],
};

const CALORIES = {
  source: "Per standard serving (manufacturer figures)",
  items: [
    ["Cinnabon Classic Roll", 880, "🥮"],
    ["Wendy's Baconator", 950, "🍔"],
    ["Five Guys Hamburger", 700, "🍔"],
    ["In-N-Out Double-Double", 670, "🍔"],
    ["Burger King Whopper", 657, "🍔"],
    ["Big Mac", 563, "🍔"],
    ["McDonald's Quarter Pounder w/ Cheese", 520, "🍔"],
    ["McFlurry with Oreo", 510, "🍦"],
    ["Chick-fil-A Chicken Sandwich", 440, "🐔"],
    ["McChicken", 400, "🐔"],
    ["Starbucks Caramel Frappuccino (Grande)", 380, "🥤"],
    ["McDonald's Medium Fries", 320, "🍟"],
    ["Egg McMuffin", 310, "🥚"],
    ["Dunkin' Boston Kreme Donut", 300, "🍩"],
    ["Subway 6-inch Turkey", 280, "🥪"],
    ["Snickers Bar", 250, "🍫"],
    ["Plain Bagel", 245, "🥯"],
    ["Reese's Peanut Butter Cups (2-pack)", 210, "🥜"],
    ["KitKat (4-finger)", 218, "🍫"],
    ["Pop-Tart (single)", 200, "🧁"],
    ["Slice of Cheese Pizza", 285, "🍕"],
    ["Starbucks Grande Latte", 150, "☕"],
    ["Krispy Kreme Original Glazed", 190, "🍩"],
    ["Taco Bell Crunchy Taco", 170, "🌮"],
    ["Gatorade (20 oz)", 130, "🥤"],
    ["Coca-Cola (12 oz can)", 140, "🥤"],
    ["Olive Garden Breadstick", 155, "🥖"],
    ["Orange Juice (8 oz)", 110, "🍊"],
    ["Banana (medium)", 105, "🍌"],
    ["Apple (medium)", 95, "🍎"],
    ["M&M's (fun size)", 73, "🍬"],
    ["Oreo (single cookie)", 53, "🍪"],
    ["Panera Mac & Cheese (large)", 1080, "🧀"],
    ["Chipotle Chicken Burrito", 1000, "🌯"],
  ],
};

const NET_WORTH = {
  source: "Forbes estimate (2024 snapshot)",
  items: [
    ["Elon Musk", 221000000000, "🚀"],
    ["Bernard Arnault", 211000000000, "👜"],
    ["Jeff Bezos", 195000000000, "📦"],
    ["Mark Zuckerberg", 177000000000, "👍"],
    ["Larry Ellison", 141000000000, "💾"],
    ["Warren Buffett", 133000000000, "👓"],
    ["Bill Gates", 128000000000, "🪟"],
    ["Steve Ballmer", 121000000000, "🏀"],
    ["Mukesh Ambani", 116000000000, "🛢️"],
    ["Larry Page", 114000000000, "🔍"],
    ["Sergey Brin", 110000000000, "🔎"],
    ["Jim Walton", 108000000000, "🛒"],
    ["Michael Bloomberg", 106000000000, "📊"],
    ["Rob Walton", 105000000000, "🛒"],
    ["Amancio Ortega", 103000000000, "🧥"],
    ["Carlos Slim", 102000000000, "📞"],
    ["Françoise Bettencourt Meyers", 99000000000, "💄"],
    ["Michael Dell", 91000000000, "💻"],
    ["Alice Walton", 89000000000, "🛒"],
    ["Gautam Adani", 84000000000, "⚡"],
    ["Jensen Huang", 77000000000, "🎮"],
    ["Phil Knight", 41000000000, "👟"],
    ["Michael Jordan", 3500000000, "🏀"],
    ["Oprah Winfrey", 3000000000, "📺"],
    ["Jay-Z", 2500000000, "🎤"],
    ["Rihanna", 1400000000, "🎶"],
    ["LeBron James", 1200000000, "👑"],
    ["Taylor Swift", 1100000000, "🎸"],
  ],
};

const CATEGORIES = {
  population: POPULATION,
  box_office: BOX_OFFICE,
  elevation: ELEVATION,
  calories: CALORIES,
  net_worth: NET_WORTH,
};

// ── Emit SQL ─────────────────────────────────────────────────────────────────

function sqlStr(s) {
  if (s === null || s === undefined) return "NULL";
  return `'${String(s).replace(/'/g, "''")}'`;
}

const rows = [];
const idsSeen = new Set();
let warnings = 0;

for (const [category, group] of Object.entries(CATEGORIES)) {
  const valuesSeen = new Map();
  for (const item of group.items) {
    const [label, value, emoji, blurbOverride] = item;
    const id = deterministicId(category, label);
    if (idsSeen.has(id)) {
      console.warn(`! Duplicate id (label collision) in ${category}: ${label}`);
      warnings++;
      continue;
    }
    idsSeen.add(id);
    if (valuesSeen.has(value)) {
      console.warn(
        `! Tie in ${category}: "${label}" and "${valuesSeen.get(value)}" both = ${value}`,
      );
      warnings++;
    }
    valuesSeen.set(value, label);
    const blurb = blurbOverride ?? `${group.source}.`;
    rows.push(
      `  (${sqlStr(id)}, ${sqlStr(category)}, ${sqlStr(label)}, ${value}, ${sqlStr(emoji)}, ${sqlStr(group.source)}, ${sqlStr(blurb)})`,
    );
  }
}

const header = [
  "-- AUTO-GENERATED — do not edit manually.",
  "-- Regenerate with: node scripts/generate-outrank-seed.js",
  `-- Generated: ${new Date().toISOString().slice(0, 10)}`,
  `-- ${rows.length} items across ${Object.keys(CATEGORIES).length} categories.`,
  "--",
  "-- Idempotent: deterministic ids + ON CONFLICT DO NOTHING means re-running",
  "-- this file will not create duplicates. To refresh values, bump POOL_VERSION",
  "-- in src/lib/outrank-categories.ts and update rows explicitly.",
  "",
  "insert into outrank_items (id, category, label, value, emoji, source, blurb) values",
].join("\n");

const sql = `${header}\n${rows.join(",\n")}\non conflict (id) do nothing;\n`;

const outPath = path.join(__dirname, "..", "supabase", "outrank-seed.sql");
fs.writeFileSync(outPath, sql, "utf-8");

console.log("Outrank seed written to:", outPath);
for (const [category, group] of Object.entries(CATEGORIES)) {
  console.log(`  ${category}: ${group.items.length} items`);
}
console.log(`  Total: ${rows.length} rows`);
if (warnings > 0) console.log(`  ⚠ ${warnings} warning(s) — review above.`);
