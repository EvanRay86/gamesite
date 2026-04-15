// Relic and potion definitions for Wordslay

import type { RelicDef, PotionDef, RelicRarity } from "@/types/wordslay";

// ── Relics ──────────────────────────────────────────────────────────────────

export const RELIC_DEFS: RelicDef[] = [
  // Common
  {
    id: "scholars-quill",
    name: "Scholar's Quill",
    emoji: "🪶",
    desc: "+3 damage for words of 5+ letters.",
    rarity: "common",
    trigger: "on_word",
  },
  {
    id: "lucky-penny",
    name: "Lucky Penny",
    emoji: "🪙",
    desc: "+5 gold after each combat.",
    rarity: "common",
    trigger: "on_combat_end",
  },
  {
    id: "iron-ring",
    name: "Iron Ring",
    emoji: "💍",
    desc: "+8 max HP.",
    rarity: "common",
    trigger: "passive",
  },
  {
    id: "vowel-stone",
    name: "Vowel Stone",
    emoji: "🔮",
    desc: "Start each combat with an extra vowel tile.",
    rarity: "common",
    trigger: "on_combat_start",
  },
  {
    id: "sturdy-boots",
    name: "Sturdy Boots",
    emoji: "🥾",
    desc: "Heal 3 HP after each combat.",
    rarity: "common",
    trigger: "on_combat_end",
  },
  {
    id: "thick-skin",
    name: "Thick Skin",
    emoji: "🛡️",
    desc: "Reduce all damage taken by 1.",
    rarity: "common",
    trigger: "on_damage_taken",
  },

  // Uncommon
  {
    id: "thesaurus",
    name: "Thesaurus",
    emoji: "📖",
    desc: "+4 damage if your word starts with the same letter as your last word.",
    rarity: "uncommon",
    trigger: "on_word",
  },
  {
    id: "golden-feather",
    name: "Golden Feather",
    emoji: "✨",
    desc: "Golden tiles are worth 3x instead of 2x.",
    rarity: "uncommon",
    trigger: "passive",
  },
  {
    id: "healing-herb",
    name: "Healing Herb",
    emoji: "🌿",
    desc: "Heal 2 HP for each word of 6+ letters.",
    rarity: "uncommon",
    trigger: "on_word",
  },
  {
    id: "chaos-rune",
    name: "Chaos Rune",
    emoji: "🎲",
    desc: "Wildcard tiles appear 8% more often.",
    rarity: "uncommon",
    trigger: "passive",
  },
  {
    id: "s-blade",
    name: "S-Blade",
    emoji: "⚔️",
    desc: "+5 damage for words starting with S.",
    rarity: "uncommon",
    trigger: "on_word",
  },
  {
    id: "crystal-ball",
    name: "Crystal Ball",
    emoji: "🔮",
    desc: "See enemy intents 2 turns ahead.",
    rarity: "uncommon",
    trigger: "passive",
  },
  {
    id: "war-drum",
    name: "War Drum",
    emoji: "🥁",
    desc: "+10% attack multiplier.",
    rarity: "uncommon",
    trigger: "passive",
  },

  // Rare
  {
    id: "philosophers-stone",
    name: "Philosopher's Stone",
    emoji: "💎",
    desc: "Q, Z, X, J tiles deal triple damage.",
    rarity: "rare",
    trigger: "on_word",
  },
  {
    id: "word-of-power",
    name: "Word of Power",
    emoji: "📜",
    desc: "+10 damage for words of 8+ letters.",
    rarity: "rare",
    trigger: "on_word",
  },
  {
    id: "phoenix-feather",
    name: "Phoenix Feather",
    emoji: "🔥",
    desc: "Revive once with 50% HP upon death.",
    rarity: "rare",
    trigger: "on_damage_taken",
  },
  {
    id: "vampiric-tome",
    name: "Vampiric Tome",
    emoji: "🧛",
    desc: "Heal 1 HP for every word played.",
    rarity: "rare",
    trigger: "on_word",
  },
  {
    id: "dragon-scale",
    name: "Dragon Scale",
    emoji: "🐲",
    desc: "+3 permanent defense.",
    rarity: "rare",
    trigger: "passive",
  },
  {
    id: "lexicon-crown",
    name: "Lexicon Crown",
    emoji: "👑",
    desc: "All tiles are golden on the first turn of each combat.",
    rarity: "rare",
    trigger: "on_combat_start",
  },
  {
    id: "infinite-ink",
    name: "Infinite Ink",
    emoji: "🖋️",
    desc: "+1 extra tile in your rack.",
    rarity: "rare",
    trigger: "passive",
  },
];

