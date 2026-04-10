// Procedural dungeon generation for ECHO
// Generates grid-based dungeons with rooms, corridors, and interactables

import type {
  DungeonMap,
  Tile,
  TileType,
  Room,
  DifficultyTier,
  Enemy,
  EnemyDef,
} from "@/types/echo";
import { GRID_W, GRID_H } from "@/types/echo";

// ── Seeded RNG ──────────────────────────────────────────────────────────────

export function dateToSeed(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) || 1;
}

export function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ── Tier Configuration ──────────────────────────────────────────────────────

interface TierConfig {
  roomCount: [number, number];
  minRoomSize: number;
  maxRoomSize: number;
  plateCount: [number, number];
  leverCount: [number, number];
  keyCount: [number, number];
  patrolCount: [number, number];
  chaseCount: [number, number];
  guardCount: [number, number];
  spikeCount: [number, number];
  timedGateCount: [number, number];
}

const TIER_CONFIG: Record<DifficultyTier, TierConfig> = {
  1: {
    roomCount: [3, 4],
    minRoomSize: 4,
    maxRoomSize: 7,
    plateCount: [1, 2],
    leverCount: [0, 1],
    keyCount: [0, 0],
    patrolCount: [0, 1],
    chaseCount: [0, 0],
    guardCount: [0, 0],
    spikeCount: [0, 1],
    timedGateCount: [0, 0],
  },
  2: {
    roomCount: [4, 6],
    minRoomSize: 4,
    maxRoomSize: 7,
    plateCount: [2, 3],
    leverCount: [1, 2],
    keyCount: [1, 1],
    patrolCount: [1, 2],
    chaseCount: [0, 1],
    guardCount: [0, 1],
    spikeCount: [1, 2],
    timedGateCount: [0, 1],
  },
  3: {
    roomCount: [5, 7],
    minRoomSize: 3,
    maxRoomSize: 6,
    plateCount: [2, 4],
    leverCount: [1, 2],
    keyCount: [1, 2],
    patrolCount: [2, 3],
    chaseCount: [1, 2],
    guardCount: [1, 2],
    spikeCount: [2, 3],
    timedGateCount: [1, 2],
  },
  4: {
    roomCount: [6, 8],
    minRoomSize: 3,
    maxRoomSize: 6,
    plateCount: [3, 5],
    leverCount: [2, 3],
    keyCount: [2, 3],
    patrolCount: [2, 4],
    chaseCount: [2, 3],
    guardCount: [1, 3],
    spikeCount: [3, 5],
    timedGateCount: [1, 3],
  },
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function randInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function roomsOverlap(a: Room, b: Room, padding: number = 1): boolean {
  return !(
    a.x + a.w + padding <= b.x ||
    b.x + b.w + padding <= a.x ||
    a.y + a.h + padding <= b.y ||
    b.y + b.h + padding <= a.y
  );
}

// ── Room Placement ──────────────────────────────────────────────────────────

function generateRooms(
  rng: () => number,
  count: number,
  minSize: number,
  maxSize: number,
): Room[] {
  const rooms: Room[] = [];
  let attempts = 0;
  const maxAttempts = 300;

  while (rooms.length < count && attempts < maxAttempts) {
    attempts++;
    const w = randInt(rng, minSize, maxSize);
    const h = randInt(rng, minSize, maxSize);
    const x = randInt(rng, 1, GRID_W - w - 1);
    const y = randInt(rng, 1, GRID_H - h - 1);
    const room: Room = { x, y, w, h, id: rooms.length };

    if (!rooms.some((r) => roomsOverlap(r, room, 2))) {
      rooms.push(room);
    }
  }

  return rooms;
}

// ── Corridor Carving ────────────────────────────────────────────────────────

function carveCorridor(
  tiles: Tile[][],
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  rng: () => number,
) {
  let cx = x1;
  let cy = y1;

  // Randomly choose horizontal-first or vertical-first
  const horizFirst = rng() < 0.5;

  if (horizFirst) {
    while (cx !== x2) {
      if (cx >= 0 && cx < GRID_W && cy >= 0 && cy < GRID_H) {
        if (tiles[cy][cx].type === "wall") tiles[cy][cx] = { type: "floor" };
      }
      cx += cx < x2 ? 1 : -1;
    }
    while (cy !== y2) {
      if (cx >= 0 && cx < GRID_W && cy >= 0 && cy < GRID_H) {
        if (tiles[cy][cx].type === "wall") tiles[cy][cx] = { type: "floor" };
      }
      cy += cy < y2 ? 1 : -1;
    }
  } else {
    while (cy !== y2) {
      if (cx >= 0 && cx < GRID_W && cy >= 0 && cy < GRID_H) {
        if (tiles[cy][cx].type === "wall") tiles[cy][cx] = { type: "floor" };
      }
      cy += cy < y2 ? 1 : -1;
    }
    while (cx !== x2) {
      if (cx >= 0 && cx < GRID_W && cy >= 0 && cy < GRID_H) {
        if (tiles[cy][cx].type === "wall") tiles[cy][cx] = { type: "floor" };
      }
      cx += cx < x2 ? 1 : -1;
    }
  }

  // Carve final tile
  if (cx >= 0 && cx < GRID_W && cy >= 0 && cy < GRID_H) {
    if (tiles[cy][cx].type === "wall") tiles[cy][cx] = { type: "floor" };
  }
}

// ── Get Floor Tiles ─────────────────────────────────────────────────────────

function getFloorTiles(tiles: Tile[][]): [number, number][] {
  const result: [number, number][] = [];
  for (let y = 1; y < GRID_H - 1; y++) {
    for (let x = 1; x < GRID_W - 1; x++) {
      if (tiles[y][x].type === "floor") result.push([x, y]);
    }
  }
  return result;
}

function getRoomFloorTiles(
  tiles: Tile[][],
  room: Room,
): [number, number][] {
  const result: [number, number][] = [];
  for (let y = room.y; y < room.y + room.h; y++) {
    for (let x = room.x; x < room.x + room.w; x++) {
      if (tiles[y][x].type === "floor") result.push([x, y]);
    }
  }
  return result;
}

// ── Place Interactables ─────────────────────────────────────────────────────

function findDoorPosition(
  tiles: Tile[][],
  rooms: Room[],
  targetRoom: Room,
  rng: () => number,
): [number, number] | null {
  // Find corridor entry points around the room
  const candidates: [number, number][] = [];

  // Check edges of room for adjacent corridor tiles
  for (let x = targetRoom.x; x < targetRoom.x + targetRoom.w; x++) {
    // Top edge
    if (targetRoom.y > 0 && tiles[targetRoom.y - 1][x].type === "floor") {
      // Check if this is a corridor tile (not part of another room)
      const isInRoom = rooms.some(
        (r) =>
          r.id !== targetRoom.id &&
          x >= r.x &&
          x < r.x + r.w &&
          targetRoom.y - 1 >= r.y &&
          targetRoom.y - 1 < r.y + r.h,
      );
      if (!isInRoom) candidates.push([x, targetRoom.y - 1]);
    }
    // Bottom edge
    const by = targetRoom.y + targetRoom.h;
    if (by < GRID_H && tiles[by][x].type === "floor") {
      const isInRoom = rooms.some(
        (r) =>
          r.id !== targetRoom.id &&
          x >= r.x &&
          x < r.x + r.w &&
          by >= r.y &&
          by < r.y + r.h,
      );
      if (!isInRoom) candidates.push([x, by]);
    }
  }
  for (let y = targetRoom.y; y < targetRoom.y + targetRoom.h; y++) {
    // Left edge
    if (targetRoom.x > 0 && tiles[y][targetRoom.x - 1].type === "floor") {
      const isInRoom = rooms.some(
        (r) =>
          r.id !== targetRoom.id &&
          targetRoom.x - 1 >= r.x &&
          targetRoom.x - 1 < r.x + r.w &&
          y >= r.y &&
          y < r.y + r.h,
      );
      if (!isInRoom) candidates.push([targetRoom.x - 1, y]);
    }
    // Right edge
    const rx = targetRoom.x + targetRoom.w;
    if (rx < GRID_W && tiles[y][rx].type === "floor") {
      const isInRoom = rooms.some(
        (r) =>
          r.id !== targetRoom.id &&
          rx >= r.x &&
          rx < r.x + r.w &&
          y >= r.y &&
          y < r.y + r.h,
      );
      if (!isInRoom) candidates.push([rx, y]);
    }
  }

  if (candidates.length === 0) return null;
  return candidates[Math.floor(rng() * candidates.length)];
}

// ── Main Generator ──────────────────────────────────────────────────────────

export interface GeneratedDungeon {
  map: DungeonMap;
  enemies: Enemy[];
}

export function generateDungeon(
  seed: number,
  tier: DifficultyTier,
): GeneratedDungeon {
  const rng = seededRandom(seed);
  const config = TIER_CONFIG[tier];

  // Initialize all walls
  const tiles: Tile[][] = [];
  for (let y = 0; y < GRID_H; y++) {
    tiles[y] = [];
    for (let x = 0; x < GRID_W; x++) {
      tiles[y][x] = { type: "wall" };
    }
  }

  // Generate rooms
  const roomCount = randInt(rng, config.roomCount[0], config.roomCount[1]);
  const rooms = generateRooms(rng, roomCount, config.minRoomSize, config.maxRoomSize);

  // Carve rooms
  for (const room of rooms) {
    for (let y = room.y; y < room.y + room.h; y++) {
      for (let x = room.x; x < room.x + room.w; x++) {
        tiles[y][x] = { type: "floor" };
      }
    }
  }

  // Connect rooms with corridors (MST-like: connect each room to next)
  for (let i = 0; i < rooms.length - 1; i++) {
    const a = rooms[i];
    const b = rooms[i + 1];
    const ax = Math.floor(a.x + a.w / 2);
    const ay = Math.floor(a.y + a.h / 2);
    const bx = Math.floor(b.x + b.w / 2);
    const by = Math.floor(b.y + b.h / 2);
    carveCorridor(tiles, ax, ay, bx, by, rng);
  }

  // Add a few extra corridors for loops
  if (rooms.length > 3) {
    const extraCorridors = randInt(rng, 1, Math.min(3, rooms.length - 2));
    for (let i = 0; i < extraCorridors; i++) {
      const a = rooms[randInt(rng, 0, rooms.length - 1)];
      const b = rooms[randInt(rng, 0, rooms.length - 1)];
      if (a.id !== b.id) {
        carveCorridor(
          tiles,
          Math.floor(a.x + a.w / 2),
          Math.floor(a.y + a.h / 2),
          Math.floor(b.x + b.w / 2),
          Math.floor(b.y + b.h / 2),
          rng,
        );
      }
    }
  }

  // Place spawn in first room, exit in last room
  const spawnRoom = rooms[0];
  const exitRoom = rooms[rooms.length - 1];
  const spawnX = Math.floor(spawnRoom.x + spawnRoom.w / 2);
  const spawnY = Math.floor(spawnRoom.y + spawnRoom.h / 2);
  const exitX = Math.floor(exitRoom.x + exitRoom.w / 2);
  const exitY = Math.floor(exitRoom.y + exitRoom.h / 2);

  tiles[spawnY][spawnX] = { type: "spawn" };
  tiles[exitY][exitX] = { type: "exit" };

  // Track used positions
  const used = new Set<string>();
  used.add(`${spawnX},${spawnY}`);
  used.add(`${exitX},${exitY}`);

  function pickFloorInRoom(room: Room): [number, number] | null {
    const candidates = getRoomFloorTiles(tiles, room).filter(
      ([x, y]) => !used.has(`${x},${y}`),
    );
    if (candidates.length === 0) return null;
    const pick = candidates[Math.floor(rng() * candidates.length)];
    used.add(`${pick[0]},${pick[1]}`);
    return pick;
  }

  function pickAnyFloor(): [number, number] | null {
    const candidates = getFloorTiles(tiles).filter(
      ([x, y]) => !used.has(`${x},${y}`),
    );
    if (candidates.length === 0) return null;
    const pick = candidates[Math.floor(rng() * candidates.length)];
    used.add(`${pick[0]},${pick[1]}`);
    return pick;
  }

  // ── Place doors with pressure plates ──────────────────────────────────
  let linkCounter = 0;

  const plateCount = randInt(rng, config.plateCount[0], config.plateCount[1]);
  for (let i = 0; i < plateCount; i++) {
    // Pick a room to gate (not spawn room)
    const gateRoomIdx = randInt(rng, 1, rooms.length - 1);
    const gateRoom = rooms[gateRoomIdx];

    // Find a door position
    const doorPos = findDoorPosition(tiles, rooms, gateRoom, rng);
    if (!doorPos) continue;

    // Place plate in a different room
    const plateRoomIdx = randInt(rng, 0, rooms.length - 1);
    const platePos = pickFloorInRoom(rooms[plateRoomIdx]);
    if (!platePos) continue;

    const linkId = `plate_${linkCounter++}`;
    tiles[doorPos[1]][doorPos[0]] = { type: "door", linkId, open: false };
    tiles[platePos[1]][platePos[0]] = { type: "pressure_plate", linkId };
  }

  // ── Place levers with doors ───────────────────────────────────────────
  const leverCount = randInt(rng, config.leverCount[0], config.leverCount[1]);
  for (let i = 0; i < leverCount; i++) {
    const gateRoomIdx = randInt(rng, 1, rooms.length - 1);
    const gateRoom = rooms[gateRoomIdx];
    const doorPos = findDoorPosition(tiles, rooms, gateRoom, rng);
    if (!doorPos) continue;

    const leverPos = pickAnyFloor();
    if (!leverPos) continue;

    const linkId = `lever_${linkCounter++}`;
    tiles[doorPos[1]][doorPos[0]] = { type: "door", linkId, open: false };
    tiles[leverPos[1]][leverPos[0]] = { type: "lever", linkId };
  }

  // ── Place keys and locked doors ───────────────────────────────────────
  const keyCount = randInt(rng, config.keyCount[0], config.keyCount[1]);
  for (let i = 0; i < keyCount; i++) {
    const gateRoomIdx = randInt(rng, 1, rooms.length - 1);
    const gateRoom = rooms[gateRoomIdx];
    const doorPos = findDoorPosition(tiles, rooms, gateRoom, rng);
    if (!doorPos) continue;

    const keyPos = pickAnyFloor();
    if (!keyPos) continue;

    const linkId = `key_${linkCounter++}`;
    tiles[doorPos[1]][doorPos[0]] = { type: "locked_door", linkId, open: false };
    tiles[keyPos[1]][keyPos[0]] = { type: "key", linkId, consumed: false };
  }

  // ── Place spike traps ─────────────────────────────────────────────────
  const spikeCount = randInt(rng, config.spikeCount[0], config.spikeCount[1]);
  for (let i = 0; i < spikeCount; i++) {
    const pos = pickAnyFloor();
    if (pos) tiles[pos[1]][pos[0]] = { type: "spike_trap" };
  }

  // ── Place timed gates ─────────────────────────────────────────────────
  const timedGateCount = randInt(rng, config.timedGateCount[0], config.timedGateCount[1]);
  for (let i = 0; i < timedGateCount; i++) {
    const gateRoomIdx = randInt(rng, 1, rooms.length - 1);
    const gateRoom = rooms[gateRoomIdx];
    const doorPos = findDoorPosition(tiles, rooms, gateRoom, rng);
    if (!doorPos) continue;

    const platePos = pickAnyFloor();
    if (!platePos) continue;

    const linkId = `timed_${linkCounter++}`;
    const duration = randInt(rng, 5, 10);
    tiles[doorPos[1]][doorPos[0]] = {
      type: "timed_gate",
      linkId,
      open: false,
      timer: 0,
      timerMax: duration,
    };
    tiles[platePos[1]][platePos[0]] = { type: "pressure_plate", linkId };
  }

  // ── Place enemies ─────────────────────────────────────────────────────
  const enemies: Enemy[] = [];
  let enemyId = 0;

  // Patrol enemies
  const patrolCount = randInt(rng, config.patrolCount[0], config.patrolCount[1]);
  for (let i = 0; i < patrolCount; i++) {
    // Pick a room (not spawn) and create a patrol route
    const roomIdx = randInt(rng, 1, rooms.length - 1);
    const room = rooms[roomIdx];
    const roomFloor = getRoomFloorTiles(tiles, room).filter(
      ([x, y]) => !used.has(`${x},${y}`),
    );
    if (roomFloor.length < 2) continue;

    // Pick 2-3 waypoints
    const wpCount = Math.min(randInt(rng, 2, 3), roomFloor.length);
    const waypoints: [number, number][] = [];
    const available = [...roomFloor];
    for (let j = 0; j < wpCount; j++) {
      const idx = Math.floor(rng() * available.length);
      waypoints.push(available[idx]);
      available.splice(idx, 1);
    }

    const start = waypoints[0];
    used.add(`${start[0]},${start[1]}`);
    enemies.push({
      id: enemyId++,
      x: start[0],
      y: start[1],
      def: { type: "patrol", patrol: waypoints, patrolIndex: 0, patrolDir: 1 },
      alive: true,
    });
  }

  // Chase enemies
  const chaseCount = randInt(rng, config.chaseCount[0], config.chaseCount[1]);
  for (let i = 0; i < chaseCount; i++) {
    const pos = pickAnyFloor();
    if (!pos) continue;
    enemies.push({
      id: enemyId++,
      x: pos[0],
      y: pos[1],
      def: { type: "chase" },
      alive: true,
    });
  }

  // Guard enemies
  const guardCount = randInt(rng, config.guardCount[0], config.guardCount[1]);
  for (let i = 0; i < guardCount; i++) {
    const pos = pickAnyFloor();
    if (!pos) continue;
    enemies.push({
      id: enemyId++,
      x: pos[0],
      y: pos[1],
      def: { type: "guard" },
      alive: true,
    });
  }

  const map: DungeonMap = {
    width: GRID_W,
    height: GRID_H,
    tiles,
    spawnX,
    spawnY,
    exitX,
    exitY,
    seed,
    tier,
  };

  return { map, enemies };
}
