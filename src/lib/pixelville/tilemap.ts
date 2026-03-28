// PixelVille — Tile map generation and management

import type { TileType, TileMapData, RoomType } from "@/types/pixelville";

const TILE = 32;

// ---------------------------------------------------------------------------
// Generate a tile map for a room
// ---------------------------------------------------------------------------

export function generateRoomMap(
  type: RoomType,
  width: number,
  height: number,
  background: string,
): TileMapData {
  const tiles: TileType[][] = [];
  const collisions: boolean[][] = [];

  for (let y = 0; y < height; y++) {
    tiles[y] = [];
    collisions[y] = [];
    for (let x = 0; x < width; x++) {
      tiles[y][x] = background as TileType;
      collisions[y][x] = false;
    }
  }

  // Add walls around the border
  for (let x = 0; x < width; x++) {
    tiles[0][x] = "wall";
    collisions[0][x] = true;
    tiles[height - 1][x] = "wall";
    collisions[height - 1][x] = true;
  }
  for (let y = 0; y < height; y++) {
    tiles[y][0] = "wall";
    collisions[y][0] = true;
    tiles[y][width - 1] = "wall";
    collisions[y][width - 1] = true;
  }

  // Room-type-specific features
  switch (type) {
    case "town_square":
      addPaths(tiles, width, height);
      break;
    case "market":
      addWoodFloor(tiles, width, height);
      break;
    case "park":
      addPond(tiles, collisions, width, height);
      break;
    case "home":
    case "farm":
      addFarmPlots(tiles, width, height);
      break;
  }

  return { width, height, tiles, collisions };
}

function addPaths(tiles: TileType[][], w: number, h: number) {
  // Cross-shaped stone paths through the center
  const midX = Math.floor(w / 2);
  const midY = Math.floor(h / 2);
  for (let x = 1; x < w - 1; x++) {
    tiles[midY][x] = "stone";
    if (midY + 1 < h - 1) tiles[midY + 1][x] = "stone";
  }
  for (let y = 1; y < h - 1; y++) {
    tiles[y][midX] = "stone";
    if (midX + 1 < w - 1) tiles[y][midX + 1] = "stone";
  }
}

function addWoodFloor(tiles: TileType[][], w: number, h: number) {
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      tiles[y][x] = "wood";
    }
  }
}

function addPond(tiles: TileType[][], collisions: boolean[][], w: number, h: number) {
  // Small pond in one area
  const cx = Math.floor(w * 0.7);
  const cy = Math.floor(h * 0.3);
  const r = 3;
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy <= r * r) {
        const tx = cx + dx;
        const ty = cy + dy;
        if (tx > 0 && tx < w - 1 && ty > 0 && ty < h - 1) {
          tiles[ty][tx] = "water";
          collisions[ty][tx] = true;
        }
      }
    }
  }
  // Sand border around pond
  for (let dy = -r - 1; dy <= r + 1; dy++) {
    for (let dx = -r - 1; dx <= r + 1; dx++) {
      const dist = dx * dx + dy * dy;
      if (dist > r * r && dist <= (r + 1) * (r + 1)) {
        const tx = cx + dx;
        const ty = cy + dy;
        if (tx > 0 && tx < w - 1 && ty > 0 && ty < h - 1 && tiles[ty][tx] !== "water") {
          tiles[ty][tx] = "sand";
        }
      }
    }
  }
  // Paths
  addPaths(tiles, w, h);
}

function addFarmPlots(tiles: TileType[][], w: number, h: number) {
  // Dirt farm plots in center area
  const startX = Math.floor(w * 0.25);
  const endX = Math.floor(w * 0.75);
  const startY = Math.floor(h * 0.4);
  const endY = Math.floor(h * 0.75);

  for (let y = startY; y <= endY; y++) {
    for (let x = startX; x <= endX; x++) {
      if (x > 0 && x < w - 1 && y > 0 && y < h - 1) {
        tiles[y][x] = "dirt";
      }
    }
  }
  // Stone path to farm area
  const midX = Math.floor(w / 2);
  for (let y = 1; y < startY; y++) {
    tiles[y][midX] = "stone";
  }
}

// ---------------------------------------------------------------------------
// Collision checking
// ---------------------------------------------------------------------------

export function isWalkable(map: TileMapData, tileX: number, tileY: number): boolean {
  if (tileX < 0 || tileX >= map.width || tileY < 0 || tileY >= map.height) return false;
  return !map.collisions[tileY][tileX];
}

// ---------------------------------------------------------------------------
// Cache the ground layer to an offscreen canvas
// ---------------------------------------------------------------------------

export function renderGroundCache(
  map: TileMapData,
  drawTileFn: (ctx: CanvasRenderingContext2D, tileType: string, x: number, y: number, frame: number) => void,
  frame: number,
): OffscreenCanvas {
  const canvas = new OffscreenCanvas(map.width * TILE, map.height * TILE);
  const ctx = canvas.getContext("2d")!;
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      drawTileFn(ctx as unknown as CanvasRenderingContext2D, map.tiles[y][x], x * TILE, y * TILE, frame);
    }
  }
  return canvas;
}

export { TILE };
