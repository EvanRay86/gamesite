// PixelVille — Item catalog constants (client-side mirror of DB seed data)

import type { CropDef } from "@/types/pixelville";

// ---------------------------------------------------------------------------
// Crop definitions
// ---------------------------------------------------------------------------

export const CROPS: CropDef[] = [
  {
    seedItemId: "tomato_seed",
    cropItemId: "tomato",
    name: "Tomato",
    growTimeMs: 60_000,
    sellPrice: 15,
    xpReward: 5,
    energyCost: 2,
    stages: 4,
  },
  {
    seedItemId: "corn_seed",
    cropItemId: "corn",
    name: "Corn",
    growTimeMs: 120_000,
    sellPrice: 25,
    xpReward: 8,
    energyCost: 2,
    stages: 4,
  },
  {
    seedItemId: "pumpkin_seed",
    cropItemId: "pumpkin",
    name: "Pumpkin",
    growTimeMs: 180_000,
    sellPrice: 40,
    xpReward: 12,
    energyCost: 3,
    stages: 4,
  },
  {
    seedItemId: "sunflower_seed",
    cropItemId: "sunflower",
    name: "Sunflower",
    growTimeMs: 90_000,
    sellPrice: 20,
    xpReward: 7,
    energyCost: 2,
    stages: 4,
  },
  {
    seedItemId: "strawberry_seed",
    cropItemId: "strawberry",
    name: "Strawberry",
    growTimeMs: 150_000,
    sellPrice: 35,
    xpReward: 10,
    energyCost: 3,
    stages: 4,
  },
  {
    seedItemId: "carrot_seed",
    cropItemId: "carrot",
    name: "Carrot",
    growTimeMs: 75_000,
    sellPrice: 18,
    xpReward: 6,
    energyCost: 2,
    stages: 4,
  },
];

export function getCropBySeedId(seedId: string): CropDef | undefined {
  return CROPS.find((c) => c.seedItemId === seedId);
}

export function getCropStage(plantedAt: number, growTimeMs: number): number {
  const elapsed = Date.now() - plantedAt;
  if (elapsed >= growTimeMs) return 3; // ready
  const progress = elapsed / growTimeMs;
  if (progress >= 0.66) return 2;
  if (progress >= 0.33) return 1;
  return 0;
}

export function isCropReady(plantedAt: number, growTimeMs: number): boolean {
  return Date.now() - plantedAt >= growTimeMs;
}

// ---------------------------------------------------------------------------
// Public room IDs
// ---------------------------------------------------------------------------

export const PUBLIC_ROOMS = {
  TOWN_SQUARE: "00000000-0000-0000-0000-000000000001",
  MARKET: "00000000-0000-0000-0000-000000000002",
  PARK: "00000000-0000-0000-0000-000000000003",
} as const;
