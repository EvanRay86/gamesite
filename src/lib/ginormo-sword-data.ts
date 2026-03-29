// Ginormo Sword – Game Types & Constants

// ── Area definitions ────────────────────────────────────────────────────────

export interface AreaDef {
  name: string;
  bg: string;          // CSS colour for the ground
  sky: string;         // CSS colour for the sky
  enemies: EnemyTemplate[];
  unlockCost: number;  // gold to unlock (0 = starting area)
}

export interface EnemyTemplate {
  name: string;
  color: string;
  hp: number;
  attack: number;
  speed: number;
  gold: number;
  size: number;        // radius
  xpReward: number;
}

export interface Enemy {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  attack: number;
  speed: number;
  gold: number;
  size: number;
  color: string;
  name: string;
  xpReward: number;
  knockbackX: number;
  knockbackY: number;
  flashTimer: number;
  dead: boolean;
  deathTimer: number;
}

export interface GoldDrop {
  x: number;
  y: number;
  amount: number;
  vy: number;
  life: number;
}

export interface DamageNumber {
  x: number;
  y: number;
  amount: number;
  life: number;
  color: string;
}

export interface PlayerStats {
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  swordLength: number;
  swordWidth: number;
  critChance: number;
  hpRegen: number;
}

export interface PlayerState {
  x: number;
  y: number;
  hp: number;
  gold: number;
  xp: number;
  level: number;
  facing: number;       // angle in radians
  swinging: boolean;
  swingAngle: number;
  swingDir: number;
  invincibleTimer: number;
  stats: PlayerStats;
}

export interface UpgradeDef {
  key: keyof PlayerStats;
  name: string;
  description: string;
  baseCost: number;
  costScale: number;
  maxLevel: number;
  perLevel: number;
}

// ── Constants ───────────────────────────────────────────────────────────────

export const CANVAS_W = 800;
export const CANVAS_H = 500;
export const GROUND_Y = 380;
export const SWING_SPEED = 12;          // radians/sec
export const SWING_ARC = Math.PI * 1.4; // sweep arc
export const SPAWN_INTERVAL = 1.2;      // seconds
export const MAX_ENEMIES = 12;
export const XP_PER_LEVEL = 50;         // scales with level
export const HP_PER_LEVEL = 5;

export const BASE_STATS: PlayerStats = {
  maxHp: 30,
  attack: 5,
  defense: 1,
  speed: 160,
  swordLength: 40,
  swordWidth: 6,
  critChance: 0.05,
  hpRegen: 0.5,
};

export const UPGRADES: UpgradeDef[] = [
  { key: "swordLength", name: "Blade Length",  description: "+12 px reach",        baseCost: 15,  costScale: 1.55, maxLevel: 60, perLevel: 12 },
  { key: "swordWidth",  name: "Blade Width",   description: "+3 px thickness",     baseCost: 12,  costScale: 1.5,  maxLevel: 40, perLevel: 3 },
  { key: "attack",      name: "Attack Power",  description: "+3 damage",           baseCost: 20,  costScale: 1.6,  maxLevel: 50, perLevel: 3 },
  { key: "defense",     name: "Defense",        description: "+2 damage reduction", baseCost: 25,  costScale: 1.6,  maxLevel: 30, perLevel: 2 },
  { key: "speed",       name: "Move Speed",     description: "+15 speed",           baseCost: 18,  costScale: 1.5,  maxLevel: 20, perLevel: 15 },
  { key: "maxHp",       name: "Max HP",         description: "+10 health",          baseCost: 20,  costScale: 1.45, maxLevel: 40, perLevel: 10 },
  { key: "critChance",  name: "Crit Chance",    description: "+3% crit",            baseCost: 30,  costScale: 1.7,  maxLevel: 15, perLevel: 0.03 },
  { key: "hpRegen",     name: "HP Regen",       description: "+0.4 hp/sec",         baseCost: 22,  costScale: 1.55, maxLevel: 20, perLevel: 0.4 },
];

