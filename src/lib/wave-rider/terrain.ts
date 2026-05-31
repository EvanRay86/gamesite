// ── Terrain generation from audio data ───────────────────────────────────────

import type { WaveRiderAudioData } from "./audio-analysis";

export interface TerrainPoint {
  x: number;
  height: number; // canvas-space y for the terrain surface (lower = higher on screen)
  isBeat: boolean;
}

export interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  hit: boolean;
}

export interface Collectible {
  x: number;
  y: number;
  collected: boolean;
}

// Pace is time-based, not sample-based: the world scrolls at a fixed speed no
// matter how many samples a song produced. This keeps a 90-second clip and a
// 6-minute track feeling identically brisk.
export const SCROLL_PX_PER_SEC = 210;

const MIN_HEIGHT_RATIO = 0.18; // terrain never lower than 18% of canvas
const MAX_HEIGHT_RATIO = 0.7; // terrain never higher than 70% of canvas
const MIN_OBSTACLE_GAP_PX = 250; // guaranteed breathing room between obstacles
const OBSTACLE_W = 14;
const OBSTACLE_H = 26;

/** Pixel spacing between adjacent terrain samples for this song. */
function segmentWidthFor(audioData: WaveRiderAudioData): number {
  const n = Math.max(1, audioData.amplitudes.length);
  return (audioData.duration * SCROLL_PX_PER_SEC) / n;
}

/** Total world width in pixels (scroll distance over the whole song). */
export function getWorldWidth(audioData: WaveRiderAudioData): number {
  return Math.max(1, audioData.duration * SCROLL_PX_PER_SEC);
}

/** Generate terrain points from audio amplitude data. */
export function generateTerrainPoints(
  audioData: WaveRiderAudioData,
  canvasH: number
): TerrainPoint[] {
  const beatSet = new Set(audioData.beats);
  const segW = segmentWidthFor(audioData);
  const minY = canvasH * (1 - MAX_HEIGHT_RATIO); // highest terrain can go
  const maxY = canvasH * (1 - MIN_HEIGHT_RATIO); // lowest terrain sits

  return audioData.amplitudes.map((amp, i) => ({
    x: i * segW,
    height: maxY - amp * (maxY - minY),
    isBeat: beatSet.has(i),
  }));
}

/** Place obstacles on beats, enforcing a minimum world-distance so it stays fair. */
export function placeObstacles(terrain: TerrainPoint[]): Obstacle[] {
  const obstacles: Obstacle[] = [];
  let lastX = -Infinity;
  for (const pt of terrain) {
    if (!pt.isBeat) continue;
    if (pt.x - lastX < MIN_OBSTACLE_GAP_PX) continue;
    obstacles.push({
      x: pt.x,
      y: pt.height - OBSTACLE_H, // sits above terrain surface
      width: OBSTACLE_W,
      height: OBSTACLE_H,
      hit: false,
    });
    lastX = pt.x;
  }
  return obstacles;
}

/** Distribute collectible orbs above the terrain, steering clear of obstacles. */
export function placeCollectibles(
  terrain: TerrainPoint[],
  obstacles: Obstacle[],
  canvasH: number
): Collectible[] {
  const collectibles: Collectible[] = [];
  if (terrain.length < 2) return collectibles;

  const segW = terrain[1].x - terrain[0].x || 6;
  // One orb roughly every ~170px of travel.
  const step = Math.max(1, Math.round(170 / segW));
  const obstacleXs = obstacles.map((o) => o.x).sort((a, b) => a - b);
  const AVOID_PX = 70; // keep orbs clear of obstacles so you don't trade a hit for a point

  for (let i = step; i < terrain.length; i += step) {
    const x = terrain[i].x;
    const nearObstacle = obstacleXs.some((ox) => Math.abs(ox - x) < AVOID_PX);
    if (nearObstacle) continue;

    // Float 50-90px above the surface — reachable at the top of a jump.
    const y = Math.max(28, Math.min(canvasH - 30, terrain[i].height - 50 - ((i * 37) % 40)));
    collectibles.push({ x, y, collected: false });
  }
  return collectibles;
}
