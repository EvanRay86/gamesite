// Letter tile generation and management for Lexicon Quest

import type { LetterTile, TileModifier } from "@/types/lexicon-quest";
import { isValidEnglishWord } from "@/lib/dictionary";
import { LETTER_VALUES } from "./word-scoring";

// ── Weighted letter distribution ────────────────────────────────────────────

const VOWELS = "AEIOU";
const CONSONANTS = "BCDFGHJKLMNPQRSTVWXYZ";

const VOWEL_WEIGHTS = [8, 12, 7, 8, 3]; // A E I O U
const CONSONANT_WEIGHTS = [
  3, 4, 3, 2, 1, 6, 1, 4, 7, 3, 1, 5, 2, 6, 1, 6, 3, 1, 2, 2, 1,
]; // B C D F G H J K L M N P Q R S T V W X Y Z

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

export function generateTiles(
  rng: () => number,
  count: number,
  floor: number,
  playerRelics: string[],
): LetterTile[] {
  const tiles: LetterTile[] = [];

  // Guarantee 3-4 vowels for playability
  const vowelCount = 3 + (rng() < 0.5 ? 1 : 0);
  for (let i = 0; i < vowelCount; i++) {
    tiles.push(makeTile(weightedPick(VOWELS, VOWEL_WEIGHTS, rng)));
  }

  // Fill remaining with consonants
  for (let i = tiles.length; i < count; i++) {
    tiles.push(makeTile(weightedPick(CONSONANTS, CONSONANT_WEIGHTS, rng)));
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
  const letters = tiles
    .filter((t) => t.modifier !== "wildcard")
    .map((t) => t.letter.toLowerCase());

  // If we have a wildcard, always playable (can make any 3-letter word)
  if (tiles.some((t) => t.modifier === "wildcard")) return true;

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
): LetterTile[] {
  for (let attempt = 0; attempt < 50; attempt++) {
    const tiles = generateTiles(rng, count, floor, playerRelics);
    if (tilesHaveValidWord(tiles)) return tiles;
  }
  // Fallback: force a playable set
  return generateTiles(rng, count, floor, playerRelics);
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
  const newTiles = generateTiles(rng, newCount, floor, relics);
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