// ── Potions ─────────────────────────────────────────────────────────────────

export const POTION_DEFS: PotionDef[] = [
  {
    id: "health-potion",
    name: "Health Potion",
    emoji: "❤️",
    desc: "Heal 20 HP.",
  },
  {
    id: "power-potion",
    name: "Power Potion",
    emoji: "💪",
    desc: "Next word deals 2x damage.",
  },
  {
    id: "clarity-potion",
    name: "Clarity Potion",
    emoji: "💧",
    desc: "Refresh all tiles with a new set.",
  },
  {
    id: "shield-potion",
    name: "Shield Potion",
    emoji: "🛡️",
    desc: "Gain 15 shield for this combat.",
  },
  {
    id: "golden-ink",
    name: "Golden Ink",
    emoji: "🌟",
    desc: "Turn 3 random tiles golden.",
  },
  {
    id: "wildcard-elixir",
    name: "Wildcard Elixir",
    emoji: "🃏",
    desc: "Add 2 wildcard tiles to your rack.",
  },
  {
    id: "haste-potion",
    name: "Haste Potion",
    emoji: "⚡",
    desc: "Submit 2 words this turn without enemy retaliation.",
  },
  {
    id: "antidote",
    name: "Antidote",
    emoji: "🧪",
    desc: "Remove all cursed and frozen tiles.",
  },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

export function getRelicDef(id: string): RelicDef | undefined {
  return RELIC_DEFS.find((r) => r.id === id);
}

export function getPotionDef(id: string): PotionDef | undefined {
  return POTION_DEFS.find((p) => p.id === id);
}

export function getRelicsByRarity(rarity: RelicRarity): RelicDef[] {
  return RELIC_DEFS.filter((r) => r.rarity === rarity);
}

export function getRewardRelics(
  rng: () => number,
  ownedRelicIds: string[],
  count: number,
  isElite: boolean,
): RelicDef[] {
  const pool = RELIC_DEFS.filter((r) => !ownedRelicIds.includes(r.id));
  if (pool.length === 0) return [];

  // Weight by rarity — elites have better drops
  const weighted: RelicDef[] = [];
  for (const relic of pool) {
    let copies = 1;
    if (relic.rarity === "common") copies = isElite ? 1 : 3;
    if (relic.rarity === "uncommon") copies = isElite ? 3 : 2;
    if (relic.rarity === "rare") copies = isElite ? 3 : 1;
    for (let i = 0; i < copies; i++) weighted.push(relic);
  }

  const picks: RelicDef[] = [];
  const used = new Set<string>();
  for (let i = 0; i < count && weighted.length > 0; i++) {
    let attempts = 0;
    while (attempts < 100) {
      const idx = Math.floor(rng() * weighted.length);
      const pick = weighted[idx];
      if (!used.has(pick.id)) {
        picks.push(pick);
        used.add(pick.id);
        break;
      }
      attempts++;
    }
  }

  return picks;
}

export function getShopRelics(
  rng: () => number,
  ownedRelicIds: string[],
  count: number,
): { relic: RelicDef; price: number }[] {
  const available = RELIC_DEFS.filter((r) => !ownedRelicIds.includes(r.id));
  const picks: { relic: RelicDef; price: number }[] = [];
  const used = new Set<string>();

  for (let i = 0; i < count && available.length > 0; i++) {
    const idx = Math.floor(rng() * available.length);
    const relic = available[idx];
    if (used.has(relic.id)) continue;
    used.add(relic.id);

    const price =
      relic.rarity === "common" ? 30 + Math.floor(rng() * 20) :
      relic.rarity === "uncommon" ? 60 + Math.floor(rng() * 30) :
      100 + Math.floor(rng() * 50);

    picks.push({ relic, price });
  }

  return picks;
}

export function getShopPotions(
  rng: () => number,
  count: number,
): { potion: PotionDef; price: number }[] {
  const picks: { potion: PotionDef; price: number }[] = [];
  const used = new Set<string>();

  for (let i = 0; i < count; i++) {
    const idx = Math.floor(rng() * POTION_DEFS.length);
    const potion = POTION_DEFS[idx];
    if (used.has(potion.id)) continue;
    used.add(potion.id);
    picks.push({ potion, price: 15 + Math.floor(rng() * 15) });
  }

  return picks;
}
