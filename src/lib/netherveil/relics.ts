// Relic definitions for Netherveil

import type { RelicDef, RelicRarity } from "@/types/netherveil";
import { pick } from "./seed";

// ── Relic Database ──────────────────────────────────────────────────────────

export const RELIC_DEFS: Record<string, RelicDef> = {
  // ── Starting Relics (one per class) ────────────────────────────────────
  void_crystal: {
    id: "void_crystal",
    name: "Void Crystal",
    emoji: "💜",
    desc: "Start each combat with 1 Void Charge.",
    rarity: "common",
    trigger: "on_combat_start",
  },
  ember_heart: {
    id: "ember_heart",
    name: "Ember Heart",
    emoji: "❤️‍🔥",
    desc: "Start each combat with 1 Ember Stack.",
    rarity: "common",
    trigger: "on_combat_start",
  },
  woven_ward: {
    id: "woven_ward",
    name: "Woven Ward",
    emoji: "🛡️",
    desc: "Start each combat with 5 Shield.",
    rarity: "common",
    trigger: "on_combat_start",
  },
  shadow_cloak: {
    id: "shadow_cloak",
    name: "Shadow Cloak",
    emoji: "🖤",
    desc: "Start each combat with Stealth for 1 turn.",
    rarity: "common",
    trigger: "on_combat_start",
  },

  // ── Common Relics ─────────────────────────────────────────────────────
  iron_ring: {
    id: "iron_ring",
    name: "Iron Ring",
    emoji: "💍",
    desc: "Gain 3 Shield at the start of each combat.",
    rarity: "common",
    trigger: "on_combat_start",
  },
  blood_vial: {
    id: "blood_vial",
    name: "Blood Vial",
    emoji: "🧪",
    desc: "Heal 3 HP at the end of each combat.",
    rarity: "common",
    trigger: "on_combat_end",
  },
  rusty_coin: {
    id: "rusty_coin",
    name: "Rusty Coin",
    emoji: "🪙",
    desc: "Gain 10 bonus gold after each combat.",
    rarity: "common",
    trigger: "on_combat_end",
  },
  quick_draw: {
    id: "quick_draw",
    name: "Quick Draw",
    emoji: "🃏",
    desc: "Draw 1 extra card on your first turn.",
    rarity: "common",
    trigger: "on_combat_start",
  },
  sturdy_boots: {
    id: "sturdy_boots",
    name: "Sturdy Boots",
    emoji: "👢",
    desc: "+5 Max HP.",
    rarity: "common",
    trigger: "passive",
  },

  // ── Uncommon Relics ───────────────────────────────────────────────────
  berserker_mask: {
    id: "berserker_mask",
    name: "Berserker Mask",
    emoji: "🎭",
    desc: "Deal 25% more damage when below 50% HP.",
    rarity: "uncommon",
    trigger: "passive",
  },
  mana_prism: {
    id: "mana_prism",
    name: "Mana Prism",
    emoji: "🔷",
    desc: "Start each combat with 1 extra Energy.",
    rarity: "uncommon",
    trigger: "on_combat_start",
  },
  vampiric_blade: {
    id: "vampiric_blade",
    name: "Vampiric Blade",
    emoji: "🩸",
    desc: "Heal 1 HP each time you kill an enemy.",
    rarity: "uncommon",
    trigger: "on_kill",
  },
  spell_echo: {
    id: "spell_echo",
    name: "Spell Echo",
    emoji: "📢",
    desc: "The first card you play each turn costs 1 less Energy.",
    rarity: "uncommon",
    trigger: "on_card_play",
  },
  thorned_armor: {
    id: "thorned_armor",
    name: "Thorned Armor",
    emoji: "🌵",
    desc: "Gain 1 Thorns at the start of each combat.",
    rarity: "uncommon",
    trigger: "on_combat_start",
  },
  phoenix_feather: {
    id: "phoenix_feather",
    name: "Phoenix Feather",
    emoji: "🪶",
    desc: "Revive with 25% HP once per run (consumed).",
    rarity: "uncommon",
    trigger: "on_damage_taken",
  },

  // ── Rare Relics ───────────────────────────────────────────────────────
  void_crown: {
    id: "void_crown",
    name: "Void Crown",
    emoji: "👑",
    desc: "Start each combat with 2 extra Energy. Max Energy +1.",
    rarity: "rare",
    trigger: "on_combat_start",
  },
  eternity_hourglass: {
    id: "eternity_hourglass",
    name: "Eternity Hourglass",
    emoji: "⏳",
    desc: "Draw 2 extra cards each turn.",
    rarity: "rare",
    trigger: "on_turn_start",
  },
  soul_lantern: {
    id: "soul_lantern",
    name: "Soul Lantern",
    emoji: "🏮",
    desc: "All healing is doubled.",
    rarity: "rare",
    trigger: "on_heal",
  },

  // ── Boss Relics ───────────────────────────────────────────────────────
  hollows_heart: {
    id: "hollows_heart",
    name: "Hollow's Heart",
    emoji: "🖤",
    desc: "+1 Energy per turn. -10 Max HP.",
    rarity: "boss",
    trigger: "passive",
  },
  tidecallers_pearl: {
    id: "tidecallers_pearl",
    name: "Tidecaller's Pearl",
    emoji: "🫧",
    desc: "At the start of each turn, apply 1 Freeze to a random enemy.",
    rarity: "boss",
    trigger: "on_turn_start",
  },
  veilmothers_eye: {
    id: "veilmothers_eye",
    name: "Veilmother's Eye",
    emoji: "👁️",
    desc: "Cards cost 1 less. Take 1 extra damage from all sources.",
    rarity: "boss",
    trigger: "passive",
  },
};

