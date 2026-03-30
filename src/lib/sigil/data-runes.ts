// ── SIGIL: Rune Card Definitions ────────────────────────────────────────────

import type { Rune, Element } from "./types";

let _runeId = 0;
function rid() { return `rune_${++_runeId}`; }

// Helper to create a rune template (IDs are assigned at runtime when added to deck)
function R(
  name: string,
  element: Element,
  baseDamage: number,
  baseBlock: number,
  energyCost: number,
  description: string,
  rarity: Rune["rarity"],
  keywords: Rune["keywords"] = [],
  extra: Partial<Rune> = {},
): Rune {
  return { id: rid(), name, element, baseDamage, baseBlock, energyCost, description, rarity, keywords, ...extra };
}

// ── IGNIS (Fire) ─────────────────────────────────────────────────────────────

export const IGNIS_RUNES: Rune[] = [
  R("Ember", "ignis", 6, 0, 1, "Deal 6 damage.", "common"),
  R("Sear", "ignis", 4, 0, 1, "Deal 4 damage. Apply 2 Burn.", "common", ["burn"]),
  R("Flare", "ignis", 9, 0, 2, "Deal 9 damage.", "common"),
  R("Kindling", "ignis", 3, 0, 0, "Deal 3 damage. Costs 0 energy.", "common"),
  R("Pyroclasm", "ignis", 8, 0, 2, "Deal 8 damage. Apply 3 Burn.", "uncommon", ["burn"]),
  R("Wildfire", "ignis", 5, 0, 1, "Deal 5 damage. Apply 2 Burn to ALL enemies.", "uncommon", ["burn"]),
  R("Ignition", "ignis", 12, 0, 2, "Deal 12 damage. Consume all Burn for instant damage.", "uncommon", ["ignite"]),
  R("Inferno", "ignis", 6, 0, 1, "Deal 6 damage. +2 for each adjacent Ignis rune.", "rare", ["amplify"]),
  R("Volatile Rune", "ignis", 4, 0, 1, "Deal 4 damage. Explodes: clears adjacent cells for +4 each.", "rare", ["volatile"]),
  R("Phoenix Sigil", "ignis", 15, 0, 3, "Deal 15 damage. Apply 5 Burn. Echoes once.", "legendary", ["burn", "echo"]),
];

// ── GLACIUS (Frost) ──────────────────────────────────────────────────────────

export const GLACIUS_RUNES: Rune[] = [
  R("Chill", "glacius", 4, 3, 1, "Deal 4 damage. Gain 3 Block.", "common"),
  R("Frost Shard", "glacius", 6, 0, 1, "Deal 6 damage. Apply 1 Freeze.", "common", ["freeze"]),
  R("Ice Wall", "glacius", 0, 8, 1, "Gain 8 Block.", "common"),
  R("Glacial Spike", "glacius", 9, 0, 2, "Deal 9 damage. Apply 1 Freeze.", "common", ["freeze"]),
  R("Permafrost", "glacius", 0, 12, 2, "Gain 12 Block. Persists on grid.", "uncommon", [], { persistent: true }),
  R("Shatter Strike", "glacius", 10, 0, 2, "Deal 10 damage. 2x to frozen enemies.", "uncommon", ["shatter"]),
  R("Blizzard", "glacius", 5, 5, 2, "Deal 5 damage and gain 5 Block. Apply 1 Freeze.", "uncommon", ["freeze"]),
  R("Rime Armor", "glacius", 0, 6, 1, "Gain 6 Block. +3 for each adjacent rune.", "rare", ["fortify"]),
  R("Absolute Zero", "glacius", 0, 0, 2, "Apply 2 Freeze to ALL enemies.", "rare", ["freeze"]),
  R("Frozen Eternity", "glacius", 8, 15, 3, "Deal 8 damage. Gain 15 Block. Freeze all. Persists.", "legendary", ["freeze"], { persistent: true }),
];

// ── VOLTIS (Storm) ───────────────────────────────────────────────────────────

