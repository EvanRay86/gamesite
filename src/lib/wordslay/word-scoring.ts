// Word validation and damage calculation for Wordslay

import { isValidEnglishWord } from "@/lib/dictionary";
import type {
  LetterTile,
  WordResult,
  DamageBonus,
  WordTier,
  RelicDef,
} from "@/types/wordslay";
export type { WordTier } from "@/types/wordslay";
import { RELIC_DEFS } from "./relics";

// ── Scrabble-style letter values ────────────────────────────────────────────

export const LETTER_VALUES: Record<string, number> = {
  A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4,
  I: 1, J: 8, K: 5, L: 1, M: 3, N: 1, O: 1, P: 3,
  Q: 10, R: 1, S: 1, T: 1, U: 1, V: 4, W: 4, X: 8,
  Y: 4, Z: 10,
};

const RARE_LETTERS = new Set(["Q", "Z", "X", "J"]);
const VOWELS = new Set(["A", "E", "I", "O", "U"]);

// ── Length bonuses ──────────────────────────────────────────────────────────

const LENGTH_BONUS: Record<number, number> = {
  3: 0, 4: 2, 5: 5, 6: 10, 7: 18, 8: 28, 9: 40, 10: 55, 11: 75, 12: 100,
};

function getLengthBonus(len: number): number {
  return LENGTH_BONUS[Math.min(len, 12)] ?? 0;
}

// ── Word tier ───────────────────────────────────────────────────────────────

export function getWordTier(len: number): WordTier {
  if (len >= 12) return "mythic";
  if (len >= 10) return "legendary";
  if (len >= 8) return "critical";
  if (len >= 6) return "strong";
  return "normal";
}

export function getTierMultiplier(tier: WordTier): number {
  switch (tier) {
    case "mythic": return 3;
    case "legendary": return 2;
    case "critical": return 1.5;
    case "strong": return 1.2;
    case "normal": return 1;
  }
}

export const TIER_COLORS: Record<WordTier, string> = {
  normal: "#ffffff",
  strong: "#4ECDC4",
  critical: "#F7B731",
  legendary: "#A855F7",
  mythic: "#FF6B6B",
};

// ── Word validation ─────────────────────────────────────────────────────────

export function isWordFormable(word: string, tiles: LetterTile[]): boolean {
  const available = tiles.map((t) => ({
    letter: t.letter.toUpperCase(),
    modifier: t.modifier,
    used: false,
  }));

  for (const ch of word.toUpperCase()) {
    const idx = available.findIndex(
      (a) => !a.used && (a.letter === ch || a.modifier === "wildcard"),
    );
    if (idx === -1) return false;
    available[idx].used = true;
  }
  return true;
}

export function validateWord(word: string, tiles: LetterTile[]): boolean {
  if (word.length < 3) return false;
  if (!isWordFormable(word, tiles)) return false;
  return isValidEnglishWord(word.toLowerCase());
}

// ── Palindrome check ────────────────────────────────────────────────────────

export function isPalindrome(word: string): boolean {
  if (word.length < 3) return false;
  const w = word.toLowerCase();
  for (let i = 0; i < Math.floor(w.length / 2); i++) {
    if (w[i] !== w[w.length - 1 - i]) return false;
  }
  return true;
}

// ── All vowels check ────────────────────────────────────────────────────────

export function allVowelsUsed(word: string, tiles: LetterTile[]): boolean {
  const tileVowels = new Set<string>();
  for (const t of tiles) {
    if (VOWELS.has(t.letter.toUpperCase()) && t.modifier !== "wildcard") {
      tileVowels.add(t.letter.toUpperCase());
    }
  }
  if (tileVowels.size === 0) return false;
  const wordUpper = word.toUpperCase();
  for (const v of tileVowels) {
    if (!wordUpper.includes(v)) return false;
  }
  return true;
}

// ── Map selected tile IDs to tiles ──────────────────────────────────────────

function getSelectedTiles(
  selectedIds: number[],
  allTiles: LetterTile[],
): LetterTile[] {
  return selectedIds
    .map((id) => allTiles.find((t) => t.id === id))
    .filter((t): t is LetterTile => t !== undefined);
}

