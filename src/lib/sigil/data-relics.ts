// ── SIGIL: Relic & Event Definitions ────────────────────────────────────────

import type { Relic, GameEvent, CharacterClass } from "./types";
import { mulberry32 } from "./data-runes";

// ── Relics ───────────────────────────────────────────────────────────────────

export const ALL_RELICS: Relic[] = [
  // Common
  { id: "relic_ember_ring", name: "Ember Ring", emoji: "💍", description: "Burn damage +1 per stack.", rarity: "common", passive: true },
  { id: "relic_iron_skin", name: "Iron Skin", emoji: "🛡️", description: "Start each combat with 5 Block.", rarity: "common", passive: true },
  { id: "relic_lucky_coin", name: "Lucky Coin", emoji: "🪙", description: "Gain 15% more gold from combats.", rarity: "common", passive: true },
  { id: "relic_energy_crystal", name: "Energy Crystal", emoji: "💎", description: "+1 max energy.", rarity: "common", passive: true },
  { id: "relic_healing_herb", name: "Healing Herb", emoji: "🌿", description: "Heal 3 HP after each combat.", rarity: "common", passive: true },
  { id: "relic_whetstone", name: "Whetstone", emoji: "🪨", description: "Deal +1 damage with all runes.", rarity: "common", passive: true },
  { id: "relic_map_fragment", name: "Map Fragment", emoji: "🗺️", description: "See one extra node ahead on the map.", rarity: "common", passive: true },

  // Uncommon
  { id: "relic_frost_amulet", name: "Frost Amulet", emoji: "🧊", description: "Freeze effects last 1 extra turn.", rarity: "uncommon", passive: true },
  { id: "relic_venom_gland", name: "Venom Gland", emoji: "🧪", description: "Poison applied +2 per source.", rarity: "uncommon", passive: true },
  { id: "relic_conduit_rod", name: "Conduit Rod", emoji: "🔋", description: "Chain (shock) damage is 75% instead of 50%.", rarity: "uncommon", passive: true },
  { id: "relic_mirror_shard", name: "Mirror Shard", emoji: "🪞", description: "First pattern each combat triggers twice.", rarity: "uncommon", passive: true },
  { id: "relic_blood_pact", name: "Blood Pact", emoji: "🩸", description: "+10 max HP but lose 1 HP per turn.", rarity: "uncommon", passive: true },
  { id: "relic_hourglass", name: "Hourglass", emoji: "⏳", description: "Draw 1 extra rune each turn.", rarity: "uncommon", passive: true },
  { id: "relic_runic_lens", name: "Runic Lens", emoji: "🔮", description: "Patterns deal +3 bonus damage.", rarity: "uncommon", passive: true },

  // Rare
  { id: "relic_phoenix_feather", name: "Phoenix Feather", emoji: "🪶", description: "Revive once per run with 30% HP.", rarity: "rare", passive: true },
  { id: "relic_void_heart", name: "Void Heart", emoji: "🖤", description: "Enemies start combat with 3 Poison.", rarity: "rare", passive: true },
  { id: "relic_storm_crown", name: "Storm Crown", emoji: "👑", description: "Gain 1 energy when you complete a pattern.", rarity: "rare", passive: true },
  { id: "relic_runeweaver_tome", name: "Runeweaver's Tome", emoji: "📖", description: "Upgraded runes deal +3 damage.", rarity: "rare", passive: true },
  { id: "relic_grid_expander", name: "Grid Expander", emoji: "📐", description: "Persistent runes don't count as occupied for pattern detection.", rarity: "rare", passive: true },

  // Boss relics
  { id: "relic_ember_crown", name: "Ember Lord's Crown", emoji: "👑", description: "All Ignis runes deal +4 damage. -1 max energy.", rarity: "boss", passive: true },
  { id: "relic_storm_eye", name: "Eye of the Storm", emoji: "🌀", description: "All chain damage is 100%. Draw 1 fewer rune.", rarity: "boss", passive: true },
  { id: "relic_void_mask", name: "Void Sovereign's Mask", emoji: "🎭", description: "All Poison doubled. Take 1 extra damage from all sources.", rarity: "boss", passive: true },
];

export function getRelicReward(rarity: "common" | "uncommon" | "rare" | "boss", seed: number, ownedIds: string[]): Relic | null {
  const rng = mulberry32(seed);
  const pool = ALL_RELICS.filter(r => r.rarity === rarity && !ownedIds.includes(r.id));
  if (pool.length === 0) return null;
  return pool[Math.floor(rng() * pool.length)];
}

export function getShopRelics(seed: number, ownedIds: string[]): Relic[] {
  const rng = mulberry32(seed);
  const pool = ALL_RELICS.filter(r => (r.rarity === "common" || r.rarity === "uncommon") && !ownedIds.includes(r.id));
  const results: Relic[] = [];
  const used = new Set<string>();
  for (let i = 0; i < 2 && pool.length > 0; i++) {
    const idx = Math.floor(rng() * pool.length);
    if (!used.has(pool[idx].id)) {
      used.add(pool[idx].id);
      results.push(pool[idx]);
    }
    pool.splice(idx, 1);
  }
  return results;
}