// ── Helpers ─────────────────────────────────────────────────────────────────

export function getRelicDef(id: string): RelicDef {
  const def = RELIC_DEFS[id];
  if (!def) throw new Error(`Unknown relic: ${id}`);
  return def;
}

/** Get a random relic of a given rarity that the player doesn't already have. */
export function getRandomRelic(
  rarity: RelicRarity,
  ownedRelics: string[],
  rng: () => number,
): RelicDef | null {
  const pool = Object.values(RELIC_DEFS).filter(
    (r) => r.rarity === rarity && !ownedRelics.includes(r.id),
  );
  if (pool.length === 0) return null;
  return pick(pool, rng);
}

/** Get reward relics (for after combat). */
export function getRewardRelic(
  ownedRelics: string[],
  isElite: boolean,
  rng: () => number,
): RelicDef | null {
  if (isElite) {
    // Elites drop uncommon or rare
    return (
      getRandomRelic("rare", ownedRelics, rng) ||
      getRandomRelic("uncommon", ownedRelics, rng)
    );
  }
  // Regular combat: small chance of relic
  if (rng() < 0.15) {
    return (
      getRandomRelic("common", ownedRelics, rng) ||
      getRandomRelic("uncommon", ownedRelics, rng)
    );
  }
  return null;
}

/** Get the boss relic for a given act. */
export function getBossRelic(act: string): RelicDef {
  switch (act) {
    case "wastes":
      return RELIC_DEFS.hollows_heart;
    case "depths":
      return RELIC_DEFS.tidecallers_pearl;
    case "core":
      return RELIC_DEFS.veilmothers_eye;
    default:
      return RELIC_DEFS.hollows_heart;
  }
}

/** Get shop relics. */
export function getShopRelics(
  ownedRelics: string[],
  rng: () => number,
): { relic: RelicDef; price: number }[] {
  const result: { relic: RelicDef; price: number }[] = [];
  const prices: Record<RelicRarity, number> = {
    common: 50,
    uncommon: 80,
    rare: 150,
    boss: 200,
  };

  for (const rarity of ["common", "uncommon", "rare"] as RelicRarity[]) {
    const relic = getRandomRelic(rarity, [...ownedRelics, ...result.map((r) => r.relic.id)], rng);
    if (relic) {
      result.push({ relic, price: prices[rarity] });
    }
  }

  return result;
}