// ── Core damage calculation ─────────────────────────────────────────────────

export function calculateWordResult(
  word: string,
  selectedIds: number[],
  allTiles: LetterTile[],
  playerRelics: string[],
  attackMult: number,
): WordResult {
  const tiles = getSelectedTiles(selectedIds, allTiles);
  const bonuses: DamageBonus[] = [];

  // Base score: sum of tile values (golden = 2x)
  let baseScore = 0;
  for (const tile of tiles) {
    const val = tile.modifier === "golden" ? tile.value * 2 : tile.value;
    baseScore += val;
  }

  // Length bonus
  const lengthBonus = getLengthBonus(word.length);
  if (lengthBonus > 0) {
    bonuses.push({ label: `${word.length}-letter bonus`, amount: lengthBonus });
  }

  // Tier multiplier
  const tier = getWordTier(word.length);
  const tierMult = getTierMultiplier(tier);
  if (tierMult > 1) {
    bonuses.push({
      label: `${tier.charAt(0).toUpperCase() + tier.slice(1)}!`,
      amount: Math.round((baseScore + lengthBonus) * (tierMult - 1)),
    });
  }

  // Rare letters
  let rareCount = 0;
  for (const ch of word.toUpperCase()) {
    if (RARE_LETTERS.has(ch)) rareCount++;
  }
  if (rareCount > 0) {
    bonuses.push({ label: `Rare letters (x${rareCount})`, amount: rareCount * 3 });
  }

  // Palindrome
  const palindrome = isPalindrome(word);
  if (palindrome) {
    bonuses.push({ label: "Palindrome!", amount: 5 });
  }

  // All vowels
  const vowelsUsed = allVowelsUsed(word, allTiles);
  if (vowelsUsed) {
    bonuses.push({ label: "All vowels used!", amount: 8 });
  }

  // Relic bonuses
  for (const relicId of playerRelics) {
    const relic = RELIC_DEFS.find((r) => r.id === relicId);
    if (!relic || relic.trigger !== "on_word") continue;

    const bonus = getRelicWordBonus(relic, word, tiles);
    if (bonus) bonuses.push(bonus);
  }

  // Calculate total
  const bonusTotal = bonuses.reduce((sum, b) => sum + b.amount, 0);
  const rawDamage = (baseScore + lengthBonus + bonusTotal) * (tierMult > 1 ? 1 : 1);
  // Apply tier multiplier to base+length, then add flat bonuses
  const totalDamage = Math.round(
    ((baseScore + lengthBonus) * tierMult +
      bonuses.filter((b) => !b.label.includes(tier)).reduce((s, b) => s + b.amount, 0)) *
      attackMult,
  );

  return {
    word,
    tiles,
    baseScore,
    lengthBonus,
    bonuses,
    totalDamage: Math.max(1, totalDamage),
    tier,
    isPalindrome: palindrome,
    allVowelsUsed: vowelsUsed,
  };
}

// ── Relic word bonuses ──────────────────────────────────────────────────────

function getRelicWordBonus(
  relic: RelicDef,
  word: string,
  tiles: LetterTile[],
): DamageBonus | null {
  const w = word.toUpperCase();
  switch (relic.id) {
    case "scholars-quill":
      return w.length >= 5 ? { label: "Scholar's Quill", amount: 3 } : null;
    case "thesaurus":
      // Bonus handled at engine level (compares to previous word)
      return null;
    case "s-blade":
      return w.startsWith("S") ? { label: "S-Blade", amount: 5 } : null;
    case "philosophers-stone":
      {
        let count = 0;
        for (const ch of w) if (RARE_LETTERS.has(ch)) count++;
        return count > 0
          ? { label: "Philosopher's Stone", amount: count * 5 }
          : null;
      }
    case "word-of-power":
      return w.length >= 8 ? { label: "Word of Power", amount: 10 } : null;
    case "vampiric-tome":
      // Heal effect handled at engine level
      return null;
    default:
      return null;
  }
}
