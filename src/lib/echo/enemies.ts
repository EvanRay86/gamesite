// Enemy AI behaviors for ECHO
// Patrol, Chase, and Guard enemy types

import type { Enemy, Echo, Tile } from "@/types/echo";
import { isWalkable } from "./echo-system";

// ── Patrol Enemy ────────────────────────────────────────────────────────────

function stepPatrol(
  enemy: Enemy,
  tiles: Tile[][],
  doorStates: Record<string, boolean>,
  width: number,
  height: number,
): void {
  const { patrol, patrolIndex = 0, patrolDir = 1 } = enemy.def;
  if (!patrol || patrol.length < 2) return;

  // Move toward current waypoint
  const [tx, ty] = patrol[patrolIndex];
  const dx = Math.sign(tx - enemy.x);
  const dy = Math.sign(ty - enemy.y);

  // Try to move (prefer x first, then y)
  let moved = false;
  if (dx !== 0) {
    const nx = enemy.x + dx;
    if (nx >= 0 && nx < width && isWalkable(tiles[enemy.y][nx], doorStates)) {
      enemy.x = nx;
      moved = true;
    }
  }
  if (!moved && dy !== 0) {
    const ny = enemy.y + dy;
    if (ny >= 0 && ny < height && isWalkable(tiles[ny][enemy.x], doorStates)) {
      enemy.y = ny;
    }
  }

  // Check if reached waypoint
  if (enemy.x === tx && enemy.y === ty) {
    let nextIdx = patrolIndex + patrolDir;
    if (nextIdx >= patrol.length || nextIdx < 0) {
      enemy.def.patrolDir = -patrolDir;
      nextIdx = patrolIndex + (-patrolDir);
    }
    enemy.def.patrolIndex = Math.max(0, Math.min(nextIdx, patrol.length - 1));
  }
}

// ── Chase Enemy ─────────────────────────────────────────────────────────────

function stepChase(
  enemy: Enemy,
  playerX: number,
  playerY: number,
  echoes: Echo[],
  tiles: Tile[][],
  doorStates: Record<string, boolean>,
  width: number,
  height: number,
): void {
  // Find nearest entity (player or echo)
  let nearestX = playerX;
  let nearestY = playerY;
  let nearestDist = Math.abs(playerX - enemy.x) + Math.abs(playerY - enemy.y);

  for (const echo of echoes) {
    if (!echo.alive) continue;
    const dist = Math.abs(echo.x - enemy.x) + Math.abs(echo.y - enemy.y);
    if (dist < nearestDist) {
      nearestX = echo.x;
      nearestY = echo.y;
      nearestDist = dist;
    }
  }

  // Only chase if within detection range (8 tiles)
  if (nearestDist > 8) return;

  // Simple pathfinding: move toward target
  const dx = Math.sign(nearestX - enemy.x);
  const dy = Math.sign(nearestY - enemy.y);

  // Try both directions, prefer the one with greater distance
  const xDist = Math.abs(nearestX - enemy.x);
  const yDist = Math.abs(nearestY - enemy.y);

  let moved = false;
  if (xDist >= yDist && dx !== 0) {
    const nx = enemy.x + dx;
    if (nx >= 0 && nx < width && isWalkable(tiles[enemy.y][nx], doorStates)) {
      enemy.x = nx;
      moved = true;
    }
  }
  if (!moved && dy !== 0) {
    const ny = enemy.y + dy;
    if (ny >= 0 && ny < height && isWalkable(tiles[ny][enemy.x], doorStates)) {
      enemy.y = ny;
      moved = true;
    }
  }
  if (!moved && dx !== 0) {
    const nx = enemy.x + dx;
    if (nx >= 0 && nx < width && isWalkable(tiles[enemy.y][nx], doorStates)) {
      enemy.x = nx;
    }
  }
}

// ── Guard Enemy ─────────────────────────────────────────────────────────────
// Guards don't move — they kill anything adjacent.

// ── Public Step Function ────────────────────────────────────────────────────

export function stepEnemy(
  enemy: Enemy,
  playerX: number,
  playerY: number,
  echoes: Echo[],
  tiles: Tile[][],
  doorStates: Record<string, boolean>,
  width: number,
  height: number,
): void {
  if (!enemy.alive) return;

  switch (enemy.def.type) {
    case "patrol":
      stepPatrol(enemy, tiles, doorStates, width, height);
      break;
    case "chase":
      stepChase(enemy, playerX, playerY, echoes, tiles, doorStates, width, height);
      break;
    case "guard":
      // Guards don't move
      break;
  }
}

/**
 * Check if an entity at (x, y) is killed by any enemy.
 * Returns the enemy that kills, or null.
 */
export function checkEnemyKill(
  enemies: Enemy[],
  x: number,
  y: number,
): Enemy | null {
  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    if (enemy.x === x && enemy.y === y) return enemy;
    // Guard enemies also kill if adjacent
    if (enemy.def.type === "guard") {
      const dist = Math.abs(enemy.x - x) + Math.abs(enemy.y - y);
      if (dist === 1) return enemy;
    }
  }
  return null;
}
