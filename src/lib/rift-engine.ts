// RIFT — Hex grid engine
// Axial coordinate hex math + map generation

import type { HexCoord, RiftHex, Faction, HexType } from "@/types/rift";

// ── Hex math (axial coordinates) ─────────────────────────────────────────────

/** The six axial-direction neighbor offsets for a hex grid. */
const DIRECTIONS: HexCoord[] = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
];

export function hexNeighbors(hex: HexCoord): HexCoord[] {
  return DIRECTIONS.map((d) => ({ q: hex.q + d.q, r: hex.r + d.r }));
}

export function hexDistance(a: HexCoord, b: HexCoord): number {
  return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
}

export function hexEquals(a: HexCoord, b: HexCoord): boolean {
  return a.q === b.q && a.r === b.r;
}

export function hexKey(hex: HexCoord): string {
  return `${hex.q},${hex.r}`;
}

/** Convert axial hex to pixel position (pointy-top hex). */
export function hexToPixel(hex: HexCoord, size: number): { x: number; y: number } {
  const x = size * (Math.sqrt(3) * hex.q + (Math.sqrt(3) / 2) * hex.r);
  const y = size * ((3 / 2) * hex.r);
  return { x, y };
}

/** Convert pixel position to the nearest axial hex coordinate. */
export function pixelToHex(px: number, py: number, size: number): HexCoord {
  const q = ((Math.sqrt(3) / 3) * px - (1 / 3) * py) / size;
  const r = ((2 / 3) * py) / size;
  return hexRound(q, r);
}

function hexRound(qf: number, rf: number): HexCoord {
  const sf = -qf - rf;
  let q = Math.round(qf);
  let r = Math.round(rf);
  const s = Math.round(sf);

  const qDiff = Math.abs(q - qf);
  const rDiff = Math.abs(r - rf);
  const sDiff = Math.abs(s - sf);

  if (qDiff > rDiff && qDiff > sDiff) {
    q = -r - s;
  } else if (rDiff > sDiff) {
    r = -q - s;
  }

  return { q, r };
}

// ── Map generation ───────────────────────────────────────────────────────────

/** Radius of the hex map (creates a hexagonal shape). */
const MAP_RADIUS = 7;

/** Generate all hex coordinates for a hexagonal map of given radius. */
export function generateMapCoords(radius: number = MAP_RADIUS): HexCoord[] {
  const coords: HexCoord[] = [];
  for (let q = -radius; q <= radius; q++) {
    const r1 = Math.max(-radius, -q - radius);
    const r2 = Math.min(radius, -q + radius);
    for (let r = r1; r <= r2; r++) {
      coords.push({ q, r });
    }
  }
  return coords;
}

/** Total hex count for radius 7 = 169 hexes. */
export const TOTAL_HEXES = generateMapCoords().length;

/**
 * Assign starting factions and hex types for a new season.
 * Each faction gets a wedge of the hex grid radiating from their capital.
 * Neutral hexes fill the center and gaps.
 */
export function generateInitialMap(radius: number = MAP_RADIUS): Omit<RiftHex, "id">[] {
  const coords = generateMapCoords(radius);

  // Faction capitals placed at 120-degree intervals on the edge
  const capitalPositions: Record<Faction, HexCoord> = {
    crimson: { q: radius, r: -Math.floor(radius / 2) },
    verdant: { q: -radius, r: Math.floor(radius / 2) },
    azure: { q: 0, r: -radius },
  };

  // Fortress positions (inner ring around capitals)
  const fortressSet = new Set<string>();
  for (const faction of ["crimson", "verdant", "azure"] as Faction[]) {
    const cap = capitalPositions[faction];
    for (const n of hexNeighbors(cap)) {
      if (coords.some((c) => hexEquals(c, n))) {
        fortressSet.add(hexKey(n));
      }
    }
  }

  // Assign factions based on proximity to capitals
  const factions: Faction[] = ["crimson", "verdant", "azure"];

  return coords.map((coord) => {
    let faction: Faction | null = null;
    let hexType: HexType = "plains";

    // Check if this is a capital
    for (const f of factions) {
      if (hexEquals(coord, capitalPositions[f])) {
        faction = f;
        hexType = "capital";
        break;
      }
    }

    if (!faction) {
      // Check if this is a fortress
      if (fortressSet.has(hexKey(coord))) {
        hexType = "fortress";
        // Assign to nearest capital's faction
        let minDist = Infinity;
        for (const f of factions) {
          const d = hexDistance(coord, capitalPositions[f]);
          if (d < minDist) {
            minDist = d;
            faction = f;
          }
        }
      } else {
        // Assign territory: hexes within distance 3 of a capital belong to that faction
        const TERRITORY_RADIUS = 3;
        let minDist = Infinity;
        let closest: Faction | null = null;
        for (const f of factions) {
          const d = hexDistance(coord, capitalPositions[f]);
          if (d <= TERRITORY_RADIUS && d < minDist) {
            minDist = d;
            closest = f;
          }
        }
        faction = closest;
      }
    }

    // Scatter some ruins in neutral territory
    if (!faction && hexDistance(coord, { q: 0, r: 0 }) <= 2) {
      const hash = ((coord.q * 7 + coord.r * 13) >>> 0) % 5;
      if (hash === 0) hexType = "ruins";
    }

    return {
      q: coord.q,
      r: coord.r,
      hexType,
      faction,
      capturedAt: faction ? new Date().toISOString() : null,
      capturedBy: null,
      seasonId: 0, // set by caller
    };
  });
}

