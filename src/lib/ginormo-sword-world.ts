// Ginormo Sword – Full World Content
// 6 regions, 25 combat zones, ~55 enemy types, 6 region bosses

import type { WorldRegion, CombatZone, TownMarker, EnemyTemplate, BossDef } from "./ginormo-sword-data";

// ── Helper to generate decorations procedurally ────────────────────────────

function genDecorations(
  rx: number, ry: number, rw: number, rh: number,
  types: Array<{ type: string; color: string; size: number }>,
  count: number,
) {
  const decs = [];
  for (let i = 0; i < count; i++) {
    const t = types[i % types.length];
    // Deterministic pseudo-random from index
    const px = rx + 40 + ((i * 137 + 53) % (rw - 80));
    const py = ry + 40 + ((i * 197 + 89) % (rh - 80));
    decs.push({ type: t.type as any, x: px, y: py, size: t.size + (i % 3) * 2, color: t.color });
  }
  return decs;
}

// ═══════════════════════════════════════════════════════════════════════════
// ENEMY TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════

// Region 1: Verdant Meadows (Lv 1-8)
const SLIME: EnemyTemplate       = { name: "Slime",       color: "#5cb85c", hp: 12,  attack: 3,  speed: 28,  gold: 2,  size: 14, xpReward: 8,  shape: "slime",     behavior: "chaser" };
const RAT: EnemyTemplate         = { name: "Rat",         color: "#8B7355", hp: 10,  attack: 4,  speed: 50,  gold: 3,  size: 10, xpReward: 7,  shape: "beast",     behavior: "chaser" };
const MUSHROOM: EnemyTemplate    = { name: "Mushroom",    color: "#c44",    hp: 15,  attack: 5,  speed: 15,  gold: 4,  size: 12, xpReward: 10, shape: "slime",     behavior: "ranged", projectileColor: "#a44", projectileSpeed: 120, projectileDamage: 4 };
const BEE: EnemyTemplate         = { name: "Bee",         color: "#e8c820", hp: 8,   attack: 3,  speed: 70,  gold: 3,  size: 8,  xpReward: 6,  shape: "flying",    behavior: "chaser" };
const BANDIT: EnemyTemplate      = { name: "Bandit",      color: "#8a5a3a", hp: 22,  attack: 7,  speed: 38,  gold: 8,  size: 14, xpReward: 14, shape: "humanoid",  behavior: "charger", chargeSpeed: 200 };
const BOAR: EnemyTemplate        = { name: "Boar",        color: "#6a4a3a", hp: 28,  attack: 8,  speed: 35,  gold: 6,  size: 16, xpReward: 12, shape: "beast",     behavior: "charger", chargeSpeed: 220 };
const SPRITE: EnemyTemplate      = { name: "Sprite",      color: "#aaffaa", hp: 14,  attack: 4,  speed: 45,  gold: 5,  size: 9,  xpReward: 9,  shape: "flying",    behavior: "teleporter", teleportInterval: 3 };
const TOADSTOOL: EnemyTemplate   = { name: "Toadstool",   color: "#dd6688", hp: 20,  attack: 3,  speed: 10,  gold: 6,  size: 14, xpReward: 11, shape: "slime",     behavior: "healer", healAmount: 3 };

// Region 2: Darkwood Forest (Lv 8-16)
const WOLF: EnemyTemplate        = { name: "Wolf",        color: "#696969", hp: 35,  attack: 10, speed: 60,  gold: 8,  size: 16, xpReward: 18, shape: "beast",     behavior: "chaser" };
const GOBLIN: EnemyTemplate      = { name: "Goblin",      color: "#3d8b37", hp: 28,  attack: 12, speed: 45,  gold: 10, size: 13, xpReward: 16, shape: "humanoid",  behavior: "chaser" };
const BAT: EnemyTemplate         = { name: "Bat",         color: "#4a3060", hp: 18,  attack: 7,  speed: 75,  gold: 6,  size: 10, xpReward: 12, shape: "flying",    behavior: "chaser" };
const SPIDER: EnemyTemplate      = { name: "Spider",      color: "#333",    hp: 25,  attack: 9,  speed: 55,  gold: 9,  size: 12, xpReward: 15, shape: "beast",     behavior: "ranged", projectileColor: "#888", projectileSpeed: 140, projectileDamage: 6 };
const TREANT_SAPLING: EnemyTemplate = { name: "Sapling",  color: "#5a7a3a", hp: 50,  attack: 14, speed: 15,  gold: 15, size: 20, xpReward: 22, shape: "golem",     behavior: "chaser" };
const FOREST_WITCH: EnemyTemplate= { name: "Forest Witch",color: "#8a5aa0", hp: 30,  attack: 8,  speed: 30,  gold: 14, size: 13, xpReward: 20, shape: "humanoid",  behavior: "summoner", summonName: "Sprite" };
const POISON_TOAD: EnemyTemplate = { name: "Poison Toad", color: "#4a8844", hp: 40,  attack: 11, speed: 25,  gold: 12, size: 15, xpReward: 19, shape: "beast",     behavior: "ranged", projectileColor: "#5a5", projectileSpeed: 100, projectileDamage: 8 };
const WILL_O_WISP: EnemyTemplate = { name: "Will-o-Wisp", color: "#88ccff", hp: 15,  attack: 6,  speed: 50,  gold: 8,  size: 8,  xpReward: 14, shape: "elemental", behavior: "teleporter", teleportInterval: 2.5 };
const ORC_SCOUT: EnemyTemplate   = { name: "Orc Scout",   color: "#5a6a3a", hp: 45,  attack: 15, speed: 35,  gold: 16, size: 17, xpReward: 24, shape: "humanoid",  behavior: "charger", chargeSpeed: 230 };

