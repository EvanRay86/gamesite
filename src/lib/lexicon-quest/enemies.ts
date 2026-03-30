// Enemy definitions and AI for Lexicon Quest

import type {
  EnemyDef,
  EnemyState,
  EnemyIntent,
  ActId,
} from "@/types/lexicon-quest";

// ── Act 1: The Crypt ────────────────────────────────────────────────────────

const SKELETON: EnemyDef = {
  id: "skeleton",
  name: "Skeleton",
  emoji: "💀",
  maxHp: 18,
  baseAttack: 5,
  defense: 0,
  abilities: [],
  desc: "A rattling pile of bones. Basic but relentless.",
};

const RAT_SWARM: EnemyDef = {
  id: "rat-swarm",
  name: "Rat Swarm",
  emoji: "🐀",
  maxHp: 10,
  baseAttack: 3,
  defense: 0,
  abilities: [],
  desc: "A chittering wave of rats. Weak alone, dangerous in numbers.",
};

const ZOMBIE: EnemyDef = {
  id: "zombie",
  name: "Zombie",
  emoji: "🧟",
  maxHp: 28,
  baseAttack: 7,
  defense: 1,
  abilities: [{ type: "armor", value: 1, desc: "Tough flesh reduces damage by 1." }],
  desc: "Slow and durable. Shrugs off weak blows.",
};

const GHOST: EnemyDef = {
  id: "ghost",
  name: "Ghost",
  emoji: "👻",
  maxHp: 14,
  baseAttack: 6,
  defense: 0,
  abilities: [
    { type: "dodge_short", value: 4, desc: "Phases through words shorter than 4 letters." },
  ],
  desc: "Ethereal and evasive. Only long words can touch it.",
};

const SPIDER: EnemyDef = {
  id: "spider",
  name: "Giant Spider",
  emoji: "🕷️",
  maxHp: 16,
  baseAttack: 4,
  defense: 0,
  abilities: [
    { type: "curse_tile", value: 1, desc: "Venomous bite curses a random tile each turn." },
  ],
  desc: "Spins webs of venom across your letters.",
};

// Boss
const LICH_LORD: EnemyDef = {
  id: "lich-lord",
  name: "Lich Lord",
  emoji: "🧙‍♂️",
  maxHp: 70,
  baseAttack: 8,
  defense: 2,
  abilities: [
    { type: "steal_tile", value: 1, desc: "Steals a tile from your rack each turn." },
    { type: "regen", value: 3, desc: "Regenerates 3 HP each turn." },
  ],
  desc: "An ancient sorcerer who feeds on language itself.",
};

// ── Act 2: The Caverns ──────────────────────────────────────────────────────

const GOLEM: EnemyDef = {
  id: "golem",
  name: "Stone Golem",
  emoji: "🗿",
  maxHp: 40,
  baseAttack: 8,
  defense: 3,
  abilities: [
    { type: "armor", value: 3, desc: "Stone skin reduces all damage by 3." },
  ],
  desc: "Massive and armored. You'll need powerful words to crack it.",
};

const WRAITH: EnemyDef = {
  id: "wraith",
  name: "Wraith",
  emoji: "🌑",
  maxHp: 25,
  baseAttack: 9,
  defense: 0,
  abilities: [
    { type: "dodge_short", value: 5, desc: "Untouchable by words shorter than 5 letters." },
  ],
  desc: "A shadow that can only be harmed by words of substance.",
};

const BASILISK: EnemyDef = {
  id: "basilisk",
  name: "Basilisk",
  emoji: "🐍",
  maxHp: 30,
  baseAttack: 7,
  defense: 1,
  abilities: [
    { type: "curse_tile", value: 2, desc: "Petrifying gaze curses 2 tiles each turn." },
  ],
  desc: "Its gaze turns your letters to stone.",
};

