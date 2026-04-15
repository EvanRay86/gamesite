// Letter tile generation and management for Wordslay

import type { LetterTile, TileModifier } from "@/types/wordslay";
import { isValidEnglishWord } from "@/lib/dictionary";
import { LETTER_VALUES } from "./word-scoring";

// ── Weighted letter distribution ────────────────────────────────────────────

const VOWELS = "AEIOU";
const CONSONANTS = "BCDFGHJKLMNPQRSTVWXYZ";

const VOWEL_WEIGHTS = [8, 12, 7, 8, 3]; // A E I O U
const CONSONANT_WEIGHTS = [
//B  C  D  F  G  H  J  K  L  M  N  P  Q  R  S  T  V  W  X  Y  Z
  3, 4, 3, 2, 1, 6, 1, 4, 7, 3, 1, 5, 2, 6, 2, 6, 3, 1, 2, 2, 1,
]; //                                              ^ S boosted from 1→2

// Default dupe curve: 1st full, 2nd full, 3rd 35%, 4th 2%
const DEFAULT_DUPE_MULTIPLIERS = [1, 1, 0.35, 0.02];
const DEFAULT_MAX_DUPES = 4;

// Per-letter hard caps — letters that should never exceed a certain count
// Letters not listed here use DEFAULT_MAX_DUPES (4)
const LETTER_CAPS: Record<string, number> = {
  Q: 1,
  X: 1,
  Z: 1,
  J: 1,
  U: 2,
  K: 2,
  V: 2,
  W: 2,
  Y: 2,
};

// Per-letter dupe multipliers for specific letters that need different curves
const LETTER_DUPE_OVERRIDES: Record<string, number[]> = {
  U: [1, 0.3],  // 2nd U much less likely
};

function weightedPick(
  chars: string,
  weights: number[],
  rng: () => number,
): string {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rng() * total;
  for (let i = 0; i < chars.length; i++) {
    r -= weights[i];
    if (r <= 0) return chars[i];
  }
  return chars[chars.length - 1];
}

/**
 * Pick a letter using weights adjusted for duplicates already in the rack.
 * Respects per-letter hard caps and custom dupe curves.
 */