// Region 3: Scorched Wastes (Lv 16-25)
const SCORPION: EnemyTemplate    = { name: "Scorpion",    color: "#8B4513", hp: 55,  attack: 16, speed: 42,  gold: 16, size: 15, xpReward: 28, shape: "beast",     behavior: "chaser" };
const SAND_GOLEM: EnemyTemplate  = { name: "Sand Golem",  color: "#d4a843", hp: 90,  attack: 22, speed: 22,  gold: 28, size: 22, xpReward: 40, shape: "golem",     behavior: "chaser" };
const VULTURE: EnemyTemplate     = { name: "Vulture",     color: "#555",    hp: 40,  attack: 13, speed: 65,  gold: 14, size: 12, xpReward: 24, shape: "flying",    behavior: "chaser" };
const SAND_MAGE: EnemyTemplate   = { name: "Sand Mage",   color: "#c4a060", hp: 45,  attack: 12, speed: 28,  gold: 22, size: 14, xpReward: 32, shape: "humanoid",  behavior: "ranged", projectileColor: "#daa520", projectileSpeed: 160, projectileDamage: 14 };
const DUST_DEVIL: EnemyTemplate  = { name: "Dust Devil",  color: "#c8a860", hp: 35,  attack: 15, speed: 80,  gold: 18, size: 11, xpReward: 26, shape: "elemental", behavior: "teleporter", teleportInterval: 2 };
const MUMMY: EnemyTemplate       = { name: "Mummy",       color: "#c8b880", hp: 70,  attack: 20, speed: 20,  gold: 24, size: 16, xpReward: 35, shape: "humanoid",  behavior: "chaser" };
const SAND_SNAKE: EnemyTemplate  = { name: "Sand Snake",  color: "#b8942a", hp: 50,  attack: 18, speed: 55,  gold: 20, size: 13, xpReward: 30, shape: "serpent",   behavior: "charger", chargeSpeed: 260 };
const SCARAB: EnemyTemplate      = { name: "Scarab",      color: "#4a6a2a", hp: 30,  attack: 10, speed: 50,  gold: 12, size: 10, xpReward: 22, shape: "beast",     behavior: "chaser" };
const OASIS_SHAMAN: EnemyTemplate= { name: "Oasis Shaman",color: "#44aa88", hp: 55,  attack: 10, speed: 25,  gold: 26, size: 14, xpReward: 34, shape: "humanoid",  behavior: "healer", healAmount: 8 };

