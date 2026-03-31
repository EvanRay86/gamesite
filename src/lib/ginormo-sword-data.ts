// Ginormo Sword – Game Types & Constants

// ── Utility functions ─────────────────────────────────────────────────────

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function dist(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

export function randRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
}

export function darkenColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, Math.floor(((num >> 16) & 0xff) * (1 - amount)));
  const g = Math.max(0, Math.floor(((num >> 8) & 0xff) * (1 - amount)));
  const b = Math.max(0, Math.floor((num & 0xff) * (1 - amount)));
  return `rgb(${r},${g},${b})`;
}

export function lineCircleIntersect(
  x1: number, y1: number, x2: number, y2: number,
  cx: number, cy: number, r: number, lineWidth?: number,
): boolean {
  if (lineWidth) r += lineWidth / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const fx = x1 - cx;
  const fy = y1 - cy;
  const a = dx * dx + dy * dy;
  const b = 2 * (fx * dx + fy * dy);
  const c = fx * fx + fy * fy - r * r;
  let disc = b * b - 4 * a * c;
  if (disc < 0) return false;
  disc = Math.sqrt(disc);
  const t1 = (-b - disc) / (2 * a);
  const t2 = (-b + disc) / (2 * a);
  return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1);
}

// ── Game screen states ────────────────────────────────────────────────────

export type GameScreen = "title" | "overworld" | "combat" | "shop" | "zone-transition" | "gameover";

// ── Camera ────────────────────────────────────────────────────────────────

export interface Camera {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
}

// ── Combat State ──────────────────────────────────────────────────────────

export interface CombatState {
  zone: CombatZone;
  currentWave: number;
  waveEnemiesSpawned: number;
  waveEnemiesKilled: number;
  waveEnemiesTotal: number;
  waveClearDelay: number;
  bossSpawned: boolean;
  zoneComplete: boolean;
  retreating: boolean;
}

// ── Combat Zone ───────────────────────────────────────────────────────────

export interface CombatZone {
  id: string;
  regionId: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  enemyPool: EnemyTemplate[];
  waveCount: number;
  enemiesPerWave: number;
  miniBoss?: EnemyTemplate;
  boss?: BossDef;
  isBossZone: boolean;
  recommendedLevel: number;
  completionReward: { gold: number; xp: number };
  arenaColor: string;
}

// ── Decoration & World Region ─────────────────────────────────────────────

export interface Decoration {
  type: "tree" | "bush" | "mushroom" | "rock" | "cactus" | "ruin" | "pillar" | "ice_crystal" | "lava_pool";
  x: number;
  y: number;
  size: number;
  color: string;
}

export interface WorldRegion {
  id: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  groundColor: string;
  accentColor: string;
  decorations: Decoration[];
  blockers: unknown[];
  unlockBoss: string | null;
}

// ── Town markers ──────────────────────────────────────────────────────────

export interface TownMarker {
  regionId: string;
  x: number;
  y: number;
  name: string;
}

// ── Shape types for enemy visuals ──────────────────────────────────────────

export type EnemyShape = "slime" | "beast" | "humanoid" | "flying" | "serpent" | "golem" | "elemental" | "demon";

// ── Area definitions ────────────────────────────────────────────────────────

export interface AreaDef {
  name: string;
  bg: string;
  sky: string;
  enemies: EnemyTemplate[];
  unlockCost: number;
  boss: BossDef;
}

export interface EnemyTemplate {
  name: string;
  color: string;
  hp: number;
  attack: number;
  speed: number;
  gold: number;
  size: number;
  xpReward: number;
  shape: EnemyShape;
  behavior?: string;
  projectileColor?: string;
  projectileSpeed?: number;
  projectileDamage?: number;
  chargeSpeed?: number;
  summonName?: string;
  healAmount?: number;
  teleportInterval?: number;
}

export type BossAttack = "charge" | "projectile" | "aoe" | "summon";

export interface BossDef {
  name: string;
  title?: string;
  color: string;
  accentColor: string;
  hp: number;
  attack: number;
  speed: number;
  gold: number;
  size: number;
  xpReward: number;
  shape: EnemyShape;
  killsToSpawn?: number;
  attacks: BossAttack[];
  attackInterval: number;
  enragedInterval: number;
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
  shape: EnemyShape;
  behavior?: string;
  isBoss: boolean;
  bossAttackTimer: number;
  accentColor: string;
  animTimer: number;
  slowTimer: number;
  burnTimer: number;
  burnDamage: number;
  behaviorTimer: number;
  behaviorState: string;
  projectileColor?: string;
  projectileSpeed?: number;
  projectileDamage?: number;
  chargeSpeed?: number;
  chargeDirX?: number;
  chargeDirY?: number;
  summonName?: string;
  healAmount?: number;
  teleportInterval?: number;
  title?: string;
}

export interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  damage: number;
  color: string;
  life: number;
  fromEnemy?: boolean;
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

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: "spark" | "death" | "trail" | "blood";
}

export interface BossTemplate extends EnemyTemplate {
  isBoss: true;
  title: string;
}

export interface SaveData {
  gold: number;
  xp?: number;
  level?: number;
  upgradeLevels: number[];
  unlockedAreas: boolean[];
  clearedZones?: string[];
  defeatedBosses?: string[];
  totalKills: number;
  highestCombo: number;
  overworldX?: number;
  overworldY?: number;
  totalPlayTime?: number;
  lastTown?: string;
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
  facing: number;
  swinging: boolean;
  swingAngle: number;
  swingDir: number;
  invincibleTimer: number;
  stats: PlayerStats;
  charging: boolean;
  chargeTime: number;
  chargedRelease: boolean;
  dashTimer: number;
  dashCooldown: number;
  dashDirX: number;
  dashDirY: number;
  whirlwindTimer: number;
  whirlwindCooldown: number;
  warcryCooldown: number;
  attackBuff: number;
  attackBuffTimer: number;
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

export interface SwordTypeDef {
  name: string;
  color1: string;
  color2: string;
  glowColor: string;
  particleColor: string;
  cost: number;
  description: string;
}

export interface AbilityDef {
  key: string;
  name: string;
  description: string;
  cooldown: number;
  cost: number;
  hotkey: string;
}

// ── Constants ───────────────────────────────────────────────────────────────

export const CANVAS_W = 800;
export const CANVAS_H = 500;
export const GROUND_Y = 380;
export const SWING_SPEED = 12;
export const SWING_ARC = Math.PI * 1.4;
export const SPAWN_INTERVAL = 1.2;
export const MAX_ENEMIES = 12;
export const XP_PER_LEVEL = 50;
export const HP_PER_LEVEL = 5;

export const DASH_SPEED = 600;
export const DASH_DURATION = 0.15;
export const DASH_COOLDOWN = 1.5;
export const CHARGE_TIME_NEEDED = 0.5;
export const CHARGE_DAMAGE_MULT = 2.5;
export const CHARGE_ARC_MULT = 1.6;
export const WHIRLWIND_DURATION = 0.6;

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

export const SWORD_TYPES: SwordTypeDef[] = [
  { name: "Steel Sword",   color1: "#a0a0a0", color2: "#ffffff", glowColor: "rgba(255,255,255,0.15)", particleColor: "#cccccc", cost: 0,     description: "Standard blade" },
  { name: "Flame Blade",   color1: "#ff4500", color2: "#ffaa00", glowColor: "rgba(255,100,0,0.4)",    particleColor: "#ff6600", cost: 500,   description: "Burns enemies" },
  { name: "Frost Edge",    color1: "#4488ff", color2: "#aaddff", glowColor: "rgba(100,180,255,0.4)",  particleColor: "#88ccff", cost: 500,   description: "Slows enemies" },
  { name: "Thunder Fang",  color1: "#ffee00", color2: "#ffffff", glowColor: "rgba(255,238,0,0.5)",    particleColor: "#ffff88", cost: 1000,  description: "Chain lightning on crit" },
  { name: "Void Cleaver",  color1: "#8800ff", color2: "#cc44ff", glowColor: "rgba(136,0,255,0.5)",    particleColor: "#aa44ff", cost: 5000,  description: "Heals on hit" },
  { name: "Abyssal Edge",  color1: "#220044", color2: "#ff00ff", glowColor: "rgba(255,0,255,0.6)",    particleColor: "#ff44ff", cost: 20000, description: "Ultimate blade" },
];

export const ABILITIES: AbilityDef[] = [
  { key: "whirlwind", name: "Whirlwind", description: "360° spin attack",              cooldown: 8,  cost: 800,  hotkey: "Q" },
  { key: "warcry",    name: "War Cry",   description: "Knockback all + ATK boost (5s)", cooldown: 15, cost: 1500, hotkey: "R" },
];

export const AREAS: AreaDef[] = [
  {
    name: "Green Meadow",
    bg: "#4a7c3f",
    sky: "#87CEEB",
    unlockCost: 0,
    enemies: [
      { name: "Slime",      color: "#5cb85c", hp: 10, attack: 3, speed: 30,  gold: 2,  size: 14, xpReward: 5,  shape: "slime" },
      { name: "Rat",        color: "#8B7355", hp: 8,  attack: 4, speed: 55,  gold: 3,  size: 10, xpReward: 4,  shape: "beast" },
    ],
    boss: {
      name: "King Slime",
      color: "#2ecc40",
      accentColor: "#FFD700",
      hp: 150,
      attack: 8,
      speed: 35,
      gold: 80,
      size: 36,
      xpReward: 60,
      shape: "slime",
      killsToSpawn: 20,
      attacks: ["charge", "summon"],
      attackInterval: 3,
      enragedInterval: 1.8,
    },
  },
  {
    name: "Dark Forest",
    bg: "#2d5a27",
    sky: "#5a7a8a",
    unlockCost: 100,
    enemies: [
      { name: "Wolf",       color: "#696969", hp: 25, attack: 8,  speed: 65,  gold: 6,  size: 16, xpReward: 10, shape: "beast" },
      { name: "Goblin",     color: "#3d8b37", hp: 20, attack: 10, speed: 50,  gold: 8,  size: 13, xpReward: 8,  shape: "humanoid" },
      { name: "Bat",        color: "#4a3060", hp: 12, attack: 5,  speed: 80,  gold: 5,  size: 10, xpReward: 6,  shape: "flying" },
    ],
    boss: {
      name: "Ancient Treant",
      color: "#4a3520",
      accentColor: "#5cb85c",
      hp: 400,
      attack: 18,
      speed: 18,
      gold: 200,
      size: 40,
      xpReward: 120,
      shape: "golem",
      killsToSpawn: 25,
      attacks: ["aoe", "summon"],
      attackInterval: 3.5,
      enragedInterval: 2,
    },
  },
  {
    name: "Scorched Desert",
    bg: "#c2a645",
    sky: "#e8c87a",
    unlockCost: 500,
    enemies: [
      { name: "Scorpion",   color: "#8B4513", hp: 40, attack: 14, speed: 45,  gold: 12, size: 15, xpReward: 15, shape: "beast" },
      { name: "Sand Golem", color: "#d4a843", hp: 70, attack: 18, speed: 25,  gold: 20, size: 22, xpReward: 25, shape: "golem" },
      { name: "Vulture",    color: "#555",    hp: 30, attack: 11, speed: 70,  gold: 10, size: 12, xpReward: 12, shape: "flying" },
    ],
    boss: {
      name: "Sand Wyrm",
      color: "#c4a035",
      accentColor: "#ff6600",
      hp: 800,
      attack: 30,
      speed: 55,
      gold: 500,
      size: 35,
      xpReward: 200,
      shape: "serpent",
      killsToSpawn: 30,
      attacks: ["charge", "projectile"],
      attackInterval: 2.5,
      enragedInterval: 1.5,
    },
  },
  {
    name: "Frozen Peaks",
    bg: "#a0b8c8",
    sky: "#c8dce8",
    unlockCost: 2000,
    enemies: [
      { name: "Ice Wolf",    color: "#b0d0e8", hp: 60,  attack: 20, speed: 60,  gold: 18, size: 18, xpReward: 22, shape: "beast" },
      { name: "Frost Giant",  color: "#7090b0", hp: 120, attack: 30, speed: 20,  gold: 40, size: 28, xpReward: 40, shape: "golem" },
      { name: "Snow Imp",    color: "#d0e8f0", hp: 35,  attack: 15, speed: 85,  gold: 14, size: 11, xpReward: 16, shape: "humanoid" },
    ],
    boss: {
      name: "Frost Dragon",
      color: "#6090cc",
      accentColor: "#aaddff",
      hp: 1500,
      attack: 40,
      speed: 45,
      gold: 1000,
      size: 42,
      xpReward: 350,
      shape: "flying",
      killsToSpawn: 30,
      attacks: ["projectile", "charge", "aoe"],
      attackInterval: 2.5,
      enragedInterval: 1.2,
    },
  },
  {
    name: "Volcanic Rift",
    bg: "#5a2020",
    sky: "#2a1010",
    unlockCost: 8000,
    enemies: [
      { name: "Fire Elemental", color: "#ff4500", hp: 100, attack: 35, speed: 50,  gold: 30, size: 20, xpReward: 35, shape: "elemental" },
      { name: "Lava Wyrm",     color: "#cc3300", hp: 180, attack: 45, speed: 30,  gold: 60, size: 26, xpReward: 55, shape: "serpent" },
      { name: "Ash Demon",     color: "#3a0a0a", hp: 150, attack: 40, speed: 55,  gold: 50, size: 22, xpReward: 45, shape: "demon" },
    ],
    boss: {
      name: "Magma Titan",
      color: "#cc2200",
      accentColor: "#ff8800",
      hp: 3000,
      attack: 60,
      speed: 25,
      gold: 3000,
      size: 48,
      xpReward: 600,
      shape: "golem",
      killsToSpawn: 35,
      attacks: ["projectile", "aoe", "summon"],
      attackInterval: 2,
      enragedInterval: 1,
    },
  },
  {
    name: "Abyssal Realm",
    bg: "#1a0a2e",
    sky: "#0a0015",
    unlockCost: 30000,
    enemies: [
      { name: "Void Walker",  color: "#6a0dad", hp: 200, attack: 55, speed: 60,  gold: 80,  size: 22, xpReward: 65, shape: "demon" },
      { name: "Shadow Lord",  color: "#2d0050", hp: 350, attack: 70, speed: 35,  gold: 150, size: 30, xpReward: 100, shape: "humanoid" },
      { name: "Soul Eater",   color: "#8b00ff", hp: 250, attack: 60, speed: 70,  gold: 100, size: 20, xpReward: 80, shape: "elemental" },
    ],
    boss: {
      name: "Void Emperor",
      color: "#3300aa",
      accentColor: "#ff00ff",
      hp: 6000,
      attack: 80,
      speed: 40,
      gold: 10000,
      size: 50,
      xpReward: 1200,
      shape: "demon",
      killsToSpawn: 40,
      attacks: ["projectile", "charge", "aoe", "summon"],
      attackInterval: 1.8,
      enragedInterval: 0.8,
    },
  },
];

// Boss templates per area (index matches AREAS)
export const BOSSES: BossTemplate[] = [
  { name: "King Slime",       title: "The Gelatinous Monarch", color: "#2e8b2e", hp: 80,   attack: 8,   speed: 20, gold: 50,   size: 32, xpReward: 40,  isBoss: true, shape: "slime" },
  { name: "Alpha Wolf",       title: "Pack Leader",            color: "#404040", hp: 150,  attack: 18,  speed: 50, gold: 100,  size: 28, xpReward: 70,  isBoss: true, shape: "beast" },
  { name: "Desert Colossus",  title: "Eternal Sandstone",      color: "#b8860b", hp: 300,  attack: 30,  speed: 18, gold: 200,  size: 36, xpReward: 120, isBoss: true, shape: "golem" },
  { name: "Yeti",             title: "Mountain Terror",        color: "#e8f0f8", hp: 500,  attack: 45,  speed: 35, gold: 400,  size: 34, xpReward: 200, isBoss: true, shape: "beast" },
  { name: "Molten Dragon",    title: "Forge of Ruin",          color: "#ff2200", hp: 800,  attack: 65,  speed: 40, gold: 800,  size: 38, xpReward: 350, isBoss: true, shape: "demon" },
  { name: "Abyssal Overlord", title: "The Final Darkness",     color: "#3a005a", hp: 1500, attack: 90,  speed: 45, gold: 2000, size: 42, xpReward: 600, isBoss: true, shape: "demon" },
];

export const BOSS_SPAWN_KILLS = 20; // kills per boss spawn
export const COMBO_WINDOW = 2.0;    // seconds to chain kills
export const ARENA_MARGIN = 40;     // px inset from canvas edge
export const OVERWORLD_SPEED = 160; // px/s player speed on world map
export const ZONE_INTERACT_DIST = 60;  // px proximity to enter a zone
export const TOWN_INTERACT_DIST = 50;  // px proximity to interact with town
export const WORLD_W = 3200;        // world map width
export const WORLD_H = 2400;        // world map height

// Helper: XP needed for a given level
export function xpForLevel(level: number): number {
  return Math.floor(XP_PER_LEVEL * Math.pow(1.15, level - 1));
}

// Helper: upgrade cost at a given purchased count
export function upgradeCost(def: UpgradeDef, purchased: number): number {
  return Math.floor(def.baseCost * Math.pow(def.costScale, purchased));
}

// Save/Load helpers
const SAVE_KEY = "ginormo-sword-save";

export function saveGame(data: SaveData): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch { /* quota exceeded, ignore */ }
}

export function loadGame(): SaveData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SaveData;
  } catch {
    return null;
  }
}

export function defaultSave(): SaveData {
  return {
    gold: 0,
    xp: 0,
    level: 1,
    upgradeLevels: UPGRADES.map(() => 0),
    unlockedAreas: [],
    clearedZones: [],
    defeatedBosses: [],
    totalKills: 0,
    highestCombo: 0,
    overworldX: 600,
    overworldY: 2200,
    totalPlayTime: 0,
    lastTown: "Millbrook",
  };
}
