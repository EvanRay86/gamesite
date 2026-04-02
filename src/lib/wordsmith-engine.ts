import type {
  LetterTile,
  LetterScoreDetail,
  PowerUp,
  PowerUpId,
  RoundResult,
  ScoreBonus,
} from "@/types/wordsmith";
import { isValidEnglishWord } from "@/lib/dictionary";

// ── Seeded RNG ───────────────────────────────────────────────────────────────

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

// ── Letter Values ────────────────────────────────────────────────────────────

const COMMON = new Set("EAIONRTLSU".split(""));
const RARE = new Set("KJXQZ".split(""));

export function getLetterValue(letter: string): number {
  const L = letter.toUpperCase();
  if (COMMON.has(L)) return 1;
  if (RARE.has(L)) return 5;
  return 2; // medium
}

const LENGTH_MULTIPLIER: Record<number, number> = {
  3: 1,
  4: 1.5,
  5: 2.5,
  6: 4,
  7: 7,
};

// ── Weighted Letter Distribution ─────────────────────────────────────────────

const VOWELS = "AEIOU";
const CONSONANTS = "BCDFGHJKLMNPQRSTVWXYZ";
// Weights roughly based on English frequency
const VOWEL_WEIGHTS = [8, 12, 7, 8, 3]; // A E I O U
const CONSONANT_WEIGHTS = [
  3, 4, 3, 2, 1, 6, 1, 4, 7, 3, 1, 5, 2, 6, 1, 6, 3, 1, 2, 2, 1,
]; // B C D F G H J K L M N P Q R S T V W X Y Z

function weightedPick(chars: string, weights: number[], rng: () => number): string {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rng() * total;
  for (let i = 0; i < chars.length; i++) {
    r -= weights[i];
    if (r <= 0) return chars[i];
  }
  return chars[chars.length - 1];
}

// ── Tile Generation ──────────────────────────────────────────────────────────

export function generateRoundLetters(
  rng: () => number,
  _round: number,
): LetterTile[] {
  const tiles: LetterTile[] = [];
  let id = _round * 100;

  // Guarantee 2-3 vowels
  const vowelCount = 2 + (rng() < 0.5 ? 1 : 0);
  for (let i = 0; i < vowelCount; i++) {
    const letter = weightedPick(VOWELS, VOWEL_WEIGHTS, rng);
    tiles.push({ letter, value: getLetterValue(letter), id: id++ });
  }

  // Fill remaining with consonants
  for (let i = tiles.length; i < 7; i++) {
    const letter = weightedPick(CONSONANTS, CONSONANT_WEIGHTS, rng);
    tiles.push({ letter, value: getLetterValue(letter), id: id++ });
  }

  // Shuffle
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }

  return tiles;
}

// Verify tiles can form at least one valid word
export function tilesHaveValidWord(tiles: LetterTile[]): boolean {
  const letters = tiles.map((t) => t.letter.toLowerCase());
  // Check all 3-letter combos (quickest check)
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

export function generatePlayableLetters(
  rng: () => number,
  round: number,
): LetterTile[] {
  // Keep generating until we get a playable hand (usually first try)
  for (let attempt = 0; attempt < 20; attempt++) {
    const tiles = generateRoundLetters(rng, round + attempt * 5);
    if (tilesHaveValidWord(tiles)) return tiles;
  }
  // Fallback: force a known-good set
  return generateRoundLetters(rng, round);
}

// ── Power-ups ────────────────────────────────────────────────────────────────

export const ALL_POWER_UPS: PowerUp[] = [
  { id: "inferno", name: "Inferno", emoji: "\u{1F525}", description: "Vowels score 2x", type: "persistent" },
  { id: "surge", name: "Surge", emoji: "\u26A1", description: "5+ letter words get +50", type: "persistent" },
  { id: "gem-cutter", name: "Gem Cutter", emoji: "\u{1F48E}", description: "Double-letter words score 2x", type: "persistent" },
  { id: "vortex", name: "Vortex", emoji: "\u{1F300}", description: "One tile becomes a wildcard", type: "persistent" },
  { id: "precision", name: "Precision", emoji: "\u{1F3AF}", description: "4-letter words get +30", type: "persistent" },
  { id: "chain", name: "Chain", emoji: "\u{1F517}", description: "Start with prev word's last letter: +40", type: "persistent" },
  { id: "stardust", name: "Stardust", emoji: "\u{1F31F}", description: "Rare letters (K,J,X,Q,Z) score 5x", type: "persistent" },
  { id: "reroll", name: "Reroll", emoji: "\u{1F3B2}", description: "Swap up to 2 tiles next round", type: "immediate" },
  { id: "echo", name: "Echo", emoji: "\u{1F4AB}", description: "Double this round's score", type: "one-time" },
  { id: "tidal", name: "Tidal", emoji: "\u{1F30A}", description: "Growing bonus: +10 per round", type: "persistent" },
  { id: "shield", name: "Shield", emoji: "\u{1F6E1}\uFE0F", description: "Min 50 points per round", type: "persistent" },
  { id: "alchemy", name: "Alchemy", emoji: "\u2697\uFE0F", description: "All-7 words: bonus 3x on top", type: "persistent" },
];

export function getPowerUpById(id: PowerUpId): PowerUp {
  return ALL_POWER_UPS.find((p) => p.id === id)!;
}

export function generatePowerUpOfferings(
  rng: () => number,
  alreadyChosen: PowerUpId[],
): PowerUp[] {
  const available = ALL_POWER_UPS.filter((p) => !alreadyChosen.includes(p.id));
  const offerings: PowerUp[] = [];

  // Pick 3 (or fewer if not enough remaining)
  const count = Math.min(3, available.length);
  const pool = [...available];
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(rng() * pool.length);
    offerings.push(pool[idx]);
    pool.splice(idx, 1);
  }

  return offerings;
}