// Region 4: Frozen Peaks (Lv 25-35)
const ICE_WOLF: EnemyTemplate    = { name: "Ice Wolf",    color: "#b0d0e8", hp: 80,  attack: 24, speed: 55,  gold: 24, size: 18, xpReward: 42, shape: "beast",     behavior: "chaser" };
const FROST_GIANT: EnemyTemplate = { name: "Frost Giant",  color: "#7090b0", hp: 160, attack: 35, speed: 18,  gold: 55, size: 28, xpReward: 65, shape: "golem",     behavior: "chaser" };
const SNOW_IMP: EnemyTemplate    = { name: "Snow Imp",    color: "#d0e8f0", hp: 50,  attack: 18, speed: 80,  gold: 18, size: 11, xpReward: 34, shape: "humanoid",  behavior: "ranged", projectileColor: "#aaddff", projectileSpeed: 180, projectileDamage: 16 };
const ICE_MAGE: EnemyTemplate    = { name: "Ice Mage",    color: "#5588cc", hp: 65,  attack: 15, speed: 30,  gold: 35, size: 14, xpReward: 48, shape: "humanoid",  behavior: "ranged", projectileColor: "#88ccff", projectileSpeed: 170, projectileDamage: 20 };
const YETI: EnemyTemplate        = { name: "Yeti",        color: "#e0e8f0", hp: 130, attack: 30, speed: 30,  gold: 45, size: 24, xpReward: 55, shape: "beast",     behavior: "charger", chargeSpeed: 280 };
const FROST_SPRITE: EnemyTemplate= { name: "Frost Sprite",color: "#aaccff", hp: 40,  attack: 14, speed: 60,  gold: 20, size: 9,  xpReward: 36, shape: "flying",    behavior: "teleporter", teleportInterval: 2 };
const ICE_ELEMENTAL: EnemyTemplate={ name: "Ice Elemental",color: "#80b0dd", hp: 100, attack: 28, speed: 25,  gold: 40, size: 20, xpReward: 52, shape: "elemental", behavior: "summoner", summonName: "Frost Sprite" };
const SNOW_BEAR: EnemyTemplate   = { name: "Snow Bear",   color: "#e8e8f0", hp: 120, attack: 32, speed: 35,  gold: 42, size: 22, xpReward: 50, shape: "beast",     behavior: "chaser" };

// Region 5: Volcanic Rift (Lv 35-50)
const FIRE_ELEMENTAL: EnemyTemplate = { name: "Fire Elemental", color: "#ff4500", hp: 140, attack: 40, speed: 45, gold: 40, size: 20, xpReward: 65, shape: "elemental", behavior: "chaser" };
const LAVA_WYRM: EnemyTemplate     = { name: "Lava Wyrm",     color: "#cc3300", hp: 220, attack: 50, speed: 28,  gold: 80, size: 26, xpReward: 90, shape: "serpent",    behavior: "charger", chargeSpeed: 300 };
const ASH_DEMON: EnemyTemplate     = { name: "Ash Demon",     color: "#3a0a0a", hp: 180, attack: 45, speed: 50,  gold: 65, size: 22, xpReward: 75, shape: "demon",      behavior: "ranged", projectileColor: "#ff4400", projectileSpeed: 200, projectileDamage: 30 };
const MAGMA_GOLEM: EnemyTemplate   = { name: "Magma Golem",   color: "#aa3300", hp: 280, attack: 55, speed: 15,  gold: 90, size: 28, xpReward: 100, shape: "golem",     behavior: "chaser" };
const HELL_BAT: EnemyTemplate      = { name: "Hell Bat",      color: "#880000", hp: 100, attack: 35, speed: 80,  gold: 35, size: 12, xpReward: 55, shape: "flying",     behavior: "chaser" };
const FLAME_IMP: EnemyTemplate     = { name: "Flame Imp",     color: "#ff6633", hp: 120, attack: 30, speed: 55,  gold: 45, size: 13, xpReward: 60, shape: "demon",      behavior: "teleporter", teleportInterval: 1.8 };
const INFERNAL_PRIEST: EnemyTemplate = { name: "Infernal Priest", color: "#660022", hp: 150, attack: 25, speed: 25, gold: 60, size: 16, xpReward: 70, shape: "humanoid", behavior: "healer", healAmount: 15 };
const EMBER_SNAKE: EnemyTemplate   = { name: "Ember Snake",   color: "#ff5500", hp: 160, attack: 42, speed: 60,  gold: 55, size: 14, xpReward: 68, shape: "serpent",    behavior: "chaser" };
const OBSIDIAN_SENTRY: EnemyTemplate = { name: "Obsidian Sentry", color: "#1a1a2e", hp: 250, attack: 48, speed: 20, gold: 75, size: 24, xpReward: 85, shape: "golem",   behavior: "ranged", projectileColor: "#8800aa", projectileSpeed: 160, projectileDamage: 35 };

