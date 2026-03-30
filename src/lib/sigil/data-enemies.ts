// ── SIGIL: Enemy Definitions ────────────────────────────────────────────────

import type { Enemy, EnemyIntentType, Element } from "./types";
import { mulberry32 } from "./data-runes";

let _eid = 0;
function eid() { return `enemy_${++_eid}`; }

interface EnemyTemplate {
  name: string;
  emoji: string;
  baseHp: number;
  element: Element;
  intentPattern: EnemyIntentType[];
  damageScale: number;
  isBoss?: boolean;
  isElite?: boolean;
}

// ── Act 1 Enemies ────────────────────────────────────────────────────────────

const ACT1_NORMALS: EnemyTemplate[] = [
  { name: "Ember Wisp", emoji: "🔥", baseHp: 22, element: "ignis", intentPattern: ["attack", "attack", "defend"], damageScale: 1 },
  { name: "Frost Sprite", emoji: "❄️", baseHp: 26, element: "glacius", intentPattern: ["defend", "attack", "attack"], damageScale: 1 },
  { name: "Spark Beetle", emoji: "⚡", baseHp: 18, element: "voltis", intentPattern: ["attack", "attack", "buff"], damageScale: 1 },
  { name: "Shade Rat", emoji: "🐀", baseHp: 15, element: "umbra", intentPattern: ["attack", "debuff", "attack"], damageScale: 0.9 },
  { name: "Crystal Slime", emoji: "🟣", baseHp: 30, element: "arcana", intentPattern: ["defend", "defend", "attack"], damageScale: 1.1 },
  { name: "Mushroom Guard", emoji: "🍄", baseHp: 28, element: "umbra", intentPattern: ["defend", "attack", "debuff"], damageScale: 1 },
  { name: "Imp", emoji: "👹", baseHp: 20, element: "ignis", intentPattern: ["attack", "buff", "attack", "attack"], damageScale: 0.9 },
];

const ACT1_ELITES: EnemyTemplate[] = [
  { name: "Flame Knight", emoji: "🗡️", baseHp: 52, element: "ignis", intentPattern: ["buff", "attack", "attack", "defend"], damageScale: 1.4, isElite: true },
  { name: "Frost Golem", emoji: "🧊", baseHp: 65, element: "glacius", intentPattern: ["defend", "defend", "attack", "attack"], damageScale: 1.5, isElite: true },
];

const ACT1_BOSS: EnemyTemplate = {
  name: "The Ember Lord", emoji: "👑", baseHp: 90, element: "ignis",
  intentPattern: ["buff", "attack", "attack", "debuff", "attack", "attack"],
  damageScale: 1.6, isBoss: true,
};

// ── Act 2 Enemies ────────────────────────────────────────────────────────────

const ACT2_NORMALS: EnemyTemplate[] = [
  { name: "Storm Elemental", emoji: "🌩️", baseHp: 35, element: "voltis", intentPattern: ["attack", "buff", "attack"], damageScale: 1.2 },
  { name: "Shadow Stalker", emoji: "👤", baseHp: 30, element: "umbra", intentPattern: ["debuff", "attack", "attack", "attack"], damageScale: 1.2 },
  { name: "Arcane Golem", emoji: "🤖", baseHp: 45, element: "arcana", intentPattern: ["defend", "attack", "buff", "attack"], damageScale: 1.3 },
  { name: "Magma Wyrm", emoji: "🐉", baseHp: 38, element: "ignis", intentPattern: ["attack", "attack", "buff", "attack"], damageScale: 1.3 },
  { name: "Ice Wraith", emoji: "👻", baseHp: 32, element: "glacius", intentPattern: ["attack", "debuff", "attack"], damageScale: 1.2 },
  { name: "Void Moth", emoji: "🦋", baseHp: 28, element: "umbra", intentPattern: ["debuff", "debuff", "attack", "attack"], damageScale: 1.1 },
];

const ACT2_ELITES: EnemyTemplate[] = [
  { name: "Thunder Drake", emoji: "⚡", baseHp: 80, element: "voltis", intentPattern: ["buff", "attack", "attack", "buff", "attack"], damageScale: 1.6, isElite: true },
  { name: "Void Sentinel", emoji: "🛡️", baseHp: 95, element: "umbra", intentPattern: ["defend", "debuff", "attack", "attack", "defend"], damageScale: 1.5, isElite: true },
];

const ACT2_BOSS: EnemyTemplate = {
  name: "The Storm Weaver", emoji: "🌀", baseHp: 140, element: "voltis",
  intentPattern: ["buff", "attack", "debuff", "attack", "attack", "buff", "attack"],
  damageScale: 1.8, isBoss: true,
};

// ── Act 3 Enemies ────────────────────────────────────────────────────────────