// ── Starter relics per class ─────────────────────────────────────────────────

export function getStarterRelic(characterClass: CharacterClass): Relic {
  switch (characterClass) {
    case "pyromancer":
      return { id: "relic_burning_heart", name: "Burning Heart", emoji: "❤️‍🔥", description: "Burn damage +1. Start combat with 1 Burn on all enemies.", rarity: "common", passive: true };
    case "chronomancer":
      return { id: "relic_time_crystal", name: "Time Crystal", emoji: "💠", description: "Can rewind 1 rune placement per turn.", rarity: "common", passive: true };
    case "voidwalker":
      return { id: "relic_shadow_cloak", name: "Shadow Cloak", emoji: "🧥", description: "Enemies start with 3 Poison.", rarity: "common", passive: true };
    case "stormcaller":
      return { id: "relic_thunder_core", name: "Thunder Core", emoji: "⚡", description: "Chain damage hits 1 extra target.", rarity: "common", passive: true };
  }
}

// ── Events ───────────────────────────────────────────────────────────────────

export const ALL_EVENTS: GameEvent[] = [
  {
    id: "evt_shrine",
    title: "Ancient Shrine",
    emoji: "⛩️",
    description: "A weathered shrine pulses with faint energy. Runes carved into the stone seem to react to your presence.",
    choices: [
      { text: "Pray (Lose 5 HP, gain a random rare rune)", effect: "rare_rune" },
      { text: "Meditate (Heal 15 HP)", effect: "heal" },
      { text: "Leave", effect: "nothing" },
    ],
  },
  {
    id: "evt_merchant",
    title: "Wandering Merchant",
    emoji: "🧳",
    description: "A hooded figure spreads curious wares on a tattered cloth. 'I deal in power, friend. Everything has its price.'",
    choices: [
      { text: "Buy a relic (Lose 50 gold)", effect: "buy_relic" },
      { text: "Trade a rune for 30 gold", effect: "trade_rune" },
      { text: "Leave", effect: "nothing" },
    ],
  },
  {
    id: "evt_forge",
    title: "Runeforge",
    emoji: "🔨",
    description: "You discover a still-glowing runeforge. The heat is intense, but the potential for power is undeniable.",
    choices: [
      { text: "Upgrade a random rune", effect: "upgrade_rune" },
      { text: "Forge a new rune (Gain random uncommon)", effect: "gain_uncommon" },
      { text: "Smash the forge (Gain 25 gold)", effect: "gain_gold" },
    ],
  },
  {
    id: "evt_fountain",
    title: "Mystic Fountain",
    emoji: "⛲",
    description: "Crystal-clear water flows from a stone fountain. The liquid shimmers with otherworldly light.",
    choices: [
      { text: "Drink deeply (Heal to full, lose a random rune)", effect: "full_heal" },
      { text: "Fill a vial (Heal 10 HP)", effect: "heal_small" },
      { text: "Toss a coin (Lose 10 gold, gain a random relic)", effect: "coin_relic" },
    ],
  },
  {
    id: "evt_ghost",
    title: "Restless Spirit",
    emoji: "👻",
    description: "A spectral figure materializes before you, its form flickering between dimensions. It reaches out a translucent hand.",
    choices: [
      { text: "Accept its gift (Gain a random rune, lose 8 HP)", effect: "ghost_gift" },
      { text: "Challenge it (Fight a mini-boss for a relic)", effect: "ghost_fight" },
      { text: "Banish it (Gain 20 gold)", effect: "gain_gold_small" },
    ],
  },
  {
    id: "evt_library",
    title: "Runic Library",
    emoji: "📚",
    description: "Shelves of glowing tomes line the walls. Each book contains the essence of a different school of magic.",
    choices: [
      { text: "Study Ignis (Transform a random rune to Ignis)", effect: "study_ignis" },
      { text: "Study Glacius (Transform a random rune to Glacius)", effect: "study_glacius" },
      { text: "Study broadly (+1 max energy this run, lose 10 HP)", effect: "study_all" },
    ],
  },
  {
    id: "evt_gambler",
    title: "The Gambler",
    emoji: "🎲",
    description: "A grinning figure shuffles three rune cards face-down. 'Pick one, friend. Fortune favors the bold.'",
    choices: [
      { text: "Pick left", effect: "gamble" },
      { text: "Pick middle", effect: "gamble" },
      { text: "Pick right", effect: "gamble" },
    ],
  },
];

export function getRandomEvent(seed: number): GameEvent {
  const rng = mulberry32(seed);
  return ALL_EVENTS[Math.floor(rng() * ALL_EVENTS.length)];
}
