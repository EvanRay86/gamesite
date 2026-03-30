// Seeded random number generator for deterministic procedural generation

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

/** Pick a random element from an array using the seeded rng. */
export function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

/** Shuffle an array in place using Fisher-Yates with seeded rng. */
export function shuffle<T>(arr: T[], rng: () => number): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Roll a weighted random choice. weights[i] corresponds to options[i]. */
export function weightedPick<T>(
  options: T[],
  weights: number[],
  rng: () => number,
): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rng() * total;
  for (let i = 0; i < options.length; i++) {
    r -= weights[i];
    if (r <= 0) return options[i];
  }
  return options[options.length - 1];
}

/** Generate a unique ID. */
let _idCounter = 0;
export function uid(): string {
  return `nv_${Date.now().toString(36)}_${(++_idCounter).toString(36)}`;
}
