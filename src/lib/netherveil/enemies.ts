// Enemy definitions and AI for Netherveil

import type {
  EnemyDef,
  EnemyState,
  EnemyIntent,
  IntentType,
  ActId,
  GridPosition,
  ActiveStatus,
} from "@/types/netherveil";
import { uid } from "./seed";

// ── Enemy Database ──────────────────────────────────────────────────────────

export const ENEMY_DEFS: Record<string, EnemyDef> = {
  // ── Act 1: The Fractured Wastes ────────────────────────────────────────
  husk: {
    id: "husk",
    name: "Husk",
    emoji: "💀",
    maxHp: 18,
    baseAttack: 5,
    abilities: [],
    act: "wastes",
    isElite: false,
    isBoss: false,
    desc: "A shambling remnant of a lost soul.",
  },
  void_rat: {
    id: "void_rat",
    name: "Void Rat",
    emoji: "🐀",
    maxHp: 12,
    baseAttack: 3,
    abilities: [{ type: "swarm", value: 2, desc: "Attacks twice per turn." }],
    act: "wastes",
    isElite: false,
    isBoss: false,
    desc: "Small but attacks in quick bursts.",
  },
  shade: {
    id: "shade",
    name: "Shade",
    emoji: "👻",
    maxHp: 22,
    baseAttack: 7,
    abilities: [
      { type: "phase", value: 1, desc: "Takes 50% less damage every other turn." },
    ],
    act: "wastes",
    isElite: false,
    isBoss: false,
    desc: "Phases in and out of reality.",
  },
  crystal_sentry: {
    id: "crystal_sentry",
    name: "Crystal Sentry",
    emoji: "🔷",
    maxHp: 30,
    baseAttack: 4,
    abilities: [
      { type: "armor", value: 3, desc: "Gains 3 Shield at the start of each turn." },
    ],
    act: "wastes",
    isElite: false,
    isBoss: false,
    desc: "A crystallized guardian with natural armor.",
  },
  ember_wisp: {
    id: "ember_wisp",
    name: "Ember Wisp",
    emoji: "🔥",
    maxHp: 10,
    baseAttack: 2,
    abilities: [
      { type: "burn_attack", value: 2, desc: "Attacks apply 2 Burn." },
    ],
    act: "wastes",
    isElite: false,
    isBoss: false,
    desc: "A flickering flame that leaves lingering burns.",
  },

  // ── Act 1 Elite ────────────────────────────────────────────────────────
  void_knight: {
    id: "void_knight",
    name: "Void Knight",
    emoji: "⚔️",
    maxHp: 50,
    baseAttack: 10,
    abilities: [
      { type: "armor", value: 5, desc: "Gains 5 Shield each turn." },
      { type: "enrage", value: 2, desc: "Gains +2 attack each turn." },
    ],
    act: "wastes",
    isElite: true,
    isBoss: false,
    desc: "An armored warrior consumed by the Veil.",
  },

  // ── Act 1 Boss ─────────────────────────────────────────────────────────
  the_hollow: {
    id: "the_hollow",
    name: "The Hollow",
    emoji: "🕳️",
    maxHp: 90,
    baseAttack: 8,
    abilities: [
      { type: "summon", value: 1, desc: "Summons Husks each 3rd turn." },
      { type: "aoe_attack", value: 5, desc: "Deals damage to the entire field periodically." },
    ],
    act: "wastes",
    isElite: false,
    isBoss: true,
    preferredRow: 2,
    desc: "The gaping maw of the Wastes. It consumes all.",
  },

  // ── Act 2: The Abyssal Depths ──────────────────────────────────────────
  deep_lurker: {
    id: "deep_lurker",
    name: "Deep Lurker",
    emoji: "🐙",
    maxHp: 28,
    baseAttack: 8,
    abilities: [
      { type: "poison_attack", value: 2, desc: "Attacks apply 2 Poison." },
    ],
    act: "depths",
    isElite: false,
    isBoss: false,
    desc: "Reaches from the dark waters below.",
  },
  abyssal_eye: {
    id: "abyssal_eye",
    name: "Abyssal Eye",
    emoji: "👁️",
    maxHp: 20,
    baseAttack: 4,
    abilities: [
      { type: "debuff", value: 1, desc: "Applies Vulnerable to a random target." },
    ],
    act: "depths",
    isElite: false,
    isBoss: false,
    desc: "An unblinking eye that finds your weaknesses.",
  },
  coral_golem: {
    id: "coral_golem",
    name: "Coral Golem",
    emoji: "🪨",
    maxHp: 45,
    baseAttack: 6,
    abilities: [
      { type: "armor", value: 8, desc: "Gains 8 Shield each turn." },
    ],
    act: "depths",
    isElite: false,
    isBoss: false,
    desc: "Encrusted with ancient coral, tough to break through.",
  },

  // ── Act 2 Elite ────────────────────────────────────────────────────────
  leviathan_spawn: {
    id: "leviathan_spawn",
    name: "Leviathan Spawn",
    emoji: "🐉",
    maxHp: 70,
    baseAttack: 12,
    abilities: [
      { type: "aoe_attack", value: 6, desc: "Row-wide attack every 2nd turn." },
      { type: "regen", value: 3, desc: "Regenerates 3 HP each turn." },
    ],
    act: "depths",
    isElite: true,
    isBoss: false,
    desc: "A child of something far worse lurking below.",
  },

  // ── Act 2 Boss ─────────────────────────────────────────────────────────
  the_tidecaller: {
    id: "the_tidecaller",
    name: "The Tidecaller",
    emoji: "🌊",
    maxHp: 130,
    baseAttack: 10,
    abilities: [
      { type: "summon", value: 1, desc: "Summons Deep Lurkers." },
      { type: "freeze_attack", value: 1, desc: "Freezes random cards in your hand." },
      { type: "enrage", value: 3, desc: "+3 attack when below 50% HP." },
    ],
    act: "depths",
    isElite: false,
    isBoss: true,
    preferredRow: 2,
    desc: "Master of the abyssal currents. The depths answer her call.",
  },

  // ── Act 3: The Core ────────────────────────────────────────────────────
  void_wraith: {
    id: "void_wraith",
    name: "Void Wraith",
    emoji: "👤",
    maxHp: 35,
    baseAttack: 11,
    abilities: [
      { type: "phase", value: 1, desc: "Immune to damage every other turn." },
    ],
    act: "core",
    isElite: false,
    isBoss: false,
    desc: "Pure void energy given form.",
  },
  entropy_spider: {
    id: "entropy_spider",
    name: "Entropy Spider",
    emoji: "🕷️",
    maxHp: 25,
    baseAttack: 6,
    abilities: [
      { type: "weaken_attack", value: 1, desc: "Attacks apply 1 Weaken." },
      { type: "swarm", value: 2, desc: "Attacks twice." },
    ],
    act: "core",
    isElite: false,
    isBoss: false,
    desc: "Weaves webs of diminishing reality.",
  },

  // ── Act 3 Elite ────────────────────────────────────────────────────────
  veil_guardian: {
    id: "veil_guardian",
    name: "Veil Guardian",
    emoji: "🛡️",
    maxHp: 85,
    baseAttack: 14,
    abilities: [
      { type: "armor", value: 10, desc: "Gains 10 Shield each turn." },
      { type: "aoe_attack", value: 8, desc: "Column attack every 3rd turn." },
    ],
    act: "core",
    isElite: true,
    isBoss: false,
    desc: "The last line of defense before the Core.",
  },

  // ── Act 3 Boss (Final Boss) ────────────────────────────────────────────
  the_veilmother: {
    id: "the_veilmother",
    name: "The Veilmother",
    emoji: "🔮",
    maxHp: 180,
    baseAttack: 12,
    abilities: [
      { type: "multi_phase", value: 3, desc: "Three phases with different attack patterns." },
      { type: "summon", value: 2, desc: "Summons Void Wraiths." },
      { type: "aoe_attack", value: 10, desc: "Devastating AoE in final phase." },
    ],
    act: "core",
    isElite: false,
    isBoss: true,
    preferredRow: 2,
    desc: "The heart of the Netherveil. She has been waiting for you.",
  },
};

