// Echo recording and replay system
// Records player actions per turn, replays them as ghost entities

import type { Action, Echo, Tile, Enemy } from "@/types/echo";
import { ECHO_COLORS } from "@/types/echo";

// ── Recording ───────────────────────────────────────────────────────────────

export function createRecording(): Action[] {
  return [];
}

export function recordAction(recording: Action[], action: Action): void {
  recording.push(action);
}

// ── Echo Creation ───────────────────────────────────────────────────────────

export function createEcho(
  id: number,
  actions: Action[],
  spawnX: number,
  spawnY: number,
): Echo {
  return {
    id,
    actions: [...actions],
    color: ECHO_COLORS[id % ECHO_COLORS.length],
    x: spawnX,
    y: spawnY,
    alive: true,
    hasKey: false,
  };
}

// ── Echo Replay ─────────────────────────────────────────────────────────────

/**
 * Get the action an echo should take on a given turn.
 * Returns "wait" if the echo has run out of recorded actions.
 */
export function getEchoAction(echo: Echo, turn: number): Action {
  if (turn < echo.actions.length) return echo.actions[turn];
  return "wait";
}

/**
 * Compute the target position for a given action from a current position.
 */
export function getTargetPosition(
  x: number,
  y: number,
  action: Action,
): [number, number] {
  switch (action) {
    case "up":
      return [x, y - 1];
    case "down":
      return [x, y + 1];
    case "left":
      return [x - 1, y];
    case "right":
      return [x + 1, y];
    case "wait":
      return [x, y];
  }
}

/**
 * Check if a position is walkable (floor-like tile).
 */
export function isWalkable(
  tile: Tile,
  doorStates: Record<string, boolean>,
): boolean {
  switch (tile.type) {
    case "floor":
    case "spawn":
    case "exit":
    case "pressure_plate":
    case "lever":
    case "spike_trap":
      return true;
    case "key":
      return !tile.consumed;
    case "door":
    case "locked_door":
    case "timed_gate":
      // Check if this door is open
      if (tile.linkId && doorStates[tile.linkId]) return true;
      return tile.open === true;
    case "wall":
      return false;
    default:
      return false;
  }
}

/**
 * Move an echo one step according to its recorded action for this turn.
 * Returns true if the echo moved successfully.
 */
export function stepEcho(
  echo: Echo,
  turn: number,
  tiles: Tile[][],
  doorStates: Record<string, boolean>,
  width: number,
  height: number,
): boolean {
  if (!echo.alive) return false;

  const action = getEchoAction(echo, turn);
  const [nx, ny] = getTargetPosition(echo.x, echo.y, action);

  // Bounds check
  if (nx < 0 || nx >= width || ny < 0 || ny >= height) return false;

  const tile = tiles[ny][nx];
  if (isWalkable(tile, doorStates)) {
    echo.x = nx;
    echo.y = ny;
    return true;
  }

  return false;
}

/**
 * Check if an echo is on a given position.
 */
export function isEchoAt(echoes: Echo[], x: number, y: number): Echo | null {
  for (const echo of echoes) {
    if (echo.alive && echo.x === x && echo.y === y) return echo;
  }
  return null;
}

/**
 * Check if any alive echo (or player at px, py) is adjacent to a position.
 */
export function findNearestEntity(
  echoes: Echo[],
  playerX: number,
  playerY: number,
  fromX: number,
  fromY: number,
): { x: number; y: number; dist: number } | null {
  let best: { x: number; y: number; dist: number } | null = null;

  // Check player
  const playerDist = Math.abs(playerX - fromX) + Math.abs(playerY - fromY);
  best = { x: playerX, y: playerY, dist: playerDist };

  // Check echoes
  for (const echo of echoes) {
    if (!echo.alive) continue;
    const dist = Math.abs(echo.x - fromX) + Math.abs(echo.y - fromY);
    if (!best || dist < best.dist) {
      best = { x: echo.x, y: echo.y, dist };
    }
  }

  return best;
}
