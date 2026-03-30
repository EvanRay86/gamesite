// Card definitions for Netherveil — the full card database
// Phase 1: ~20 starter + neutral cards, class starters for Voidwalker & Embercaster

import type { CardDef, CardInstance, CardEffect, ClassId } from "@/types/netherveil";
import { uid } from "./seed";

// ── Card Database ───────────────────────────────────────────────────────────

export const CARD_DEFS: Record<string, CardDef> = {
  // ── Neutral Starter Cards ──────────────────────────────────────────────
  strike: {
    id: "strike",
    name: "Strike",
    classId: "neutral",
    rarity: "starter",
    energyCost: 1,
    targetPattern: "single",
    effects: [{ type: "damage", value: 6 }],
    upgradeEffects: [{ type: "damage", value: 9 }],
    description: "Deal 6 damage.",
    upgradeDescription: "Deal 9 damage.",
    emoji: "⚔️",
  },
  defend: {
    id: "defend",
    name: "Defend",
    classId: "neutral",
    rarity: "starter",
    energyCost: 1,
    targetPattern: "self",
    effects: [{ type: "shield", value: 5 }],
    upgradeEffects: [{ type: "shield", value: 8 }],
    description: "Gain 5 Shield.",
    upgradeDescription: "Gain 8 Shield.",
    emoji: "🛡️",
  },

  // ── Neutral Common Cards ───────────────────────────────────────────────
  cleave: {
    id: "cleave",
    name: "Cleave",
    classId: "neutral",
    rarity: "common",
    energyCost: 1,
    targetPattern: "row",
    effects: [{ type: "damage", value: 4 }],
    upgradeEffects: [{ type: "damage", value: 7 }],
    description: "Deal 4 damage to an entire row.",
    upgradeDescription: "Deal 7 damage to an entire row.",
    emoji: "🗡️",
  },
  fortify: {
    id: "fortify",
    name: "Fortify",
    classId: "neutral",
    rarity: "common",
    energyCost: 1,
    targetPattern: "self",
    effects: [
      { type: "shield", value: 3 },
      { type: "apply_status", value: 2, statusType: "thorns", statusDuration: 2 },
    ],
    upgradeEffects: [
      { type: "shield", value: 5 },
      { type: "apply_status", value: 3, statusType: "thorns", statusDuration: 2 },
    ],
    description: "Gain 3 Shield and 2 Thorns for 2 turns.",
    upgradeDescription: "Gain 5 Shield and 3 Thorns for 2 turns.",
    emoji: "🏰",
  },
  surge: {
    id: "surge",
    name: "Surge",
    classId: "neutral",
    rarity: "common",
    energyCost: 0,
    targetPattern: "self",
    effects: [{ type: "draw", value: 2 }],
    upgradeEffects: [{ type: "draw", value: 3 }],
    description: "Draw 2 cards.",
    upgradeDescription: "Draw 3 cards.",
    emoji: "⚡",
  },
  precision_strike: {
    id: "precision_strike",
    name: "Precision Strike",
    classId: "neutral",
    rarity: "common",
    energyCost: 2,
    targetPattern: "single",
    effects: [{ type: "damage", value: 14 }],
    upgradeEffects: [{ type: "damage", value: 20 }],
    description: "Deal 14 damage to a single target.",
    upgradeDescription: "Deal 20 damage to a single target.",
    emoji: "🎯",
  },
  second_wind: {
    id: "second_wind",
    name: "Second Wind",
    classId: "neutral",
    rarity: "common",
    energyCost: 1,
    targetPattern: "self",
    effects: [
      { type: "shield", value: 4 },
      { type: "draw", value: 1 },
    ],
    upgradeEffects: [
      { type: "shield", value: 6 },
      { type: "draw", value: 2 },
    ],
    description: "Gain 4 Shield. Draw 1 card.",
    upgradeDescription: "Gain 6 Shield. Draw 2 cards.",
    emoji: "💨",
  },
  reckless_charge: {
    id: "reckless_charge",
    name: "Reckless Charge",
    classId: "neutral",
    rarity: "common",
    energyCost: 0,
    targetPattern: "single",
    effects: [{ type: "damage", value: 7 }],
    upgradeEffects: [{ type: "damage", value: 10 }],
    description: "Deal 7 damage. Costs 0 energy.",
    upgradeDescription: "Deal 10 damage. Costs 0 energy.",
    emoji: "💥",
  },

  // ── Neutral Uncommon Cards ─────────────────────────────────────────────
  shockwave: {
    id: "shockwave",
    name: "Shockwave",
    classId: "neutral",
    rarity: "uncommon",
    energyCost: 2,
    targetPattern: "all_enemies",
    effects: [{ type: "damage", value: 5 }],
    upgradeEffects: [{ type: "damage", value: 8 }],
    description: "Deal 5 damage to ALL enemies.",
    upgradeDescription: "Deal 8 damage to ALL enemies.",
    emoji: "🌊",
  },
  iron_will: {
    id: "iron_will",
    name: "Iron Will",
    classId: "neutral",
    rarity: "uncommon",
    energyCost: 2,
    targetPattern: "self",
    effects: [
      { type: "shield", value: 12 },
      { type: "apply_status", value: 1, statusType: "strengthen", statusDuration: 2 },
    ],
    upgradeEffects: [
      { type: "shield", value: 16 },
      { type: "apply_status", value: 2, statusType: "strengthen", statusDuration: 2 },
    ],
    description: "Gain 12 Shield and 1 Strengthen for 2 turns.",
    upgradeDescription: "Gain 16 Shield and 2 Strengthen for 2 turns.",
    emoji: "🦾",
  },
  adrenaline: {
    id: "adrenaline",
    name: "Adrenaline",
    classId: "neutral",
    rarity: "uncommon",
    energyCost: 1,
    targetPattern: "self",
    effects: [
      { type: "energy_gain", value: 2 },
      { type: "draw", value: 1 },
    ],
    upgradeEffects: [
      { type: "energy_gain", value: 2 },
      { type: "draw", value: 2 },
    ],
    description: "Gain 2 Energy. Draw 1 card.",
    upgradeDescription: "Gain 2 Energy. Draw 2 cards.",
    emoji: "🔥",
    exhaust: true,
  },

  // ── Neutral Rare Cards ─────────────────────────────────────────────────
  obliterate: {
    id: "obliterate",
    name: "Obliterate",
    classId: "neutral",
    rarity: "rare",
    energyCost: 3,
    targetPattern: "aoe_3x3",
    effects: [{ type: "damage", value: 12 }],
    upgradeEffects: [{ type: "damage", value: 18 }],
    description: "Deal 12 damage in a 3x3 area.",
    upgradeDescription: "Deal 18 damage in a 3x3 area.",
    emoji: "☄️",
  },
  battle_trance: {
    id: "battle_trance",
    name: "Battle Trance",
    classId: "neutral",
    rarity: "rare",
    energyCost: 0,
    targetPattern: "self",
    effects: [{ type: "draw", value: 3 }],
    upgradeEffects: [{ type: "draw", value: 4 }],
    description: "Draw 3 cards.",
    upgradeDescription: "Draw 4 cards.",
    emoji: "🧘",
    exhaust: true,
  },

  // ── Voidwalker Cards ───────────────────────────────────────────────────
  void_bolt: {
    id: "void_bolt",
    name: "Void Bolt",
    classId: "voidwalker",
    rarity: "starter",
    energyCost: 1,
    targetPattern: "single",
    effects: [
      { type: "damage", value: 5 },
      { type: "apply_status", value: 1, statusType: "void_charges", statusDuration: -1 },
    ],
    upgradeEffects: [
      { type: "damage", value: 8 },
      { type: "apply_status", value: 2, statusType: "void_charges", statusDuration: -1 },
    ],
    description: "Deal 5 damage. Gain 1 Void Charge.",
    upgradeDescription: "Deal 8 damage. Gain 2 Void Charges.",
    emoji: "🌀",
  },
  phase_shift: {
    id: "phase_shift",
    name: "Phase Shift",
    classId: "voidwalker",
    rarity: "common",
    energyCost: 1,
    targetPattern: "self",
    effects: [
      { type: "shield", value: 6 },
      { type: "draw", value: 1 },
      { type: "apply_status", value: 1, statusType: "void_charges", statusDuration: -1 },
    ],
    upgradeEffects: [
      { type: "shield", value: 9 },
      { type: "draw", value: 1 },
      { type: "apply_status", value: 2, statusType: "void_charges", statusDuration: -1 },
    ],
    description: "Gain 6 Shield, draw 1 card, gain 1 Void Charge.",
    upgradeDescription: "Gain 9 Shield, draw 1 card, gain 2 Void Charges.",
    emoji: "🌌",
  },
  null_lance: {
    id: "null_lance",
    name: "Null Lance",
    classId: "voidwalker",
    rarity: "common",
    energyCost: 1,
    targetPattern: "column",
    effects: [
      { type: "damage", value: 4 },
      { type: "apply_status", value: 1, statusType: "weaken", statusDuration: 1 },
    ],
    upgradeEffects: [
      { type: "damage", value: 6 },
      { type: "apply_status", value: 1, statusType: "weaken", statusDuration: 2 },
    ],
    description: "Deal 4 damage to a column. Apply 1 Weaken.",
    upgradeDescription: "Deal 6 damage to a column. Apply 1 Weaken for 2 turns.",
    emoji: "🔮",
  },
  rift_tear: {
    id: "rift_tear",
    name: "Rift Tear",
    classId: "voidwalker",
    rarity: "uncommon",
    energyCost: 2,
    targetPattern: "cross",
    effects: [{ type: "damage", value: 8 }],
    upgradeEffects: [{ type: "damage", value: 12 }],
    description: "Deal 8 damage in a cross pattern.",
    upgradeDescription: "Deal 12 damage in a cross pattern.",
    emoji: "✨",
  },
  void_collapse: {
    id: "void_collapse",
    name: "Void Collapse",
    classId: "voidwalker",
    rarity: "rare",
    energyCost: 2,
    targetPattern: "all_enemies",
    effects: [
      { type: "damage", value: 3 },
      { type: "apply_status", value: 2, statusType: "vulnerable", statusDuration: 2 },
    ],
    upgradeEffects: [
      { type: "damage", value: 5 },
      { type: "apply_status", value: 2, statusType: "vulnerable", statusDuration: 3 },
    ],
    description: "Deal 3 damage to ALL enemies. Apply 2 Vulnerable for 2 turns.",
    upgradeDescription: "Deal 5 damage to ALL enemies. Apply 2 Vulnerable for 3 turns.",
    emoji: "🕳️",
    keywords: ["void"],
  },

  // ── Embercaster Cards ──────────────────────────────────────────────────
  ember_bolt: {
    id: "ember_bolt",
    name: "Ember Bolt",
    classId: "embercaster",
    rarity: "starter",
    energyCost: 1,
    targetPattern: "single",
    effects: [
      { type: "damage", value: 4 },
      { type: "apply_status", value: 1, statusType: "burn", statusDuration: 2 },
      { type: "apply_status", value: 1, statusType: "ember_stacks", statusDuration: -1 },
    ],
    upgradeEffects: [
      { type: "damage", value: 6 },
      { type: "apply_status", value: 2, statusType: "burn", statusDuration: 2 },
      { type: "apply_status", value: 1, statusType: "ember_stacks", statusDuration: -1 },
    ],
    description: "Deal 4 damage. Apply 1 Burn. Gain 1 Ember Stack.",
    upgradeDescription: "Deal 6 damage. Apply 2 Burn. Gain 1 Ember Stack.",
    emoji: "🔥",
  },
  flame_wave: {
    id: "flame_wave",
    name: "Flame Wave",
    classId: "embercaster",
    rarity: "common",
    energyCost: 2,
    targetPattern: "row",
    effects: [
      { type: "damage", value: 6 },
      { type: "apply_status", value: 1, statusType: "burn", statusDuration: 2 },
    ],
    upgradeEffects: [
      { type: "damage", value: 9 },
      { type: "apply_status", value: 2, statusType: "burn", statusDuration: 2 },
    ],
    description: "Deal 6 damage to a row. Apply 1 Burn.",
    upgradeDescription: "Deal 9 damage to a row. Apply 2 Burn.",
    emoji: "🌋",
  },
  ignite: {
    id: "ignite",
    name: "Ignite",
    classId: "embercaster",
    rarity: "common",
    energyCost: 1,
    targetPattern: "single",
    effects: [
      { type: "damage", value: 3 },
      { type: "apply_status", value: 3, statusType: "burn", statusDuration: 3 },
    ],
    upgradeEffects: [
      { type: "damage", value: 4 },
      { type: "apply_status", value: 4, statusType: "burn", statusDuration: 3 },
    ],
    description: "Deal 3 damage. Apply 3 Burn for 3 turns.",
    upgradeDescription: "Deal 4 damage. Apply 4 Burn for 3 turns.",
    emoji: "💫",
  },
  inferno: {
    id: "inferno",
    name: "Inferno",
    classId: "embercaster",
    rarity: "uncommon",
    energyCost: 2,
    targetPattern: "aoe_2x2",
    effects: [
      { type: "damage", value: 7 },
      { type: "apply_status", value: 2, statusType: "burn", statusDuration: 2 },
    ],
    upgradeEffects: [
      { type: "damage", value: 10 },
      { type: "apply_status", value: 3, statusType: "burn", statusDuration: 2 },
    ],
    description: "Deal 7 damage in a 2x2 area. Apply 2 Burn.",
    upgradeDescription: "Deal 10 damage in a 2x2 area. Apply 3 Burn.",
    emoji: "🔥",
  },
  conflagration: {
    id: "conflagration",
    name: "Conflagration",
    classId: "embercaster",
    rarity: "rare",
    energyCost: 3,
    targetPattern: "all_enemies",
    effects: [
      { type: "damage", value: 8 },
      { type: "apply_status", value: 3, statusType: "burn", statusDuration: 3 },
    ],
    upgradeEffects: [
      { type: "damage", value: 12 },
      { type: "apply_status", value: 4, statusType: "burn", statusDuration: 3 },
    ],
    description: "Deal 8 damage to ALL enemies. Apply 3 Burn for 3 turns.",
    upgradeDescription: "Deal 12 damage to ALL enemies. Apply 4 Burn for 3 turns.",
    emoji: "🌟",
    exhaust: true,
  },

  // ── Weavekeeper Cards ──────────────────────────────────────────────────
  mending_thread: {
    id: "mending_thread",
    name: "Mending Thread",
    classId: "weavekeeper",
    rarity: "starter",
    energyCost: 1,
    targetPattern: "self",
    effects: [
      { type: "shield", value: 7 },
      { type: "apply_status", value: 1, statusType: "weave_threads", statusDuration: -1 },
    ],
    upgradeEffects: [
      { type: "shield", value: 10 },
      { type: "apply_status", value: 2, statusType: "weave_threads", statusDuration: -1 },
    ],
    description: "Gain 7 Shield. Gain 1 Weave Thread.",
    upgradeDescription: "Gain 10 Shield. Gain 2 Weave Threads.",
    emoji: "🧵",
  },
  thorn_stitch: {
    id: "thorn_stitch",
    name: "Thorn Stitch",
    classId: "weavekeeper",
    rarity: "common",
    energyCost: 1,
    targetPattern: "single",
    effects: [
      { type: "damage", value: 5 },
      { type: "apply_status", value: 2, statusType: "thorns", statusDuration: 2 },
    ],
    upgradeEffects: [
      { type: "damage", value: 7 },
      { type: "apply_status", value: 3, statusType: "thorns", statusDuration: 3 },
    ],
    description: "Deal 5 damage. Gain 2 Thorns for 2 turns.",
    upgradeDescription: "Deal 7 damage. Gain 3 Thorns for 3 turns.",
    emoji: "🌿",
  },
  restoration_weave: {
    id: "restoration_weave",
    name: "Restoration Weave",
    classId: "weavekeeper",
    rarity: "uncommon",
    energyCost: 2,
    targetPattern: "self",
    effects: [
      { type: "heal", value: 8 },
      { type: "shield", value: 5 },
    ],
    upgradeEffects: [
      { type: "heal", value: 12 },
      { type: "shield", value: 8 },
    ],
    description: "Heal 8 HP. Gain 5 Shield.",
    upgradeDescription: "Heal 12 HP. Gain 8 Shield.",
    emoji: "💚",
  },

  // ── Shadowblade Cards ──────────────────────────────────────────────────
  shadow_strike: {
    id: "shadow_strike",
    name: "Shadow Strike",
    classId: "shadowblade",
    rarity: "starter",
    energyCost: 1,
    targetPattern: "single",
    effects: [
      { type: "damage", value: 6 },
      { type: "apply_status", value: 1, statusType: "shadow_marks", statusDuration: -1 },
    ],
    upgradeEffects: [
      { type: "damage", value: 9 },
      { type: "apply_status", value: 2, statusType: "shadow_marks", statusDuration: -1 },
    ],
    description: "Deal 6 damage. Apply 1 Shadow Mark.",
    upgradeDescription: "Deal 9 damage. Apply 2 Shadow Marks.",
    emoji: "🗡️",
  },
  backstab: {
    id: "backstab",
    name: "Backstab",
    classId: "shadowblade",
    rarity: "common",
    energyCost: 1,
    targetPattern: "single",
    effects: [{ type: "damage", value: 10 }],
    upgradeEffects: [{ type: "damage", value: 14 }],
    description: "Deal 10 damage. Can only target back row.",
    upgradeDescription: "Deal 14 damage. Can only target back row.",
    emoji: "🔪",
    keywords: ["backstab"],
  },
  smoke_bomb: {
    id: "smoke_bomb",
    name: "Smoke Bomb",
    classId: "shadowblade",
    rarity: "common",
    energyCost: 1,
    targetPattern: "self",
    effects: [
      { type: "apply_status", value: 1, statusType: "stealth", statusDuration: 1 },
      { type: "draw", value: 1 },
    ],
    upgradeEffects: [
      { type: "apply_status", value: 1, statusType: "stealth", statusDuration: 2 },
      { type: "draw", value: 2 },
    ],
    description: "Gain Stealth for 1 turn. Draw 1 card.",
    upgradeDescription: "Gain Stealth for 2 turns. Draw 2 cards.",
    emoji: "💨",
  },
  flurry: {
    id: "flurry",
    name: "Flurry",
    classId: "shadowblade",
    rarity: "uncommon",
    energyCost: 2,
    targetPattern: "random_3",
    effects: [{ type: "damage", value: 5 }],
    upgradeEffects: [{ type: "damage", value: 7 }],
    description: "Deal 5 damage to 3 random enemies.",
    upgradeDescription: "Deal 7 damage to 3 random enemies.",
    emoji: "⚡",
  },
};

