// Interactable logic for ECHO
// Pressure plates, levers, keys, spike traps, timed gates

import type { Tile, Echo, GameState } from "@/types/echo";

// ── Pressure Plates ─────────────────────────────────────────────────────────

/**
 * Recalculate all pressure plate states based on who's standing on them.
 * Plates are held down while any entity (player or echo) stands on them.
 * Timed gates get their timer reset when triggered.
 */
export function updatePressurePlates(state: GameState): void {
  const { dungeon, player, echoes, doorStates } = state;
  const { tiles } = dungeon;

  // First, close all plate-linked doors
  for (let y = 0; y < dungeon.height; y++) {
    for (let x = 0; x < dungeon.width; x++) {
      const tile = tiles[y][x];
      if (tile.type === "pressure_plate" && tile.linkId) {
        // Reset this plate's door to closed (will open if someone is on it)
        doorStates[tile.linkId] = false;
      }
    }
  }

  // Then check what's standing on each plate
  for (let y = 0; y < dungeon.height; y++) {
    for (let x = 0; x < dungeon.width; x++) {
      const tile = tiles[y][x];
      if (tile.type !== "pressure_plate" || !tile.linkId) continue;

      let occupied = false;

      // Check player
      if (player.alive && player.x === x && player.y === y) occupied = true;

      // Check echoes
      if (!occupied) {
        for (const echo of echoes) {
          if (echo.alive && echo.x === x && echo.y === y) {
            occupied = true;
            break;
          }
        }
      }

      if (occupied) {
        doorStates[tile.linkId] = true;

        // If this is linked to a timed gate, reset its timer
        for (let ty = 0; ty < dungeon.height; ty++) {
          for (let tx = 0; tx < dungeon.width; tx++) {
            const target = tiles[ty][tx];
            if (target.type === "timed_gate" && target.linkId === tile.linkId) {
              target.timer = target.timerMax ?? 8;
            }
          }
        }
      }
    }
  }
}

// ── Levers ──────────────────────────────────────────────────────────────────

/**
 * Toggle a lever at the given position. Returns true if a lever was toggled.
 */
export function toggleLever(
  tiles: Tile[][],
  doorStates: Record<string, boolean>,
  x: number,
  y: number,
): boolean {
  const tile = tiles[y][x];
  if (tile.type !== "lever" || !tile.linkId) return false;

  // Toggle the linked door permanently
  doorStates[tile.linkId] = !doorStates[tile.linkId];
  return true;
}

/**
 * Check if an entity just stepped onto a lever and toggle it.
 */
export function checkLeverInteraction(
  state: GameState,
  x: number,
  y: number,
): void {
  const tile = state.dungeon.tiles[y][x];
  if (tile.type === "lever" && tile.linkId) {
    toggleLever(state.dungeon.tiles, state.doorStates, x, y);
  }
}

// ── Keys & Locked Doors ─────────────────────────────────────────────────────

/**
 * Check if an entity stepped on a key and pick it up.
 * Returns the linkId of the picked-up key, or null.
 */
export function checkKeyPickup(
  tiles: Tile[][],
  x: number,
  y: number,
): string | null {
  const tile = tiles[y][x];
  if (tile.type === "key" && !tile.consumed && tile.linkId) {
    tile.consumed = true;
    return tile.linkId;
  }
  return null;
}

/**
 * Try to use a key to open a locked door adjacent to (x, y).
 * Returns true if a door was opened.
 */
export function tryUnlockDoor(
  tiles: Tile[][],
  doorStates: Record<string, boolean>,
  x: number,
  y: number,
  keyLinkId: string,
): boolean {
  // Check all adjacent tiles for the matching locked door
  const dirs = [
    [0, -1],
    [0, 1],
    [-1, 0],
    [1, 0],
  ];
  for (const [dx, dy] of dirs) {
    const nx = x + dx;
    const ny = y + dy;
    if (ny < 0 || ny >= tiles.length || nx < 0 || nx >= tiles[0].length) continue;

    const tile = tiles[ny][nx];
    if (tile.type === "locked_door" && tile.linkId === keyLinkId) {
      doorStates[keyLinkId] = true;
      return true;
    }
  }
  return false;
}

// ── Timed Gates ─────────────────────────────────────────────────────────────

/**
 * Tick all timed gates. Closes them when timer hits 0.
 */
export function tickTimedGates(state: GameState): void {
  const { dungeon, doorStates } = state;

  for (let y = 0; y < dungeon.height; y++) {
    for (let x = 0; x < dungeon.width; x++) {
      const tile = dungeon.tiles[y][x];
      if (tile.type !== "timed_gate" || !tile.linkId) continue;

      if (tile.timer !== undefined && tile.timer > 0) {
        tile.timer--;
        if (tile.timer <= 0) {
          doorStates[tile.linkId] = false;
        }
      }
    }
  }
}

// ── Spike Traps ─────────────────────────────────────────────────────────────

/**
 * Check if an entity at (x, y) is on a spike trap.
 */
export function isOnSpikeTrap(tiles: Tile[][], x: number, y: number): boolean {
  return tiles[y]?.[x]?.type === "spike_trap";
}