export const AREAS: AreaDef[] = [
  {
    name: "Green Meadow",
    bg: "#4a7c3f",
    sky: "#87CEEB",
    unlockCost: 0,
    enemies: [
      { name: "Slime",      color: "#5cb85c", hp: 10, attack: 3, speed: 30,  gold: 2,  size: 14, xpReward: 5 },
      { name: "Rat",        color: "#8B7355", hp: 8,  attack: 4, speed: 55,  gold: 3,  size: 10, xpReward: 4 },
    ],
  },
  {
    name: "Dark Forest",
    bg: "#2d5a27",
    sky: "#5a7a8a",
    unlockCost: 100,
    enemies: [
      { name: "Wolf",       color: "#696969", hp: 25, attack: 8,  speed: 65,  gold: 6,  size: 16, xpReward: 10 },
      { name: "Goblin",     color: "#3d8b37", hp: 20, attack: 10, speed: 50,  gold: 8,  size: 13, xpReward: 8 },
      { name: "Bat",        color: "#4a3060", hp: 12, attack: 5,  speed: 80,  gold: 5,  size: 10, xpReward: 6 },
    ],
  },
  {
    name: "Scorched Desert",
    bg: "#c2a645",
    sky: "#e8c87a",
    unlockCost: 500,
    enemies: [
      { name: "Scorpion",   color: "#8B4513", hp: 40, attack: 14, speed: 45,  gold: 12, size: 15, xpReward: 15 },
      { name: "Sand Golem", color: "#d4a843", hp: 70, attack: 18, speed: 25,  gold: 20, size: 22, xpReward: 25 },
      { name: "Vulture",    color: "#555",    hp: 30, attack: 11, speed: 70,  gold: 10, size: 12, xpReward: 12 },
    ],
  },
  {
    name: "Frozen Peaks",
    bg: "#a0b8c8",
    sky: "#c8dce8",
    unlockCost: 2000,
    enemies: [
      { name: "Ice Wolf",   color: "#b0d0e8", hp: 60,  attack: 20, speed: 60,  gold: 18, size: 18, xpReward: 22 },
      { name: "Frost Giant", color: "#7090b0", hp: 120, attack: 30, speed: 20,  gold: 40, size: 28, xpReward: 40 },
      { name: "Snow Imp",   color: "#d0e8f0", hp: 35,  attack: 15, speed: 85,  gold: 14, size: 11, xpReward: 16 },
    ],
  },
  {
    name: "Volcanic Rift",
    bg: "#5a2020",
    sky: "#2a1010",
    unlockCost: 8000,
    enemies: [
      { name: "Fire Elemental", color: "#ff4500", hp: 100, attack: 35, speed: 50,  gold: 30, size: 20, xpReward: 35 },
      { name: "Lava Wyrm",     color: "#cc3300", hp: 180, attack: 45, speed: 30,  gold: 60, size: 26, xpReward: 55 },
      { name: "Ash Demon",     color: "#3a0a0a", hp: 150, attack: 40, speed: 55,  gold: 50, size: 22, xpReward: 45 },
    ],
  },
  {
    name: "Abyssal Realm",
    bg: "#1a0a2e",
    sky: "#0a0015",
    unlockCost: 30000,
    enemies: [
      { name: "Void Walker",  color: "#6a0dad", hp: 200, attack: 55, speed: 60,  gold: 80,  size: 22, xpReward: 65 },
      { name: "Shadow Lord",  color: "#2d0050", hp: 350, attack: 70, speed: 35,  gold: 150, size: 30, xpReward: 100 },
      { name: "Soul Eater",   color: "#8b00ff", hp: 250, attack: 60, speed: 70,  gold: 100, size: 20, xpReward: 80 },
    ],
  },
];

// Helper: XP needed for a given level
export function xpForLevel(level: number): number {
  return Math.floor(XP_PER_LEVEL * Math.pow(1.15, level - 1));
}

// Helper: upgrade cost at a given purchased count
export function upgradeCost(def: UpgradeDef, purchased: number): number {
  return Math.floor(def.baseCost * Math.pow(def.costScale, purchased));
}