// ── Helpers ─────────────────────────────────────────────────────────────────

export function getEnemyDef(id: string): EnemyDef {
  const def = ENEMY_DEFS[id];
  if (!def) throw new Error(`Unknown enemy: ${id}`);
  return def;
}

export function createEnemyState(defId: string, floorScaling = 0): EnemyState {
  const def = getEnemyDef(defId);
  const hpScale = 1 + floorScaling * 0.08;
  return {
    defId,
    instanceId: uid(),
    hp: Math.round(def.maxHp * hpScale),
    maxHp: Math.round(def.maxHp * hpScale),
    shield: 0,
    intent: { type: "attack", value: def.baseAttack, label: `Attack for ${def.baseAttack}` },
    statusEffects: [],
    turnsAlive: 0,
  };
}

/** Get enemies for a standard combat encounter in a given act. */
export function getEncounter(
  act: ActId,
  floor: number,
  rng: () => number,
): { enemies: EnemyState[]; positions: GridPosition[] } {
  const actEnemies = Object.values(ENEMY_DEFS).filter(
    (e) => e.act === act && !e.isElite && !e.isBoss,
  );

  const count = Math.min(
    1 + Math.floor(rng() * 3), // 1-3 enemies
    actEnemies.length,
  );

  const enemies: EnemyState[] = [];
  const positions: GridPosition[] = [];
  const usedPositions = new Set<string>();

  for (let i = 0; i < count; i++) {
    const def = actEnemies[Math.floor(rng() * actEnemies.length)];
    enemies.push(createEnemyState(def.id, floor));

    // Place enemies spread across the grid
    let pos: GridPosition;
    let attempts = 0;
    do {
      pos = {
        row: Math.floor(rng() * 3),
        col: Math.floor(rng() * 5),
      };
      attempts++;
    } while (usedPositions.has(`${pos.row},${pos.col}`) && attempts < 20);
    usedPositions.add(`${pos.row},${pos.col}`);
    positions.push(pos);
  }

  return { enemies, positions };
}