// ── Helpers ─────────────────────────────────────────────────────────────────

export function getCardDef(id: string): CardDef {
  const def = CARD_DEFS[id];
  if (!def) throw new Error(`Unknown card: ${id}`);
  return def;
}

export function createCardInstance(defId: string, upgraded = false): CardInstance {
  return { instanceId: uid(), defId, upgraded };
}

export function getEffects(card: CardInstance): CardEffect[] {
  const def = getCardDef(card.defId);
  return card.upgraded && def.upgradeEffects ? def.upgradeEffects : def.effects;
}

export function getDescription(card: CardInstance): string {
  const def = getCardDef(card.defId);
  return card.upgraded && def.upgradeDescription
    ? def.upgradeDescription
    : def.description;
}

export function getEnergyCost(card: CardInstance): number {
  const def = getCardDef(card.defId);
  return def.energyCost;
}

/** Get all cards available for rewards in a given act and class. */
export function getRewardPool(
  classId: ClassId,
  act: string,
  rng: () => number,
): CardDef[] {
  return Object.values(CARD_DEFS).filter(
    (c) =>
      c.rarity !== "starter" &&
      (c.classId === classId || c.classId === "neutral"),
  );
}

/** Pick n unique card choices for a reward screen. */
export function pickRewardCards(
  classId: ClassId,
  act: string,
  count: number,
  rng: () => number,
): CardDef[] {
  const pool = getRewardPool(classId, act, rng);
  const result: CardDef[] = [];
  const used = new Set<string>();

  // Weight by rarity
  const rarityWeights: Record<string, number> = {
    common: 60,
    uncommon: 30,
    rare: 9,
    legendary: 1,
  };

  for (let i = 0; i < count && pool.length > used.size; i++) {
    let attempts = 0;
    while (attempts < 50) {
      const card = pool[Math.floor(rng() * pool.length)];
      if (!used.has(card.id)) {
        const weight = rarityWeights[card.rarity] || 10;
        if (rng() * 100 < weight) {
          result.push(card);
          used.add(card.id);
          break;
        }
      }
      attempts++;
    }
    // Fallback: just pick any unused card
    if (result.length <= i) {
      for (const card of pool) {
        if (!used.has(card.id)) {
          result.push(card);
          used.add(card.id);
          break;
        }
      }
    }
  }

  return result;
}