// ── Word Validation ──────────────────────────────────────────────────────────

export function isWordFormableFromTiles(
  word: string,
  tiles: LetterTile[],
): boolean {
  const available = tiles.map((t) => ({
    letter: t.letter.toUpperCase(),
    used: false,
    isWildcard: t.isWildcard ?? false,
  }));
  const letters = word.toUpperCase().split("");

  for (const letter of letters) {
    const idx = available.findIndex(
      (t) => !t.used && (t.letter === letter || t.isWildcard),
    );
    if (idx === -1) return false;
    available[idx].used = true;
  }
  return true;
}

// Resolve wildcard: find the best valid word interpretation
export function resolveWildcard(
  selectedTiles: LetterTile[],
  allTiles: LetterTile[],
  activePowerUps: PowerUpId[],
  roundNumber: number,
  previousWord: string | null,
  tidalRounds: number,
): { word: string; score: number } | null {
  const wildcardIdx = selectedTiles.findIndex((t) => t.isWildcard);
  if (wildcardIdx === -1) {
    // No wildcard — just validate directly
    const word = selectedTiles.map((t) => t.letter).join("");
    if (isValidEnglishWord(word.toLowerCase())) {
      const result = calculateScore(
        word,
        selectedTiles,
        activePowerUps,
        roundNumber,
        previousWord,
        tidalRounds,
      );
      return { word, score: result.totalScore };
    }
    return null;
  }

  let best: { word: string; score: number } | null = null;
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  for (const ch of alphabet) {
    const testTiles = selectedTiles.map((t, i) =>
      i === wildcardIdx
        ? { ...t, letter: ch, value: getLetterValue(ch) }
        : t,
    );
    const word = testTiles.map((t) => t.letter).join("");
    if (!isValidEnglishWord(word.toLowerCase())) continue;

    const result = calculateScore(
      word,
      testTiles,
      activePowerUps,
      roundNumber,
      previousWord,
      tidalRounds,
    );
    if (!best || result.totalScore > best.score) {
      best = { word, score: result.totalScore };
    }
  }

  return best;
}

// ── Scoring ──────────────────────────────────────────────────────────────────