// Region 6: Abyssal Realm (Lv 50-70)
const VOID_WALKER: EnemyTemplate   = { name: "Void Walker",  color: "#6a0dad", hp: 280, attack: 60, speed: 55,  gold: 100, size: 22, xpReward: 110, shape: "demon",     behavior: "teleporter", teleportInterval: 1.5 };
const SHADOW_LORD: EnemyTemplate   = { name: "Shadow Lord",  color: "#2d0050", hp: 450, attack: 75, speed: 30,  gold: 180, size: 30, xpReward: 160, shape: "humanoid",  behavior: "summoner", summonName: "Void Walker" };
const SOUL_EATER: EnemyTemplate    = { name: "Soul Eater",   color: "#8b00ff", hp: 320, attack: 65, speed: 65,  gold: 130, size: 20, xpReward: 130, shape: "elemental", behavior: "chaser" };
const DARK_KNIGHT: EnemyTemplate   = { name: "Dark Knight",  color: "#1a1a3a", hp: 400, attack: 70, speed: 40,  gold: 160, size: 24, xpReward: 145, shape: "humanoid",  behavior: "charger", chargeSpeed: 350 };
const VOID_MAGE: EnemyTemplate     = { name: "Void Mage",    color: "#5500aa", hp: 250, attack: 45, speed: 30,  gold: 120, size: 15, xpReward: 120, shape: "humanoid",  behavior: "ranged", projectileColor: "#aa00ff", projectileSpeed: 220, projectileDamage: 45 };
const ABYSS_WORM: EnemyTemplate    = { name: "Abyss Worm",   color: "#330066", hp: 500, attack: 80, speed: 20,  gold: 200, size: 30, xpReward: 170, shape: "serpent",   behavior: "chaser" };
const DARK_PRIEST: EnemyTemplate   = { name: "Dark Priest",  color: "#440066", hp: 300, attack: 40, speed: 28,  gold: 140, size: 16, xpReward: 125, shape: "humanoid",  behavior: "healer", healAmount: 25 };
const PHANTOM: EnemyTemplate       = { name: "Phantom",      color: "#9944cc", hp: 200, attack: 55, speed: 70,  gold: 110, size: 14, xpReward: 115, shape: "flying",    behavior: "teleporter", teleportInterval: 1.2 };

// ═══════════════════════════════════════════════════════════════════════════
// BOSS DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

const BOSS_KING_SLIME: BossDef = {
  name: "King Slime", title: "The Gelatinous Monarch",
  color: "#2ecc40", accentColor: "#FFD700",
  hp: 350, attack: 12, speed: 25, gold: 150, size: 36, xpReward: 200,
  shape: "slime", attacks: ["charge", "summon"], attackInterval: 3, enragedInterval: 1.8,
};

const BOSS_ANCIENT_TREANT: BossDef = {
  name: "Ancient Treant", title: "Warden of the Deep Wood",
  color: "#4a3520", accentColor: "#5cb85c",
  hp: 800, attack: 25, speed: 15, gold: 400, size: 42, xpReward: 450,
  shape: "golem", attacks: ["aoe", "summon"], attackInterval: 3.5, enragedInterval: 2,
};

const BOSS_SAND_WYRM: BossDef = {
  name: "Sand Wyrm", title: "Terror of the Dunes",
  color: "#c4a035", accentColor: "#ff6600",
  hp: 1800, attack: 40, speed: 50, gold: 1000, size: 38, xpReward: 800,
  shape: "serpent", attacks: ["charge", "projectile"], attackInterval: 2.5, enragedInterval: 1.5,
};

const BOSS_FROST_DRAGON: BossDef = {
  name: "Frost Dragon", title: "Lord of Endless Winter",
  color: "#6090cc", accentColor: "#aaddff",
  hp: 3500, attack: 55, speed: 40, gold: 2500, size: 44, xpReward: 1500,
  shape: "flying", attacks: ["projectile", "charge", "aoe"], attackInterval: 2.5, enragedInterval: 1.2,
};

const BOSS_MAGMA_TITAN: BossDef = {
  name: "Magma Titan", title: "The Forge of Ruin",
  color: "#cc2200", accentColor: "#ff8800",
  hp: 6000, attack: 75, speed: 22, gold: 5000, size: 50, xpReward: 3000,
  shape: "golem", attacks: ["projectile", "aoe", "summon"], attackInterval: 2, enragedInterval: 1,
};

const BOSS_VOID_EMPEROR: BossDef = {
  name: "Void Emperor", title: "The Final Darkness",
  color: "#3300aa", accentColor: "#ff00ff",
  hp: 12000, attack: 100, speed: 35, gold: 15000, size: 52, xpReward: 6000,
  shape: "demon", attacks: ["projectile", "charge", "aoe", "summon"], attackInterval: 1.8, enragedInterval: 0.8,
};