/** Get an elite encounter for a given act. */
export function getEliteEncounter(
  act: ActId,
  floor: number,
  rng: () => number,
): { enemies: EnemyState[]; positions: GridPosition[] } {
  const elites = Object.values(ENEMY_DEFS).filter(
    (e) => e.act === act && e.isElite,
  );
  const def = elites[Math.floor(rng() * elites.length)] || elites[0];
  const enemy = createEnemyState(def.id, floor);

  // Elites might have adds
  const result: EnemyState[] = [enemy];
  const positions: GridPosition[] = [{ row: 1, col: 2 }];

  // 50% chance to have an add
  if (rng() > 0.5) {
    const actEnemies = Object.values(ENEMY_DEFS).filter(
      (e) => e.act === act && !e.isElite && !e.isBoss,
    );
    if (actEnemies.length > 0) {
      const add = actEnemies[Math.floor(rng() * actEnemies.length)];
      result.push(createEnemyState(add.id, floor));
      positions.push({ row: 0, col: 4 });
    }
  }

  return { enemies: result, positions };
}

/** Get the boss for a given act. */
export function getBossEncounter(
  act: ActId,
  floor: number,
): { enemies: EnemyState[]; positions: GridPosition[] } {
  const boss = Object.values(ENEMY_DEFS).find(
    (e) => e.act === act && e.isBoss,
  );
  if (!boss) throw new Error(`No boss for act: ${act}`);

  const enemy = createEnemyState(boss.id, floor);
  return {
    enemies: [enemy],
    positions: [{ row: boss.preferredRow ?? 1, col: 2 }],
  };
}

// ── Enemy AI: Intent Rolling ────────────────────────────────────────────────

export function rollIntent(
  enemy: EnemyState,
  rng: () => number,
): EnemyIntent {
  const def = getEnemyDef(enemy.defId);
  const hasArmor = def.abilities.some((a) => a.type === "armor");
  const hasEnrage = def.abilities.some((a) => a.type === "enrage");

  // Simple AI pattern: alternate between attack and defend, with special abilities mixed in
  const turn = enemy.turnsAlive;

  if (def.isBoss) {
    return rollBossIntent(enemy, def, turn, rng);
  }

  // Elites are more aggressive
  if (def.isElite) {
    if (turn % 3 === 0 && hasArmor) {
      const armorVal = def.abilities.find((a) => a.type === "armor")!.value;
      return { type: "defend", value: armorVal, label: `Shield ${armorVal}` };
    }
    const dmg = def.baseAttack + (hasEnrage ? turn * 2 : 0);
    return { type: "attack", value: dmg, label: `Attack for ${dmg}` };
  }

  // Regular enemies
  if (hasArmor && turn % 2 === 0) {
    const armorVal = def.abilities.find((a) => a.type === "armor")!.value;
    return { type: "defend", value: armorVal, label: `Shield ${armorVal}` };
  }

  const roll = rng();
  if (roll < 0.7) {
    const dmg = def.baseAttack + (hasEnrage ? Math.floor(turn * (def.abilities.find(a => a.type === "enrage")?.value ?? 0)) : 0);
    return { type: "attack", value: dmg, label: `Attack for ${dmg}` };
  } else if (roll < 0.85) {
    return { type: "defend", value: 4, label: "Shield 4" };
  } else {
    return { type: "buff", value: 2, label: "Strengthening" };
  }
}