export function calculateScore(
  word: string,
  tiles: LetterTile[],
  activePowerUps: PowerUpId[],
  _roundNumber: number,
  previousWord: string | null,
  tidalRounds: number,
): { baseScore: number; lengthMultiplier: number; bonuses: ScoreBonus[]; totalScore: number; letterDetails: LetterScoreDetail[] } {
  const has = (id: PowerUpId) => activePowerUps.includes(id);
  const upper = word.toUpperCase();
  const bonuses: ScoreBonus[] = [];
  const letterDetails: LetterScoreDetail[] = [];

  // 1. Base letter score
  let letterSum = 0;
  for (const tile of tiles) {
    let val = tile.value;
    const L = tile.letter.toUpperCase();
    const modifiers: string[] = [];

    // Inferno: vowels 2x
    if (has("inferno") && COMMON.has(L) && "AEIOU".includes(L)) {
      val *= 2;
      modifiers.push("Inferno 2x");
    }
    // Stardust: rare letters 5x
    if (has("stardust") && RARE.has(L)) {
      val *= 5;
      modifiers.push("Stardust 5x");
    }
    letterSum += val;
    letterDetails.push({ letter: L, baseValue: tile.value, modifiedValue: val, modifiers });
  }

  // 2. Length multiplier
  let lengthMult = LENGTH_MULTIPLIER[upper.length] ?? 1;

  // Alchemy: 7-letter words get an additional 3x on top of the 7x
  if (has("alchemy") && upper.length === 7) {
    lengthMult = 10; // 7x base + 3x bonus
    bonuses.push({ label: "Alchemy", value: 0 }); // Marker for display
  }

  let score = Math.round(letterSum * lengthMult);

  // 3. Additive bonuses
  if (has("surge") && upper.length >= 5) {
    bonuses.push({ label: "Surge +50", value: 50 });
    score += 50;
  }
  if (has("precision") && upper.length === 4) {
    bonuses.push({ label: "Precision +30", value: 30 });
    score += 30;
  }
  if (has("chain") && previousWord) {
    const lastLetter = previousWord[previousWord.length - 1].toUpperCase();
    if (upper[0] === lastLetter) {
      bonuses.push({ label: "Chain +40", value: 40 });
      score += 40;
    }
  }
  if (has("tidal") && tidalRounds > 0) {
    const tidalBonus = tidalRounds * 10;
    bonuses.push({ label: `Tidal +${tidalBonus}`, value: tidalBonus });
    score += tidalBonus;
  }

  // 4. Multiplicative bonuses
  if (has("gem-cutter")) {
    const letterCounts: Record<string, number> = {};
    for (const ch of upper) {
      letterCounts[ch] = (letterCounts[ch] || 0) + 1;
    }
    if (Object.values(letterCounts).some((c) => c >= 2)) {
      bonuses.push({ label: "Gem Cutter 2x", value: score });
      score *= 2;
    }
  }

  // 5. Shield floor
  if (has("shield") && score < 50) {
    bonuses.push({ label: "Shield min 50", value: 50 - score });
    score = 50;
  }

  return {
    baseScore: letterSum,
    lengthMultiplier: lengthMult,
    bonuses,
    totalScore: score,
    letterDetails,
  };
}

// ── Reroll ────────────────────────────────────────────────────────────────────

export function applyReroll(
  tiles: LetterTile[],
  indicesToSwap: number[],
  rng: () => number,
): LetterTile[] {
  const newTiles = [...tiles];
  for (const idx of indicesToSwap) {
    const isVowel = rng() < 0.4;
    const letter = isVowel
      ? weightedPick(VOWELS, VOWEL_WEIGHTS, rng)
      : weightedPick(CONSONANTS, CONSONANT_WEIGHTS, rng);
    newTiles[idx] = {
      letter,
      value: getLetterValue(letter),
      id: newTiles[idx].id,
      isWildcard: false,
    };
  }
  return newTiles;
}

// ── Share Text ───────────────────────────────────────────────────────────────

export function getDayNumber(dateStr: string): number {
  const epoch = new Date("2026-03-29").getTime();
  const current = new Date(dateStr).getTime();
  return Math.floor((current - epoch) / 86400000) + 1;
}

const RATING_EMOJIS = { great: "\u{1F7E9}", ok: "\u{1F7E8}", poor: "\u{1F7E7}" };

export function getRoundRating(score: number, maxScore: number): "great" | "ok" | "poor" {
  if (maxScore <= 0) return "ok";
  const ratio = score / maxScore;
  if (ratio >= 0.7) return "great";
  if (ratio >= 0.4) return "ok";
  return "poor";
}

export function buildShareText(
  rounds: RoundResult[],
  totalScore: number,
  dateStr: string,
): string {
  const dayNum = getDayNumber(dateStr);
  const lines: string[] = [];
  lines.push(`WORDSMITH \u2692\uFE0F #${dayNum}`);

  for (const r of rounds) {
    const pu = r.powerUpChosen ? r.powerUpChosen.emoji : "\u2B50";
    lines.push(`R${r.roundNumber}: ${r.word.toUpperCase().padEnd(7)} ${pu} (${r.totalScore})`);
  }

  lines.push(`Total: ${totalScore}`);

  // Rating row — use placeholder max (best score would need brute force)
  // Simple rating: compare against reasonable thresholds
  const ratingRow = rounds
    .map((r) => {
      if (r.totalScore >= 200) return RATING_EMOJIS.great;
      if (r.totalScore >= 80) return RATING_EMOJIS.ok;
      return RATING_EMOJIS.poor;
    })
    .join("");
  lines.push(ratingRow);
  lines.push("gamesite.app/daily/wordsmith");

  return lines.join("\n");
}