const ACT3_NORMALS: EnemyTemplate[] = [
  { name: "Rift Walker", emoji: "🌌", baseHp: 45, element: "arcana", intentPattern: ["buff", "attack", "attack", "debuff"], damageScale: 1.5 },
  { name: "Doom Specter", emoji: "💀", baseHp: 40, element: "umbra", intentPattern: ["debuff", "attack", "attack", "attack"], damageScale: 1.5 },
  { name: "Inferno Titan", emoji: "🔥", baseHp: 55, element: "ignis", intentPattern: ["buff", "attack", "attack", "attack"], damageScale: 1.6 },
  { name: "Chrono Beast", emoji: "⏳", baseHp: 50, element: "arcana", intentPattern: ["defend", "buff", "attack", "attack", "attack"], damageScale: 1.5 },
  { name: "Glacier Wyrm", emoji: "🐲", baseHp: 60, element: "glacius", intentPattern: ["defend", "attack", "attack", "buff", "attack"], damageScale: 1.6 },
];

const ACT3_ELITES: EnemyTemplate[] = [
  { name: "Abyssal Knight", emoji: "⚔️", baseHp: 120, element: "umbra", intentPattern: ["buff", "attack", "debuff", "attack", "attack", "defend"], damageScale: 1.8, isElite: true },
  { name: "Prismatic Dragon", emoji: "🐉", baseHp: 130, element: "arcana", intentPattern: ["buff", "buff", "attack", "attack", "attack", "debuff"], damageScale: 1.9, isElite: true },
];

const ACT3_BOSS: EnemyTemplate = {
  name: "The Void Sovereign", emoji: "🕳️", baseHp: 200, element: "umbra",
  intentPattern: ["buff", "debuff", "attack", "attack", "buff", "attack", "attack", "debuff"],
  damageScale: 2.0, isBoss: true,
};

// ── Factory ──────────────────────────────────────────────────────────────────

function intentForType(type: EnemyIntentType, scale: number, turnNumber: number): { type: EnemyIntentType; value: number; description: string } {
  const base = 5 + Math.floor(turnNumber * 0.5);
  switch (type) {
    case "attack":
      return { type, value: Math.floor(base * scale), description: `Attack for ${Math.floor(base * scale)}` };
    case "defend":
      return { type, value: Math.floor((base + 2) * scale * 0.8), description: `Gain ${Math.floor((base + 2) * scale * 0.8)} Block` };
    case "buff":
      return { type, value: 2, description: "Gain 2 Strength" };
    case "debuff":
      return { type, value: 1, description: "Apply 1 Weak" };
    case "summon":
      return { type, value: 1, description: "Summon an ally" };
  }
}

function createEnemy(template: EnemyTemplate, ascension: number): Enemy {
  const hpScale = 1 + ascension * 0.05;
  const maxHp = Math.floor(template.baseHp * hpScale);
  const intent = intentForType(template.intentPattern[0], template.damageScale, 0);
  return {
    id: eid(),
    name: template.name,
    emoji: template.emoji,
    maxHp,
    hp: maxHp,
    element: template.element,
    intent,
    statuses: [],
    intentPattern: template.intentPattern,
    intentIndex: 0,
    damageScale: template.damageScale,
    isBoss: template.isBoss,
    isElite: template.isElite,
  };
}

export function spawnCombatEnemies(act: number, nodeType: "combat" | "elite" | "boss", seed: number, ascension: number): Enemy[] {
  const rng = mulberry32(seed);

  if (nodeType === "boss") {
    const boss = act === 1 ? ACT1_BOSS : act === 2 ? ACT2_BOSS : ACT3_BOSS;
    return [createEnemy(boss, ascension)];
  }

  if (nodeType === "elite") {
    const pool = act === 1 ? ACT1_ELITES : act === 2 ? ACT2_ELITES : ACT3_ELITES;
    const elite = pool[Math.floor(rng() * pool.length)];
    return [createEnemy(elite, ascension)];
  }

  // Normal combat: 1-3 enemies
  const pool = act === 1 ? ACT1_NORMALS : act === 2 ? ACT2_NORMALS : ACT3_NORMALS;
  const count = Math.floor(rng() * 2) + 1; // 1-2 enemies
  const enemies: Enemy[] = [];
  for (let i = 0; i < count; i++) {
    const template = pool[Math.floor(rng() * pool.length)];
    enemies.push(createEnemy(template, ascension));
  }
  return enemies;
}

export function advanceEnemyIntent(enemy: Enemy, turnNumber: number): Enemy {
  const nextIdx = (enemy.intentIndex + 1) % enemy.intentPattern.length;
  const nextType = enemy.intentPattern[nextIdx];
  const intent = intentForType(nextType, enemy.damageScale, turnNumber);
  // Apply strength bonus to attacks
  const str = enemy.statuses.find(s => s.type === "strength");
  if (intent.type === "attack" && str) {
    intent.value += str.stacks;
    intent.description = `Attack for ${intent.value}`;
  }
  return { ...enemy, intentIndex: nextIdx, intent };
}

export function getAllEnemyTemplateNames(): string[] {
  const all = [
    ...ACT1_NORMALS, ...ACT1_ELITES, ACT1_BOSS,
    ...ACT2_NORMALS, ...ACT2_ELITES, ACT2_BOSS,
    ...ACT3_NORMALS, ...ACT3_ELITES, ACT3_BOSS,
  ];
  return all.map(e => e.name);
}