// Mini-boss templates (beefed-up regulars)
function miniBoss(base: EnemyTemplate, name: string, mult: number): EnemyTemplate {
  return {
    ...base,
    name,
    hp: Math.floor(base.hp * mult * 3),
    attack: Math.floor(base.attack * mult * 1.5),
    gold: Math.floor(base.gold * mult * 4),
    size: Math.floor(base.size * 1.4),
    xpReward: Math.floor(base.xpReward * mult * 3),
    speed: Math.floor(base.speed * 0.8),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// WORLD REGIONS
// ═══════════════════════════════════════════════════════════════════════════

export const REGIONS: WorldRegion[] = [
  {
    id: "verdant_meadows", name: "Verdant Meadows",
    x: 200, y: 1800, w: 900, h: 700,
    groundColor: "#4a7c3f", accentColor: "#6aaa55",
    decorations: genDecorations(200, 1800, 900, 700,
      [{ type: "tree", color: "#3a6a2f", size: 10 }, { type: "bush", color: "#5a9a45", size: 6 }, { type: "mushroom", color: "#cc6688", size: 4 }], 25),
    blockers: [], unlockBoss: null,
  },
  {
    id: "darkwood_forest", name: "Darkwood Forest",
    x: 800, y: 1200, w: 1000, h: 800,
    groundColor: "#2d5a27", accentColor: "#4a7a3a",
    decorations: genDecorations(800, 1200, 1000, 800,
      [{ type: "tree", color: "#1a3a12", size: 14 }, { type: "tree", color: "#2a4a1a", size: 12 }, { type: "mushroom", color: "#886644", size: 5 }], 35),
    blockers: [], unlockBoss: "King Slime",
  },
  {
    id: "scorched_wastes", name: "Scorched Wastes",
    x: 1600, y: 1600, w: 1000, h: 700,
    groundColor: "#c2a645", accentColor: "#ddc060",
    decorations: genDecorations(1600, 1600, 1000, 700,
      [{ type: "cactus", color: "#5a8a3a", size: 8 }, { type: "rock", color: "#aa9060", size: 7 }, { type: "ruin", color: "#b0a070", size: 10 }], 20),
    blockers: [], unlockBoss: "Ancient Treant",
  },
  {
    id: "frozen_peaks", name: "Frozen Peaks",
    x: 1500, y: 600, w: 1000, h: 800,
    groundColor: "#a0b8c8", accentColor: "#c0d8e8",
    decorations: genDecorations(1500, 600, 1000, 800,
      [{ type: "ice_crystal", color: "#88bbdd", size: 8 }, { type: "rock", color: "#8899aa", size: 9 }, { type: "tree", color: "#446688", size: 10 }], 22),
    blockers: [], unlockBoss: "Sand Wyrm",
  },
  {
    id: "volcanic_rift", name: "Volcanic Rift",
    x: 2600, y: 800, w: 900, h: 800,
    groundColor: "#5a2020", accentColor: "#7a3030",
    decorations: genDecorations(2600, 800, 900, 800,
      [{ type: "lava_pool", color: "#ff4400", size: 10 }, { type: "rock", color: "#3a2020", size: 8 }, { type: "pillar", color: "#4a3030", size: 12 }], 18),
    blockers: [], unlockBoss: "Frost Dragon",
  },
  {
    id: "abyssal_realm", name: "Abyssal Realm",
    x: 2800, y: 1800, w: 900, h: 700,
    groundColor: "#1a0a2e", accentColor: "#2a1a4e",
    decorations: genDecorations(2800, 1800, 900, 700,
      [{ type: "pillar", color: "#3a2060", size: 14 }, { type: "ruin", color: "#2a1050", size: 10 }, { type: "lava_pool", color: "#8800ff", size: 8 }], 15),
    blockers: [], unlockBoss: "Magma Titan",
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// TOWNS
// ═══════════════════════════════════════════════════════════════════════════

export const TOWNS: TownMarker[] = [
  { regionId: "verdant_meadows", x: 600,  y: 2200, name: "Millbrook" },
  { regionId: "darkwood_forest", x: 1100, y: 1600, name: "Darkwood Outpost" },
  { regionId: "scorched_wastes", x: 2000, y: 1950, name: "Oasis Haven" },
  { regionId: "frozen_peaks",    x: 1900, y: 1000, name: "Frostheim" },
  { regionId: "volcanic_rift",   x: 3000, y: 1200, name: "Ember Bastion" },
  { regionId: "abyssal_realm",   x: 3200, y: 2150, name: "Rift Sanctuary" },
];

// ═══════════════════════════════════════════════════════════════════════════
// COMBAT ZONES (25 total)
// ═══════════════════════════════════════════════════════════════════════════

export const ZONES: CombatZone[] = [
  // ── Region 1: Verdant Meadows ──────────────────────────────────────
  {
    id: "slime_fields", regionId: "verdant_meadows", name: "Slime Fields",
    x: 350, y: 1900, w: 70, h: 70,
    enemyPool: [SLIME, RAT, BEE], waveCount: 3, enemiesPerWave: 4,
    isBossZone: false, recommendedLevel: 1,
    completionReward: { gold: 20, xp: 30 }, arenaColor: "#4a7c3f",
  },
  {
    id: "mushroom_grove", regionId: "verdant_meadows", name: "Mushroom Grove",
    x: 500, y: 2050, w: 70, h: 70,
    enemyPool: [MUSHROOM, SLIME, SPRITE, TOADSTOOL], waveCount: 3, enemiesPerWave: 5,
    miniBoss: miniBoss(MUSHROOM, "Giant Mushroom", 1),
    isBossZone: false, recommendedLevel: 3,
    completionReward: { gold: 35, xp: 50 }, arenaColor: "#3a6a30",
  },
  {
    id: "bandit_camp", regionId: "verdant_meadows", name: "Bandit Camp",
    x: 750, y: 1950, w: 70, h: 70,
    enemyPool: [BANDIT, BOAR, RAT], waveCount: 4, enemiesPerWave: 4,
    miniBoss: miniBoss(BANDIT, "Bandit Chief", 1),
    isBossZone: false, recommendedLevel: 5,
    completionReward: { gold: 50, xp: 80 }, arenaColor: "#5a6a4a",
  },
  {
    id: "meadow_depths", regionId: "verdant_meadows", name: "Meadow Depths",
    x: 650, y: 2350, w: 80, h: 80,
    enemyPool: [SLIME, BOAR, SPRITE, TOADSTOOL], waveCount: 4, enemiesPerWave: 5,
    isBossZone: true, boss: BOSS_KING_SLIME, recommendedLevel: 7,
    completionReward: { gold: 100, xp: 150 }, arenaColor: "#3a6a2f",
  },

  // ── Region 2: Darkwood Forest ──────────────────────────────────────
  {
    id: "wolf_den", regionId: "darkwood_forest", name: "Wolf Den",
    x: 950, y: 1350, w: 70, h: 70,
    enemyPool: [WOLF, BAT], waveCount: 4, enemiesPerWave: 4,
    isBossZone: false, recommendedLevel: 8,
    completionReward: { gold: 60, xp: 100 }, arenaColor: "#2d4a22",
  },
  {
    id: "goblin_outpost", regionId: "darkwood_forest", name: "Goblin Outpost",
    x: 1200, y: 1280, w: 70, h: 70,
    enemyPool: [GOBLIN, ORC_SCOUT, BAT], waveCount: 4, enemiesPerWave: 5,
    miniBoss: miniBoss(ORC_SCOUT, "Orc Captain", 1.2),
    isBossZone: false, recommendedLevel: 10,
    completionReward: { gold: 80, xp: 130 }, arenaColor: "#2a3a1a",
  },
  {
    id: "spider_hollow", regionId: "darkwood_forest", name: "Spider Hollow",
    x: 1050, y: 1550, w: 70, h: 70,
    enemyPool: [SPIDER, POISON_TOAD, WILL_O_WISP], waveCount: 4, enemiesPerWave: 5,
    miniBoss: miniBoss(SPIDER, "Brood Mother", 1.3),
    isBossZone: false, recommendedLevel: 12,
    completionReward: { gold: 100, xp: 160 }, arenaColor: "#1a2a12",
  },
  {
    id: "bat_caverns", regionId: "darkwood_forest", name: "Bat Caverns",
    x: 1400, y: 1450, w: 70, h: 70,
    enemyPool: [BAT, WILL_O_WISP, SPIDER], waveCount: 5, enemiesPerWave: 5,
    isBossZone: false, recommendedLevel: 13,
    completionReward: { gold: 110, xp: 180 }, arenaColor: "#1a1a22",
  },
  {
    id: "ancient_grove", regionId: "darkwood_forest", name: "Ancient Grove",
    x: 1300, y: 1700, w: 80, h: 80,
    enemyPool: [TREANT_SAPLING, FOREST_WITCH, WOLF, GOBLIN], waveCount: 5, enemiesPerWave: 5,
    isBossZone: true, boss: BOSS_ANCIENT_TREANT, recommendedLevel: 15,
    completionReward: { gold: 250, xp: 350 }, arenaColor: "#223318",
  },

  // ── Region 3: Scorched Wastes ──────────────────────────────────────
  {
    id: "dune_crawlers", regionId: "scorched_wastes", name: "Dune Crawlers",
    x: 1750, y: 1700, w: 70, h: 70,
    enemyPool: [SCORPION, SCARAB, VULTURE], waveCount: 4, enemiesPerWave: 5,
    isBossZone: false, recommendedLevel: 16,
    completionReward: { gold: 120, xp: 200 }, arenaColor: "#b0963a",
  },
  {
    id: "oasis_ruins", regionId: "scorched_wastes", name: "Oasis Ruins",
    x: 2050, y: 1750, w: 70, h: 70,
    enemyPool: [SAND_MAGE, OASIS_SHAMAN, MUMMY], waveCount: 4, enemiesPerWave: 5,
    miniBoss: miniBoss(SAND_MAGE, "Arch Mage", 1.3),
    isBossZone: false, recommendedLevel: 18,
    completionReward: { gold: 150, xp: 250 }, arenaColor: "#44886a",
  },
  {
    id: "vulture_cliffs", regionId: "scorched_wastes", name: "Vulture Cliffs",
    x: 1850, y: 1900, w: 70, h: 70,
    enemyPool: [VULTURE, DUST_DEVIL, SCORPION], waveCount: 5, enemiesPerWave: 5,
    isBossZone: false, recommendedLevel: 20,
    completionReward: { gold: 170, xp: 280 }, arenaColor: "#8a7a50",
  },
  {
    id: "sandstorm_valley", regionId: "scorched_wastes", name: "Sandstorm Valley",
    x: 2200, y: 1850, w: 70, h: 70,
    enemyPool: [SAND_GOLEM, SAND_SNAKE, DUST_DEVIL, MUMMY], waveCount: 5, enemiesPerWave: 5,
    miniBoss: miniBoss(SAND_GOLEM, "Colossal Golem", 1.4),
    isBossZone: false, recommendedLevel: 22,
    completionReward: { gold: 200, xp: 320 }, arenaColor: "#aa8a40",
  },
  {
    id: "wyrm_lair", regionId: "scorched_wastes", name: "Wyrm's Lair",
    x: 2350, y: 2000, w: 80, h: 80,
    enemyPool: [SAND_SNAKE, SAND_GOLEM, SCORPION, SAND_MAGE], waveCount: 5, enemiesPerWave: 6,
    isBossZone: true, boss: BOSS_SAND_WYRM, recommendedLevel: 24,
    completionReward: { gold: 500, xp: 600 }, arenaColor: "#8a7030",
  },

  // ── Region 4: Frozen Peaks ──────────────────────────────────────
  {
    id: "snowfield_patrol", regionId: "frozen_peaks", name: "Snowfield Patrol",
    x: 1650, y: 750, w: 70, h: 70,
    enemyPool: [ICE_WOLF, SNOW_BEAR, FROST_SPRITE], waveCount: 5, enemiesPerWave: 5,
    isBossZone: false, recommendedLevel: 25,
    completionReward: { gold: 220, xp: 350 }, arenaColor: "#9aacbc",
  },
  {
    id: "frozen_lake", regionId: "frozen_peaks", name: "Frozen Lake",
    x: 1900, y: 700, w: 70, h: 70,
    enemyPool: [FROST_SPRITE, ICE_ELEMENTAL, SNOW_IMP], waveCount: 5, enemiesPerWave: 5,
    miniBoss: miniBoss(ICE_ELEMENTAL, "Frozen Core", 1.4),
    isBossZone: false, recommendedLevel: 28,
    completionReward: { gold: 280, xp: 420 }, arenaColor: "#7090b0",
  },
  {
    id: "giants_pass", regionId: "frozen_peaks", name: "Giant's Pass",
    x: 2100, y: 850, w: 70, h: 70,
    enemyPool: [FROST_GIANT, ICE_WOLF, YETI], waveCount: 5, enemiesPerWave: 4,
    miniBoss: miniBoss(FROST_GIANT, "Ancient Giant", 1.5),
    isBossZone: false, recommendedLevel: 30,
    completionReward: { gold: 350, xp: 500 }, arenaColor: "#8098a8",
  },
  {
    id: "blizzard_ridge", regionId: "frozen_peaks", name: "Blizzard Ridge",
    x: 2200, y: 650, w: 70, h: 70,
    enemyPool: [YETI, ICE_MAGE, FROST_SPRITE, SNOW_BEAR], waveCount: 5, enemiesPerWave: 5,
    isBossZone: false, recommendedLevel: 32,
    completionReward: { gold: 400, xp: 550 }, arenaColor: "#7888a0",
  },
  {
    id: "dragons_roost", regionId: "frozen_peaks", name: "Dragon's Roost",
    x: 1800, y: 1100, w: 80, h: 80,
    enemyPool: [ICE_WOLF, FROST_GIANT, ICE_MAGE, YETI], waveCount: 6, enemiesPerWave: 5,
    isBossZone: true, boss: BOSS_FROST_DRAGON, recommendedLevel: 34,
    completionReward: { gold: 1200, xp: 1200 }, arenaColor: "#5a7a9a",
  },

  // ── Region 5: Volcanic Rift ──────────────────────────────────────
  {
    id: "magma_fields", regionId: "volcanic_rift", name: "Magma Fields",
    x: 2750, y: 950, w: 70, h: 70,
    enemyPool: [FIRE_ELEMENTAL, HELL_BAT, EMBER_SNAKE], waveCount: 5, enemiesPerWave: 5,
    isBossZone: false, recommendedLevel: 35,
    completionReward: { gold: 450, xp: 650 }, arenaColor: "#4a1818",
  },
  {
    id: "obsidian_mines", regionId: "volcanic_rift", name: "Obsidian Mines",
    x: 3050, y: 900, w: 70, h: 70,
    enemyPool: [OBSIDIAN_SENTRY, MAGMA_GOLEM, FLAME_IMP], waveCount: 5, enemiesPerWave: 5,
    miniBoss: miniBoss(OBSIDIAN_SENTRY, "Obsidian Warden", 1.5),
    isBossZone: false, recommendedLevel: 38,
    completionReward: { gold: 550, xp: 800 }, arenaColor: "#1a1a28",
  },
  {
    id: "demon_gate", regionId: "volcanic_rift", name: "Demon Gate",
    x: 2850, y: 1150, w: 70, h: 70,
    enemyPool: [ASH_DEMON, FLAME_IMP, INFERNAL_PRIEST], waveCount: 6, enemiesPerWave: 5,
    miniBoss: miniBoss(ASH_DEMON, "Gate Keeper", 1.5),
    isBossZone: false, recommendedLevel: 42,
    completionReward: { gold: 650, xp: 950 }, arenaColor: "#2a0a0a",
  },
  {
    id: "titans_forge", regionId: "volcanic_rift", name: "Titan's Forge",
    x: 3200, y: 1050, w: 80, h: 80,
    enemyPool: [MAGMA_GOLEM, LAVA_WYRM, ASH_DEMON, INFERNAL_PRIEST], waveCount: 6, enemiesPerWave: 5,
    isBossZone: true, boss: BOSS_MAGMA_TITAN, recommendedLevel: 48,
    completionReward: { gold: 2500, xp: 2500 }, arenaColor: "#3a1010",
  },

  // ── Region 6: Abyssal Realm ──────────────────────────────────────
  {
    id: "void_approach", regionId: "abyssal_realm", name: "Void Approach",
    x: 2950, y: 1900, w: 70, h: 70,
    enemyPool: [VOID_WALKER, PHANTOM, VOID_MAGE], waveCount: 6, enemiesPerWave: 5,
    isBossZone: false, recommendedLevel: 50,
    completionReward: { gold: 800, xp: 1200 }, arenaColor: "#120828",
  },
  {
    id: "soul_gardens", regionId: "abyssal_realm", name: "Soul Gardens",
    x: 3100, y: 2050, w: 70, h: 70,
    enemyPool: [SOUL_EATER, DARK_PRIEST, PHANTOM], waveCount: 6, enemiesPerWave: 5,
    miniBoss: miniBoss(SOUL_EATER, "Soul Devourer", 1.6),
    isBossZone: false, recommendedLevel: 55,
    completionReward: { gold: 1000, xp: 1500 }, arenaColor: "#180a30",
  },
  {
    id: "dark_citadel", regionId: "abyssal_realm", name: "Dark Citadel",
    x: 3300, y: 1950, w: 70, h: 70,
    enemyPool: [DARK_KNIGHT, SHADOW_LORD, VOID_MAGE, DARK_PRIEST], waveCount: 7, enemiesPerWave: 5,
    miniBoss: miniBoss(DARK_KNIGHT, "Dread Champion", 1.7),
    isBossZone: false, recommendedLevel: 60,
    completionReward: { gold: 1500, xp: 2000 }, arenaColor: "#0a0a1a",
  },
  {
    id: "throne_of_darkness", regionId: "abyssal_realm", name: "Throne of Darkness",
    x: 3400, y: 2200, w: 90, h: 90,
    enemyPool: [VOID_WALKER, SHADOW_LORD, SOUL_EATER, ABYSS_WORM], waveCount: 7, enemiesPerWave: 6,
    isBossZone: true, boss: BOSS_VOID_EMPEROR, recommendedLevel: 65,
    completionReward: { gold: 8000, xp: 5000 }, arenaColor: "#080010",
  },
];

// Lookup helpers
export function getRegion(id: string): WorldRegion | undefined {
  return REGIONS.find(r => r.id === id);
}

export function getZone(id: string): CombatZone | undefined {
  return ZONES.find(z => z.id === id);
}

export function getZonesForRegion(regionId: string): CombatZone[] {
  return ZONES.filter(z => z.regionId === regionId);
}

export function isRegionUnlocked(regionId: string, defeatedBosses: string[]): boolean {
  const region = getRegion(regionId);
  if (!region) return false;
  if (!region.unlockBoss) return true;
  return defeatedBosses.includes(region.unlockBoss);
}