function weightedPickWithDupeControl(
  chars: string,
  baseWeights: number[],
  existing: Map<string, number>,
  rng: () => number,
): string {
  const adjusted = baseWeights.map((w, i) => {
    const letter = chars[i];
    const count = existing.get(letter) ?? 0;
    const cap = LETTER_CAPS[letter] ?? DEFAULT_MAX_DUPES;
    if (count >= cap) return 0;
    const multipliers = LETTER_DUPE_OVERRIDES[letter] ?? DEFAULT_DUPE_MULTIPLIERS;
    return w * (multipliers[count] ?? 0);
  });

  const total = adjusted.reduce((a, b) => a + b, 0);
  if (total <= 0) {
    // Fallback: all letters at cap — just pick randomly ignoring dupes
    return weightedPick(chars, baseWeights, rng);
  }

  let r = rng() * total;
  for (let i = 0; i < chars.length; i++) {
    r -= adjusted[i];
    if (r <= 0) return chars[i];
  }
  return chars[chars.length - 1];
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Tile creation ───────────────────────────────────────────────────────────

let nextTileId = 0;
export function resetTileIds() {
  nextTileId = 0;
}

function makeTile(letter: string, modifier: TileModifier = "normal"): LetterTile {
  return {
    id: nextTileId++,
    letter: letter.toUpperCase(),
    value: LETTER_VALUES[letter.toUpperCase()] ?? 1,
    modifier,
  };
}

// ── Tile generation ─────────────────────────────────────────────────────────

/**
 * Count how many of each letter already exist in a set of tiles.
 */
function countLetters(tiles: LetterTile[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const t of tiles) {
    if (t.modifier === "wildcard") continue;
    const l = t.letter.toUpperCase();
    counts.set(l, (counts.get(l) ?? 0) + 1);
  }
  return counts;
}

export function generateTiles(
  rng: () => number,
  count: number,
  floor: number,
  playerRelics: string[],
  existingTiles?: LetterTile[],
): LetterTile[] {
  const tiles: LetterTile[] = [];

  // Track letter counts across existing rack + new tiles for dupe control
  const letterCounts = existingTiles ? countLetters(existingTiles) : new Map<string, number>();

  // Count existing vowels in the rack
  const existingVowels = existingTiles
    ? existingTiles.filter((t) => t.modifier !== "wildcard" && VOWELS.includes(t.letter.toUpperCase())).length
    : 0;
  const totalRackSize = (existingTiles?.length ?? 0) + count;

  // Target ~40% vowels (Scrabble-like ratio), scaled to total rack size
  // Distribution: 20% chance low, 55% chance mid, 25% chance high
  const r = rng();
  const vowelRatio = r < 0.20 ? 0.30 : r < 0.75 ? 0.40 : 0.45;
  const targetVowels = Math.round(totalRackSize * vowelRatio);
  const vowelsNeeded = Math.max(0, Math.min(count, targetVowels - existingVowels));
  const consonantsNeeded = count - vowelsNeeded;

  // Generate vowels with diversity: first 2 must be different
  for (let i = 0; i < vowelsNeeded; i++) {
    const letter = weightedPickWithDupeControl(VOWELS, VOWEL_WEIGHTS, letterCounts, rng);
    tiles.push(makeTile(letter));
    letterCounts.set(letter, (letterCounts.get(letter) ?? 0) + 1);
  }

  // Generate consonants with dupe control
  // First consonant: guarantee a common starter (S, T, R, N, L) if the rack
  // doesn't already have one. These letters begin or appear in the most English
  // words and make racks feel immediately playable.
  const COMMON_STARTERS = "STRNL";
  const hasCommonStarter = existingTiles
    ? existingTiles.some((t) => t.modifier !== "wildcard" && COMMON_STARTERS.includes(t.letter.toUpperCase()))
    : false;

  for (let i = 0; i < consonantsNeeded; i++) {
    let letter: string;
    if (i === 0 && !hasCommonStarter && !tiles.some((t) => COMMON_STARTERS.includes(t.letter))) {
      // Pick from common starters only, respecting dupe control
      const starterWeights = COMMON_STARTERS.split("").map((ch) => {
        const idx = CONSONANTS.indexOf(ch);
        return idx >= 0 ? CONSONANT_WEIGHTS[idx] : 0;
      });
      letter = weightedPickWithDupeControl(COMMON_STARTERS, starterWeights, letterCounts, rng);
    } else {
      letter = weightedPickWithDupeControl(CONSONANTS, CONSONANT_WEIGHTS, letterCounts, rng);
    }
    tiles.push(makeTile(letter));
    letterCounts.set(letter, (letterCounts.get(letter) ?? 0) + 1);
  }

  // Apply special tile modifiers based on floor progression
  applySpecialTiles(tiles, rng, floor, playerRelics);

  return shuffle(tiles, rng);
}

function applySpecialTiles(
  tiles: LetterTile[],
  rng: () => number,
  floor: number,
  relics: string[],
): void {
  // Golden tiles: chance increases with floor
  const goldenChance = 0.05 + floor * 0.02;
  for (const tile of tiles) {
    if (rng() < goldenChance) {
      tile.modifier = "golden";
    }
  }

  // Cursed tiles: appear from floor 4+
  if (floor >= 4) {
    const curseChance = 0.03 + (floor - 4) * 0.015;
    for (const tile of tiles) {
      if (tile.modifier === "normal" && rng() < curseChance) {
        tile.modifier = "cursed";
      }
    }
  }

  // Wildcard tiles: rare, increased by relics
  let wildcardChance = 0.03;
  if (relics.includes("chaos-rune")) wildcardChance += 0.08;
  for (const tile of tiles) {
    if (tile.modifier === "normal" && rng() < wildcardChance) {
      tile.modifier = "wildcard";
      tile.letter = "?";
      tile.value = 0;
    }
  }

  // Relic: Vowel Stone adds an extra vowel
  if (relics.includes("vowel-stone")) {
    const extraVowel = makeTile(weightedPick(VOWELS, VOWEL_WEIGHTS, rng));
    tiles.push(extraVowel);
  }

  // Relic: Lexicon Crown makes all tiles golden on first combat turn
  if (relics.includes("lexicon-crown")) {
    // This is handled at engine level (only first turn of combat)
  }
}

// ── Playability check ───────────────────────────────────────────────────────

export function tilesHaveValidWord(tiles: LetterTile[]): boolean {
  const usable = tiles.filter((t) => t.modifier !== "cursed" && t.modifier !== "frozen");
  const letters = usable
    .filter((t) => t.modifier !== "wildcard")
    .map((t) => t.letter.toLowerCase());

  // If we have a wildcard, always playable (can make any 3-letter word)
  if (usable.some((t) => t.modifier === "wildcard")) return true;

  // Check all 3-letter combos
  for (let a = 0; a < letters.length; a++) {
    for (let b = 0; b < letters.length; b++) {
      if (b === a) continue;
      for (let c = 0; c < letters.length; c++) {
        if (c === a || c === b) continue;
        const word = letters[a] + letters[b] + letters[c];
        if (isValidEnglishWord(word, 3)) return true;
      }
    }
  }
  return false;
}

export function generatePlayableTiles(
  rng: () => number,
  count: number,
  floor: number,
  playerRelics: string[],
  existingTiles?: LetterTile[],
): LetterTile[] {
  for (let attempt = 0; attempt < 50; attempt++) {
    const tiles = generateTiles(rng, count, floor, playerRelics, existingTiles);
    // When checking playability, consider new tiles together with existing rack
    const allTiles = existingTiles ? [...existingTiles, ...tiles] : tiles;
    if (tilesHaveValidWord(allTiles)) return tiles;
  }
  // Fallback: force a playable set
  return generateTiles(rng, count, floor, playerRelics, existingTiles);
}

// ── Tile manipulation ───────────────────────────────────────────────────────

export function refreshTiles(
  rng: () => number,
  current: LetterTile[],
  keepIds: Set<number>,
  floor: number,
  relics: string[],
): LetterTile[] {
  const kept = current.filter((t) => keepIds.has(t.id));
  const newCount = current.length - kept.length;
  const newTiles = generateTiles(rng, newCount, floor, relics, kept);
  return shuffle([...kept, ...newTiles], rng);
}

export function removeTile(tiles: LetterTile[], tileId: number): LetterTile[] {
  return tiles.filter((t) => t.id !== tileId);
}

export function curseTile(tiles: LetterTile[], rng: () => number): LetterTile[] {
  const normal = tiles.filter((t) => t.modifier === "normal");
  if (normal.length === 0) return tiles;
  const target = normal[Math.floor(rng() * normal.length)];
  return tiles.map((t) =>
    t.id === target.id ? { ...t, modifier: "cursed" as TileModifier } : t,
  );
}

export function scrambleTiles(tiles: LetterTile[], rng: () => number): LetterTile[] {
  const letters = tiles.map((t) => t.letter);
  const shuffled = shuffle(letters, rng);
  return tiles.map((t, i) => ({ ...t, letter: shuffled[i] }));
}

// ── Tile display colors ─────────────────────────────────────────────────────

export const TILE_STYLES: Record<
  TileModifier,
  { bg: string; border: string; text: string; glow?: string }
> = {
  normal: { bg: "bg-white", border: "border-gray-300", text: "text-gray-900" },
  golden: {
    bg: "bg-amber-50",
    border: "border-amber-400",
    text: "text-amber-900",
    glow: "shadow-amber-300/50",
  },
  cursed: {
    bg: "bg-red-50",
    border: "border-red-400",
    text: "text-red-900",
    glow: "shadow-red-400/50",
  },
  wildcard: {
    bg: "bg-purple-50",
    border: "border-purple-400",
    text: "text-purple-900",
    glow: "shadow-purple-300/50",
  },
  frozen: {
    bg: "bg-sky-50",
    border: "border-sky-400",
    text: "text-sky-900",
    glow: "shadow-sky-300/50",
  },
};

export const DEFAULT_TILE_COUNT = 10;