function rollBossIntent(
  enemy: EnemyState,
  def: EnemyDef,
  turn: number,
  rng: () => number,
): EnemyIntent {
  const hpPercent = enemy.hp / enemy.maxHp;

  // Phase-based behavior
  if (hpPercent > 0.66) {
    // Phase 1: Standard attacks + occasional summon
    if (turn % 4 === 0) {
      return { type: "summon", value: 1, label: "Summoning..." };
    }
    if (turn % 3 === 0) {
      return { type: "defend", value: 8, label: "Shield 8" };
    }
    return { type: "attack", value: def.baseAttack, label: `Attack for ${def.baseAttack}` };
  } else if (hpPercent > 0.33) {
    // Phase 2: More aggressive
    if (turn % 5 === 0) {
      return { type: "summon", value: 1, label: "Summoning..." };
    }
    const dmg = Math.round(def.baseAttack * 1.5);
    if (rng() < 0.3) {
      return {
        type: "special",
        value: Math.round(def.baseAttack * 0.8),
        label: "AoE Attack incoming!",
        targetPattern: "all_enemies",
      };
    }
    return { type: "attack", value: dmg, label: `Attack for ${dmg}` };
  } else {
    // Phase 3: Enraged
    const dmg = def.baseAttack * 2;
    if (turn % 3 === 0) {
      return {
        type: "special",
        value: Math.round(def.baseAttack * 1.2),
        label: "Devastating AoE!",
        targetPattern: "all_enemies",
      };
    }
    return { type: "attack", value: dmg, label: `Attack for ${dmg}` };
  }
}

/** Execute an enemy's intent against the player. Returns damage dealt. */
export function executeIntent(
  enemy: EnemyState,
): { damage: number; shield: number; statusApplied?: ActiveStatus } {
  const def = getEnemyDef(enemy.defId);
  const intent = enemy.intent;

  switch (intent.type) {
    case "attack": {
      let dmg = intent.value;
      // Check weaken status
      const weaken = enemy.statusEffects.find((s) => s.type === "weaken");
      if (weaken) dmg = Math.max(0, dmg - weaken.stacks);
      return { damage: dmg, shield: 0 };
    }
    case "defend":
      return { damage: 0, shield: intent.value };
    case "buff":
      return {
        damage: 0,
        shield: 0,
        statusApplied: { type: "strengthen", stacks: intent.value, duration: 3 },
      };
    case "debuff":
      return {
        damage: 0,
        shield: 0,
        statusApplied: { type: "vulnerable", stacks: 1, duration: 2 },
      };
    case "special":
      return { damage: intent.value, shield: 0 };
    case "summon":
      return { damage: 0, shield: 0 };
    default:
      return { damage: 0, shield: 0 };
  }
}

/** Tick status effects at end of turn. Returns damage from poison/burn. */
export function tickEnemyStatuses(enemy: EnemyState): number {
  let tickDamage = 0;

  for (const status of enemy.statusEffects) {
    if (status.type === "burn") {
      tickDamage += status.stacks;
    }
    if (status.type === "poison") {
      tickDamage += status.stacks;
    }
    // Decrement duration
    if (status.duration > 0) {
      status.duration--;
    }
  }

  // Regen
  const regen = enemy.statusEffects.find((s) => s.type === "regen");
  if (regen) {
    enemy.hp = Math.min(enemy.maxHp, enemy.hp + regen.stacks);
  }

  // Remove expired statuses
  enemy.statusEffects = enemy.statusEffects.filter(
    (s) => s.duration !== 0,
  );

  return tickDamage;
}