const MIMIC: EnemyDef = {
  id: "mimic",
  name: "Mimic",
  emoji: "📦",
  maxHp: 22,
  baseAttack: 5,
  defense: 0,
  abilities: [
    { type: "reflect", value: 50, desc: "Reflects 50% of your last word's damage back at you." },
  ],
  desc: "Disguised as treasure. Throws your own words back at you.",
};

const DARK_ELF: EnemyDef = {
  id: "dark-elf",
  name: "Dark Elf",
  emoji: "🧝",
  maxHp: 26,
  baseAttack: 10,
  defense: 0,
  abilities: [
    { type: "burn_tile", value: 1, desc: "Burns a random tile, removing it from your rack." },
  ],
  desc: "Quick and cruel. Destroys your letters with dark magic.",
};

// Boss
const CRYSTAL_DRAGON: EnemyDef = {
  id: "crystal-dragon",
  name: "Crystal Dragon",
  emoji: "🐉",
  maxHp: 120,
  baseAttack: 12,
  defense: 3,
  abilities: [
    { type: "multi_phase", value: 2, desc: "Phase 1: Armored. Phase 2: Enraged (2x attack)." },
    { type: "armor", value: 3, desc: "Crystal scales reduce damage." },
  ],
  desc: "A beast of living crystal. Shatters into fury when wounded.",
};

// ── Act 3: The Abyss ────────────────────────────────────────────────────────

const DEMON: EnemyDef = {
  id: "demon",
  name: "Demon",
  emoji: "👿",
  maxHp: 35,
  baseAttack: 12,
  defense: 2,
  abilities: [
    { type: "burn_tile", value: 2, desc: "Hellfire burns 2 tiles from your rack." },
  ],
  desc: "Wreathed in flame, it incinerates your vocabulary.",
};

const MIND_FLAYER: EnemyDef = {
  id: "mind-flayer",
  name: "Mind Flayer",
  emoji: "🐙",
  maxHp: 30,
  baseAttack: 11,
  defense: 1,
  abilities: [
    { type: "scramble", value: 0, desc: "Scrambles all your tiles every 2 turns." },
  ],
  desc: "Reaches into your mind and scrambles your thoughts.",
};

const SHADOW: EnemyDef = {
  id: "shadow",
  name: "Shadow",
  emoji: "🕳️",
  maxHp: 24,
  baseAttack: 14,
  defense: 0,
  abilities: [
    { type: "dodge_short", value: 6, desc: "Only damaged by words of 6+ letters." },
  ],
  desc: "Near-invisible. Only the mightiest words can pierce its form.",
};

const DOPPELGANGER: EnemyDef = {
  id: "doppelganger",
  name: "Doppelganger",
  emoji: "🪞",
  maxHp: 35,
  baseAttack: 10,
  defense: 1,
  abilities: [
    { type: "reflect", value: 30, desc: "Reflects 30% of damage taken." },
    { type: "regen", value: 2, desc: "Regenerates 2 HP per turn." },
  ],
  desc: "A dark mirror of yourself. It learns from your attacks.",
};

// Boss
const WORD_EATER: EnemyDef = {
  id: "word-eater",
  name: "Word Eater",
  emoji: "🕸️",
  maxHp: 180,
  baseAttack: 15,
  defense: 2,
  abilities: [
    { type: "ban_letter", value: 1, desc: "Devours a letter each turn — words cannot contain it." },
    { type: "enrage", value: 2, desc: "Attack increases by 2 each turn." },
  ],
  desc: "The devourer of language. It consumes letters from existence itself.",
};

// ── Enemy pools by act ──────────────────────────────────────────────────────

const ACT_ENEMIES: Record<ActId, { normal: EnemyDef[]; elite: EnemyDef[] }> = {
  crypt: {
    normal: [SKELETON, RAT_SWARM, ZOMBIE, GHOST, SPIDER],
    elite: [ZOMBIE, GHOST],
  },
  caverns: {
    normal: [GOLEM, WRAITH, BASILISK, MIMIC, DARK_ELF],
    elite: [GOLEM, BASILISK],
  },
  abyss: {
    normal: [DEMON, MIND_FLAYER, SHADOW, DOPPELGANGER],
    elite: [DEMON, SHADOW],
  },
};

