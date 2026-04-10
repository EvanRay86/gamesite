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

const SEGMENT_WIDTH = 6; // pixels per amplitude sample
const MIN_HEIGHT_RATIO = 0.15; // terrain never lower than 15% of canvas
const MAX_HEIGHT_RATIO = 0.75; // terrain never higher than 75% of canvas

/** Generate terrain points from audio amplitude data. */
export function generateTerrainPoints(
  audioData: WaveRiderAudioData,
  canvasH: number
): TerrainPoint[] {
  const beatSet = new Set(audioData.beats);
  const minY = canvasH * (1 - MAX_HEIGHT_RATIO); // highest terrain can go
  const maxY = canvasH * (1 - MIN_HEIGHT_RATIO); // lowest terrain sits

  return audioData.amplitudes.map((amp, i) => ({
    x: i * SEGMENT_WIDTH,
    height: maxY - amp * (maxY - minY),
    isBeat: beatSet.has(i),
  }));
}

/** Total world width in pixels. */
export function getWorldWidth(amplitudeCount: number): number {
  return amplitudeCount * SEGMENT_WIDTH;
}

/** Place obstacles at beat positions on the terrain surface. */
export function placeObstacles(terrain: TerrainPoint[]): Obstacle[] {
  const obstacles: Obstacle[] = [];
  for (const pt of terrain) {
    if (pt.isBeat) {
      obstacles.push({
        x: pt.x,
        y: pt.height - 30, // sits above terrain surface
        width: 16,
        height: 30,
        hit: false,
      });
    }
  }
  return obstacles;
}

/** Distribute collectible orbs above the terrain. */
export function placeCollectibles(terrain: TerrainPoint[]): Collectible[] {
  const collectibles: Collectible[] = [];
  const spacing = Math.max(20, Math.floor(terrain.length / 80));

  for (let i = spacing; i < terrain.length; i += spacing) {
    // Skip if too close to a beat obstacle
    const nearBeat = terrain.slice(Math.max(0, i - 3), i + 4).some((p) => p.isBeat);
    if (nearBeat) continue;

    collectibles.push({
      x: terrain[i].x,
      y: terrain[i].height - 60 - Math.random() * 40, // floating above terrain
      collected: false,
    });
  }
  return collectibles;
}
