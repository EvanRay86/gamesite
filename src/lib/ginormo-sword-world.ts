import type { CombatZone, WorldRegion, TownMarker } from "./ginormo-sword-data";
import { AREAS } from "./ginormo-sword-data";

// ── Regions ──────────────────────────────────────────────────────────────────

export const REGIONS: WorldRegion[] = [
  {
    id: "meadow",
    name: "Green Meadow",
    x: 100, y: 100, w: 900, h: 700,
    groundColor: "#6aaf50",
    accentColor: "#4a7c3f",
    decorations: [
      { type: "tree", x: 200, y: 250, size: 28, color: "#3d8b37" },
      { type: "bush", x: 450, y: 400, size: 14, color: "#5cb85c" },
      { type: "tree", x: 700, y: 300, size: 24, color: "#4a9a42" },
      { type: "bush", x: 350, y: 600, size: 12, color: "#5cb85c" },
      { type: "mushroom", x: 600, y: 550, size: 10, color: "#d4a843" },
    ],
    blockers: [],
    unlockBoss: null,
  },
  {
    id: "forest",
    name: "Dark Forest",
    x: 1050, y: 100, w: 900, h: 700,
    groundColor: "#3a6e30",
    accentColor: "#2d5a27",
    decorations: [
      { type: "tree", x: 1200, y: 200, size: 32, color: "#2d5a27" },
      { type: "tree", x: 1400, y: 350, size: 36, color: "#1e4a1e" },
      { type: "mushroom", x: 1300, y: 500, size: 14, color: "#8b4513" },
      { type: "tree", x: 1600, y: 250, size: 30, color: "#2a5020" },
      { type: "bush", x: 1500, y: 600, size: 16, color: "#3d6b37" },
    ],
    blockers: [],
    unlockBoss: "King Slime",
  },
  {
    id: "desert",
    name: "Scorched Desert",
    x: 2050, y: 100, w: 1050, h: 700,
    groundColor: "#d4b856",
    accentColor: "#c2a645",
    decorations: [
      { type: "cactus", x: 2200, y: 300, size: 20, color: "#5a8a3a" },
      { type: "rock", x: 2500, y: 450, size: 18, color: "#b89a60" },
      { type: "cactus", x: 2800, y: 250, size: 16, color: "#4a7a2a" },
      { type: "rock", x: 2400, y: 600, size: 14, color: "#a08a50" },
    ],
    blockers: [],
    unlockBoss: "Ancient Treant",
  },
  {
    id: "peaks",
    name: "Frozen Peaks",
    x: 100, y: 850, w: 900, h: 700,
    groundColor: "#c8dce8",
    accentColor: "#a0b8c8",
    decorations: [
      { type: "ice_crystal", x: 300, y: 1000, size: 22, color: "#aaddff" },
      { type: "rock", x: 550, y: 1150, size: 20, color: "#8090a0" },
      { type: "ice_crystal", x: 700, y: 950, size: 18, color: "#88ccee" },
      { type: "rock", x: 400, y: 1300, size: 16, color: "#7080a0" },
    ],
    blockers: [],
    unlockBoss: "Sand Wyrm",
  },
  {
    id: "volcano",
    name: "Volcanic Rift",
    x: 1050, y: 850, w: 900, h: 700,
    groundColor: "#6a3030",
    accentColor: "#5a2020",
    decorations: [
      { type: "lava_pool", x: 1250, y: 1000, size: 24, color: "#ff4500" },
      { type: "rock", x: 1500, y: 1150, size: 20, color: "#4a2020" },
      { type: "pillar", x: 1650, y: 950, size: 18, color: "#3a1515" },
      { type: "lava_pool", x: 1400, y: 1350, size: 20, color: "#cc3300" },
    ],
    blockers: [],
    unlockBoss: "Frost Dragon",
  },
  {
    id: "abyss",
    name: "Abyssal Realm",
    x: 2050, y: 850, w: 1050, h: 700,
    groundColor: "#2a1040",
    accentColor: "#1a0a2e",
    decorations: [
      { type: "pillar", x: 2300, y: 1000, size: 26, color: "#3a005a" },
      { type: "ruin", x: 2600, y: 1100, size: 22, color: "#2d0050" },
      { type: "pillar", x: 2800, y: 950, size: 20, color: "#4a0070" },
      { type: "ruin", x: 2500, y: 1350, size: 18, color: "#1a0030" },
    ],
    blockers: [],
    unlockBoss: "Magma Titan",
  },
];

// ── Towns ────────────────────────────────────────────────────────────────────

export const TOWNS: TownMarker[] = [
  { regionId: "meadow",  x: 300,  y: 350,  name: "Greenhollow" },
  { regionId: "forest",  x: 1350, y: 400,  name: "Thornwatch" },
  { regionId: "desert",  x: 2400, y: 350,  name: "Dusthaven" },
  { regionId: "peaks",   x: 450,  y: 1100, name: "Frostheim" },
  { regionId: "volcano", x: 1400, y: 1100, name: "Cinderforge" },
  { regionId: "abyss",   x: 2500, y: 1100, name: "Voidspire" },
];

// ── Zones ────────────────────────────────────────────────────────────────────

function buildZones(): CombatZone[] {
  const regionIds = ["meadow", "forest", "desert", "peaks", "volcano", "abyss"];
  const zones: CombatZone[] = [];

  AREAS.forEach((area, areaIdx) => {
    const region = REGIONS[areaIdx];
    const regionId = regionIds[areaIdx];

    // Normal zone
    zones.push({
      id: `${regionId}-zone`,
      regionId,
      name: area.name,
      x: region.x + 500,
      y: region.y + 200,
      w: 120,
      h: 120,
      enemyPool: area.enemies,
      waveCount: 3 + areaIdx,
      enemiesPerWave: 3 + Math.floor(areaIdx / 2),
      isBossZone: false,
      recommendedLevel: 1 + areaIdx * 8,
      completionReward: { gold: 20 * (areaIdx + 1), xp: 30 * (areaIdx + 1) },
      arenaColor: area.bg,
    });

    // Boss zone
    zones.push({
      id: `${regionId}-boss`,
      regionId,
      name: `${area.name} - Boss`,
      x: region.x + 650,
      y: region.y + 450,
      w: 140,
      h: 140,
      enemyPool: area.enemies,
      waveCount: 1,
      enemiesPerWave: area.boss.killsToSpawn ?? 20,
      boss: area.boss,
      isBossZone: true,
      recommendedLevel: 5 + areaIdx * 8,
      completionReward: { gold: 100 * (areaIdx + 1), xp: 80 * (areaIdx + 1) },
      arenaColor: area.bg,
    });
  });

  return zones;
}

export const ZONES: CombatZone[] = buildZones();

// ── Region unlock check ──────────────────────────────────────────────────────

export function isRegionUnlocked(regionId: string, defeatedBosses: string[]): boolean {
  const region = REGIONS.find((r) => r.id === regionId);
  if (!region) return false;
  if (region.unlockBoss === null) return true;
  return defeatedBosses.includes(region.unlockBoss);
}