const ACT_BOSSES: Record<ActId, EnemyDef> = {
  crypt: LICH_LORD,
  caverns: CRYSTAL_DRAGON,
  abyss: WORD_EATER,
};

// ── Enemy scaling ───────────────────────────────────────────────────────────

function scaleEnemy(def: EnemyDef, floor: number): EnemyState {
  const hpScale = 1 + (floor - 1) * 0.12;
  const atkScale = 1 + (floor - 1) * 0.08;
  const maxHp = Math.round(def.maxHp * hpScale);

  return {
    def,
    hp: maxHp,
    maxHp,
    shield: 0,
    intent: { type: "attack", value: Math.round(def.baseAttack * atkScale), label: "Attack" },
    statusEffects: [],
  };
}

// ── Encounter generation ────────────────────────────────────────────────────

export function getEncounter(
  act: ActId,
  floor: number,
  isElite: boolean,
  rng: () => number,
): EnemyState[] {
  const pool = isElite ? ACT_ENEMIES[act].elite : ACT_ENEMIES[act].normal;

  if (isElite) {
    // 1 elite enemy, scaled up
    const def = pool[Math.floor(rng() * pool.length)];
    const enemy = scaleEnemy(def, floor);
    enemy.maxHp = Math.round(enemy.maxHp * 1.5);
    enemy.hp = enemy.maxHp;
    return [enemy];
  }

  // 1-3 normal enemies
  const count = rng() < 0.3 ? 1 : rng() < 0.7 ? 2 : 3;
  const enemies: EnemyState[] = [];
  for (let i = 0; i < count; i++) {
    const def = pool[Math.floor(rng() * pool.length)];
    enemies.push(scaleEnemy(def, floor));
  }
  return enemies;
}

export function getBoss(act: ActId, floor: number): EnemyState {
  const def = ACT_BOSSES[act];
  const boss = scaleEnemy(def, floor);
  if (def.abilities.some((a) => a.type === "multi_phase")) {
    boss.phase = 1;
  }
  return boss;
}

// ── Enemy intent AI ─────────────────────────────────────────────────────────

export function rollEnemyIntent(
  enemy: EnemyState,
  turn: number,
  rng: () => number,
): EnemyIntent {
  const atk = Math.round(
    enemy.def.baseAttack * (1 + (turn - 1) * 0.05),
  );

  // Bosses have more complex patterns
  if (enemy.def.id === "lich-lord") {
    if (turn % 3 === 0) return { type: "special", value: 0, label: "Steal Tile" };
    if (turn % 3 === 1) return { type: "attack", value: atk, label: `Attack ${atk}` };
    return { type: "defend", value: 5, label: "Shield +5" };
  }

  if (enemy.def.id === "crystal-dragon") {
    if (enemy.phase === 2) {
      return { type: "attack", value: atk * 2, label: `Enraged ${atk * 2}` };
    }
    if (turn % 2 === 0) return { type: "defend", value: 8, label: "Shield +8" };
    return { type: "attack", value: atk, label: `Attack ${atk}` };
  }

  if (enemy.def.id === "word-eater") {
    if (turn % 2 === 0) return { type: "special", value: 0, label: "Ban Letter" };
    return { type: "attack", value: atk + turn * 2, label: `Attack ${atk + turn * 2}` };
  }

  // Normal enemies: mostly attack, sometimes defend
  if (rng() < 0.2 && enemy.def.defense > 0) {
    return { type: "defend", value: 3 + Math.floor(rng() * 4), label: "Defend" };
  }

  return { type: "attack", value: atk, label: `Attack ${atk}` };
}

