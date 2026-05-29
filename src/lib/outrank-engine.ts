// Outrank — pure, deterministic round generation.
//
// No React, no Supabase: this module must produce byte-identical output on the
// challenger's device and the friend's device given the same (seed, pool,
// allowed categories). That guarantee is what makes "beat my score" fair.

import type { OutrankItem } from "@/types/outrank";

/** Tiny deterministic 32-bit PRNG. Same seed → same stream everywhere. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rngInt(rng: () => number, n: number): number {
  return Math.floor(rng() * n);
}

export type PoolByCategory = Map<string, OutrankItem[]>;

/**
 * Group items by category and sort each group by `id` (stable string sort).
 * Sorting in code makes the pool independent of DB row order / select order,
 * so both players compute the same arrays.
 */
export function buildPoolByCategory(pool: OutrankItem[]): PoolByCategory {
  const map: PoolByCategory = new Map();
  for (const item of pool) {
    const arr = map.get(item.category);
    if (arr) arr.push(item);
    else map.set(item.category, [item]);
  }
  for (const arr of map.values()) {
    arr.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  }
  return map;
}

export interface OutrankPair {
  category: string;
  left: OutrankItem;
  right: OutrankItem;
}

const RECENT_WINDOW = 12;

/**
 * Create a deterministic, endless round. Call `next()` repeatedly to draw the
 * sequence of pairs. Because every random decision is drawn from one seeded
 * `rng` in a fixed order, the Nth pair is fully determined by the seed + pool.
 */
export function createRound(
  seed: number,
  poolByCat: PoolByCategory,
  allowedCategories: string[],
) {
  const rng = mulberry32(seed >>> 0);
  // Only categories with at least two distinct items are playable.
  const cats = allowedCategories.filter(
    (c) => (poolByCat.get(c)?.length ?? 0) >= 2,
  );
  const recent: string[] = [];

  function remember(id: string) {
    recent.push(id);
    while (recent.length > RECENT_WINDOW) recent.shift();
  }

  function next(): OutrankPair | null {
    if (cats.length === 0) return null;
    const cat = cats[rngInt(rng, cats.length)];
    const arr = poolByCat.get(cat)!;

    // Pick the first item, avoiding recently-used ids when possible.
    let aIdx = rngInt(rng, arr.length);
    for (let t = 0; t < 8 && recent.includes(arr[aIdx].id); t++) {
      aIdx = rngInt(rng, arr.length);
    }

    // Pick a distinct second item with a different value (no ties) and,
    // when possible, not recently used.
    let bIdx = rngInt(rng, arr.length);
    for (
      let t = 0;
      t < 16 &&
      (bIdx === aIdx ||
        arr[bIdx].value === arr[aIdx].value ||
        recent.includes(arr[bIdx].id));
      t++
    ) {
      bIdx = rngInt(rng, arr.length);
    }
    // Guarantee distinctness even if retries were exhausted.
    if (bIdx === aIdx) bIdx = (aIdx + 1) % arr.length;

    const a = arr[aIdx];
    const b = arr[bIdx];
    remember(a.id);
    remember(b.id);

    // Randomize which side the higher value lands on.
    const leftFirst = rng() < 0.5;
    return {
      category: cat,
      left: leftFirst ? a : b,
      right: leftFirst ? b : a,
    };
  }

  return { next, playableCategories: cats };
}

/** True if the chosen item has the higher (or equal) value of the pair. */
export function isCorrectChoice(pair: OutrankPair, chosen: "left" | "right"): boolean {
  const picked = chosen === "left" ? pair.left : pair.right;
  const other = chosen === "left" ? pair.right : pair.left;
  return picked.value >= other.value;
}