export const VOLTIS_RUNES: Rune[] = [
  R("Spark", "voltis", 5, 0, 1, "Deal 5 damage.", "common"),
  R("Arc Bolt", "voltis", 4, 0, 1, "Deal 4 damage. Chain 50% to adjacent enemy.", "common", ["shock"]),
  R("Static Charge", "voltis", 3, 0, 0, "Deal 3 damage. Gain 1 energy.", "common", ["siphon"]),
  R("Lightning Strike", "voltis", 11, 0, 2, "Deal 11 damage.", "common"),
  R("Thunderclap", "voltis", 7, 0, 1, "Deal 7 damage. Chain to adjacent enemy.", "uncommon", ["shock"]),
  R("Overload", "voltis", 6, 0, 1, "Deal 6 damage. Gain 1 energy.", "uncommon", ["siphon"]),
  R("Ball Lightning", "voltis", 5, 0, 1, "Deal 5 damage. Echoes once.", "uncommon", ["echo"]),
  R("Storm Conduit", "voltis", 4, 0, 1, "Deal 4 damage. +2 for each adjacent Voltis rune.", "rare", ["amplify"]),
  R("Chain Lightning", "voltis", 8, 0, 2, "Deal 8 damage. Chains to ALL enemies at 50%.", "rare", ["shock"]),
  R("Tempest Sigil", "voltis", 14, 0, 3, "Deal 14 damage. Chain to all. Gain 2 energy.", "legendary", ["shock", "siphon"]),
];

// ── UMBRA (Shadow) ───────────────────────────────────────────────────────────

export const UMBRA_RUNES: Rune[] = [
  R("Shadow Dart", "umbra", 5, 0, 1, "Deal 5 damage. Apply 2 Poison.", "common", ["poison"]),
  R("Dark Veil", "umbra", 0, 6, 1, "Gain 6 Block.", "common"),
  R("Miasma", "umbra", 3, 0, 1, "Deal 3 damage. Apply 3 Poison.", "common", ["poison"]),
  R("Nightblade", "umbra", 8, 0, 2, "Deal 8 damage. Apply 3 Poison.", "common", ["poison"]),
  R("Shadow Clone", "umbra", 5, 0, 1, "Deal 5 damage. Duplicate to empty cell.", "uncommon", ["duplicate"]),
  R("Toxic Cloud", "umbra", 2, 0, 1, "Deal 2 damage. Apply 5 Poison to ALL enemies.", "uncommon", ["poison"]),
  R("Life Drain", "umbra", 7, 0, 2, "Deal 7 damage. Heal for 50%.", "uncommon", ["drain"]),
  R("Phantasm", "umbra", 6, 0, 1, "Deal 6 damage. Duplicate to empty cell. Apply 2 Poison.", "rare", ["duplicate", "poison"]),
  R("Doom Mark", "umbra", 3, 0, 1, "Deal 3 damage. Apply 8 Poison.", "rare", ["poison"]),
  R("Void Sigil", "umbra", 10, 0, 3, "Deal 10 damage. Apply 10 Poison. Heal for 50%. Echoes.", "legendary", ["poison", "drain", "echo"]),
];

// ── ARCANA (Arcane/Wildcard) ─────────────────────────────────────────────────

export const ARCANA_RUNES: Rune[] = [
  R("Prism Shard", "arcana", 5, 0, 1, "Deal 5 damage. Copies adjacent element.", "common", ["wildcard"]),
  R("Arcane Shield", "arcana", 0, 7, 1, "Gain 7 Block. Copies adjacent element.", "common", ["wildcard"]),
  R("Flux", "arcana", 4, 4, 1, "Deal 4 damage. Gain 4 Block.", "common"),
  R("Ether Bolt", "arcana", 7, 0, 1, "Deal 7 damage.", "common"),
  R("Resonance", "arcana", 3, 0, 1, "Deal 3 damage. +2 for each adjacent rune (any element).", "uncommon", ["amplify"]),
  R("Prism Nova", "arcana", 6, 0, 2, "Deal 6 damage to ALL enemies.", "uncommon"),
  R("Transmute", "arcana", 0, 0, 0, "Copies element of adjacent rune. Costs 0.", "uncommon", ["wildcard"]),
  R("Mirror Rune", "arcana", 5, 0, 1, "Deal 5 damage. Duplicate to empty cell. Wildcard.", "rare", ["duplicate", "wildcard"]),
  R("Chrono Shard", "arcana", 8, 0, 2, "Deal 8 damage. Gain 1 energy. Echo.", "rare", ["siphon", "echo"]),
  R("Singularity", "arcana", 20, 0, 4, "Deal 20 damage. Clears entire grid for +3 per cell.", "legendary", ["volatile"]),
];

// ── All runes combined ───────────────────────────────────────────────────────

export const ALL_RUNES: Rune[] = [
  ...IGNIS_RUNES,
  ...GLACIUS_RUNES,
  ...VOLTIS_RUNES,
  ...UMBRA_RUNES,
  ...ARCANA_RUNES,
];

export const RUNES_BY_ELEMENT: Record<Element, Rune[]> = {
  ignis: IGNIS_RUNES,
  glacius: GLACIUS_RUNES,
  voltis: VOLTIS_RUNES,
  umbra: UMBRA_RUNES,
  arcana: ARCANA_RUNES,
};