// ── Execute enemy abilities ─────────────────────────────────────────────────

export interface EnemyTurnResult {
  damage: number;
  shieldGained: number;
  tileStolen: boolean;
  tileBurned: boolean;
  tilesCursed: number;
  tilesScrambled: boolean;
  letterBanned: string | null;
  hpRegenned: number;
  reflectDamage: number;
}

export function executeEnemyTurn(
  enemy: EnemyState,
  turn: number,
): EnemyTurnResult {
  const result: EnemyTurnResult = {
    damage: 0,
    shieldGained: 0,
    tileStolen: false,
    tileBurned: false,
    tilesCursed: 0,
    tilesScrambled: false,
    letterBanned: null,
    hpRegenned: 0,
    reflectDamage: 0,
  };

  // Execute intent
  const intent = enemy.intent;
  if (intent.type === "attack") {
    result.damage = intent.value;
  } else if (intent.type === "defend") {
    result.shieldGained = intent.value;
    enemy.shield += intent.value;
  } else if (intent.type === "special") {
    if (enemy.def.id === "lich-lord") result.tileStolen = true;
    if (enemy.def.id === "word-eater") {
      // Ban a random common letter
      const bannable = "ETAOINSRHLD";
      result.letterBanned = bannable[turn % bannable.length];
    }
  }

  // Passive abilities
  for (const ability of enemy.def.abilities) {
    if (ability.type === "regen") {
      const heal = ability.value;
      enemy.hp = Math.min(enemy.maxHp, enemy.hp + heal);
      result.hpRegenned = heal;
    }
    if (ability.type === "curse_tile") {
      result.tilesCursed = ability.value;
    }
    if (ability.type === "burn_tile" && turn % 2 === 0) {
      result.tileBurned = true;
    }
    if (ability.type === "scramble" && turn % 2 === 0) {
      result.tilesScrambled = true;
    }
  }

  return result;
}

// ── Damage application ──────────────────────────────────────────────────────

export function applyDamageToEnemy(
  enemy: EnemyState,
  damage: number,
  wordLength: number,
): { actualDamage: number; reflected: number; dodged: boolean } {
  // Check dodge abilities
  for (const ability of enemy.def.abilities) {
    if (ability.type === "dodge_short" && wordLength < ability.value) {
      return { actualDamage: 0, reflected: 0, dodged: true };
    }
  }

  // Apply shield first
  let remaining = damage;
  if (enemy.shield > 0) {
    const absorbed = Math.min(enemy.shield, remaining);
    enemy.shield -= absorbed;
    remaining -= absorbed;
  }

  // Apply armor
  const armor = enemy.def.abilities
    .filter((a) => a.type === "armor")
    .reduce((sum, a) => sum + a.value, 0);
  remaining = Math.max(0, remaining - armor);

  // Apply damage
  enemy.hp = Math.max(0, enemy.hp - remaining);

  // Check reflect
  let reflected = 0;
  for (const ability of enemy.def.abilities) {
    if (ability.type === "reflect") {
      reflected = Math.round(damage * (ability.value / 100));
    }
  }

  // Check phase transition
  if (
    enemy.phase === 1 &&
    enemy.hp <= enemy.maxHp * 0.5 &&
    enemy.def.abilities.some((a) => a.type === "multi_phase")
  ) {
    enemy.phase = 2;
    enemy.shield = 0;
  }

  return { actualDamage: remaining, reflected, dodged: false };
}

// ── All enemy defs (for lookup) ─────────────────────────────────────────────

export const ALL_ENEMY_DEFS: EnemyDef[] = [
  SKELETON, RAT_SWARM, ZOMBIE, GHOST, SPIDER,
  GOLEM, WRAITH, BASILISK, MIMIC, DARK_ELF,
  DEMON, MIND_FLAYER, SHADOW, DOPPELGANGER,
  LICH_LORD, CRYSTAL_DRAGON, WORD_EATER,
];