// ── Map queries ──────────────────────────────────────────────────────────────

/** Build a lookup map from hex coordinates to hex data. */
export function buildHexMap(hexes: RiftHex[]): Map<string, RiftHex> {
  const map = new Map<string, RiftHex>();
  for (const hex of hexes) {
    map.set(hexKey(hex), hex);
  }
  return map;
}

/** Check if a hex is attackable by the given faction (adjacent to friendly territory). */
export function isAttackable(
  target: HexCoord,
  attackerFaction: Faction,
  hexMap: Map<string, RiftHex>,
): boolean {
  const targetHex = hexMap.get(hexKey(target));
  if (!targetHex) return false;
  // Can't attack own faction's hex
  if (targetHex.faction === attackerFaction) return false;

  // Must be adjacent to at least one friendly hex
  const neighbors = hexNeighbors(target);
  return neighbors.some((n) => {
    const nh = hexMap.get(hexKey(n));
    return nh?.faction === attackerFaction;
  });
}

/** Get all hexes belonging to a faction. */
export function getFactionHexes(hexes: RiftHex[], faction: Faction): RiftHex[] {
  return hexes.filter((h) => h.faction === faction);
}

/** Count hexes per faction. */
export function countFactionHexes(hexes: RiftHex[]): Record<Faction, number> {
  const counts: Record<Faction, number> = { crimson: 0, verdant: 0, azure: 0 };
  for (const hex of hexes) {
    if (hex.faction) counts[hex.faction]++;
  }
  return counts;
}

/** Get the defense multiplier for a hex type. */
export function getDefenseMultiplier(hexType: HexType): number {
  switch (hexType) {
    case "fortress": return 2;
    case "capital": return 3;
    case "ruins": return 1;
    case "plains": return 1;
  }
}

// ── Rendering helpers ────────────────────────────────────────────────────────

/** Draw a single pointy-top hexagon path on a Canvas context. */
export function drawHexPath(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
): void {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30);
    const x = cx + size * Math.cos(angle);
    const y = cy + size * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

/** Get hex fill color with faction tint. */
export function getHexFillColor(hex: RiftHex, isHovered: boolean): string {
  const alpha = isHovered ? 0.85 : 0.6;

  if (!hex.faction) {
    // Neutral
    if (hex.hexType === "ruins") return `rgba(168, 85, 247, ${alpha * 0.5})`;
    return `rgba(200, 200, 190, ${isHovered ? 0.5 : 0.3})`;
  }

  const colors: Record<Faction, string> = {
    crimson: `rgba(255, 107, 107, ${alpha})`,
    verdant: `rgba(34, 197, 94, ${alpha})`,
    azure: `rgba(69, 183, 209, ${alpha})`,
  };

  return colors[hex.faction];
}

/** Get hex border color. */
export function getHexBorderColor(hex: RiftHex): string {
  if (!hex.faction) {
    if (hex.hexType === "ruins") return "rgba(168, 85, 247, 0.4)";
    return "rgba(0, 0, 0, 0.1)";
  }

  const colors: Record<Faction, string> = {
    crimson: "rgba(255, 107, 107, 0.8)",
    verdant: "rgba(34, 197, 94, 0.8)",
    azure: "rgba(69, 183, 209, 0.8)",
  };

  return colors[hex.faction];
}

/** Get the icon/symbol for a hex type. */
export function getHexIcon(hexType: HexType): string {
  switch (hexType) {
    case "capital": return "\u265A"; // crown/king
    case "fortress": return "\u26EA"; // castle
    case "ruins": return "\u2728"; // sparkles
    case "plains": return "";
  }
}