// ── Starter decks per class ──────────────────────────────────────────────────

export function getStarterDeck(characterClass: string): Rune[] {
  const clone = (r: Rune): Rune => ({ ...r, id: rid() });

  switch (characterClass) {
    case "pyromancer":
      return [
        clone(IGNIS_RUNES[0]), clone(IGNIS_RUNES[0]), // 2x Ember
        clone(IGNIS_RUNES[1]), clone(IGNIS_RUNES[1]), // 2x Sear
        clone(IGNIS_RUNES[3]),                          // Kindling
        clone(GLACIUS_RUNES[0]),                        // Chill
        clone(VOLTIS_RUNES[0]),                         // Spark
        clone(ARCANA_RUNES[2]),                         // Flux
        clone(ARCANA_RUNES[2]),                         // Flux
        clone(ARCANA_RUNES[0]),                         // Prism Shard
      ];
    case "chronomancer":
      return [
        clone(ARCANA_RUNES[0]), clone(ARCANA_RUNES[0]), // 2x Prism Shard
        clone(ARCANA_RUNES[2]), clone(ARCANA_RUNES[2]), // 2x Flux
        clone(IGNIS_RUNES[0]),                           // Ember
        clone(GLACIUS_RUNES[0]),                         // Chill
        clone(VOLTIS_RUNES[2]),                          // Static Charge
        clone(UMBRA_RUNES[0]),                           // Shadow Dart
        clone(ARCANA_RUNES[3]),                          // Ether Bolt
        clone(ARCANA_RUNES[6]),                          // Transmute
      ];
    case "voidwalker":
      return [
        clone(UMBRA_RUNES[0]), clone(UMBRA_RUNES[0]), // 2x Shadow Dart
        clone(UMBRA_RUNES[2]), clone(UMBRA_RUNES[2]), // 2x Miasma
        clone(UMBRA_RUNES[1]),                          // Dark Veil
        clone(IGNIS_RUNES[0]),                          // Ember
        clone(GLACIUS_RUNES[2]),                        // Ice Wall
        clone(ARCANA_RUNES[2]),                         // Flux
        clone(ARCANA_RUNES[2]),                         // Flux
        clone(ARCANA_RUNES[0]),                         // Prism Shard
      ];
    case "stormcaller":
      return [
        clone(VOLTIS_RUNES[0]), clone(VOLTIS_RUNES[0]), // 2x Spark
        clone(VOLTIS_RUNES[1]), clone(VOLTIS_RUNES[1]), // 2x Arc Bolt
        clone(VOLTIS_RUNES[2]),                          // Static Charge
        clone(IGNIS_RUNES[0]),                           // Ember
        clone(GLACIUS_RUNES[0]),                         // Chill
        clone(ARCANA_RUNES[2]),                          // Flux
        clone(ARCANA_RUNES[2]),                          // Flux
        clone(ARCANA_RUNES[0]),                          // Prism Shard
      ];
    default:
      return [
        clone(IGNIS_RUNES[0]), clone(IGNIS_RUNES[0]),
        clone(GLACIUS_RUNES[0]), clone(GLACIUS_RUNES[0]),
        clone(VOLTIS_RUNES[0]),
        clone(UMBRA_RUNES[0]),
        clone(ARCANA_RUNES[2]), clone(ARCANA_RUNES[2]),
        clone(ARCANA_RUNES[0]), clone(ARCANA_RUNES[0]),
      ];
  }
}

/** Get random rune rewards (filtered by act for progression) */
export function getRuneRewards(act: number, count: number, seed: number): Rune[] {
  const rng = mulberry32(seed);
  const pool: Rune[] = [];

  for (const rune of ALL_RUNES) {
    if (rune.rarity === "common") pool.push(rune, rune, rune); // 3x weight
    if (rune.rarity === "uncommon" && act >= 1) pool.push(rune, rune);
    if (rune.rarity === "rare" && act >= 2) pool.push(rune);
    if (rune.rarity === "legendary" && act >= 3) pool.push(rune);
  }

  const results: Rune[] = [];
  const seen = new Set<string>();
  while (results.length < count && pool.length > 0) {
    const idx = Math.floor(rng() * pool.length);
    const picked = pool[idx];
    if (!seen.has(picked.name)) {
      seen.add(picked.name);
      results.push({ ...picked, id: rid() });
    }
    pool.splice(idx, 1);
  }
  return results;
}

// Simple seeded RNG
export function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
