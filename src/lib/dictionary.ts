// Shared English word dictionary for all puzzle games.
// Comprehensive word lists (1–12 letters) sourced from SCOWL via an-array-of-english-words.

import {
  WORDS_1, WORDS_2, WORDS_3, WORDS_4, WORDS_5, WORDS_6,
  WORDS_7, WORDS_8, WORDS_9, WORDS_10, WORDS_11, WORDS_12,
} from "@/data/word-list";

const sets: Record<number, Set<string>> = {
  1: new Set(WORDS_1),
  2: new Set(WORDS_2),
  3: new Set(WORDS_3),
  4: new Set(WORDS_4),
  5: new Set(WORDS_5),
  6: new Set(WORDS_6),
  7: new Set(WORDS_7),
  8: new Set(WORDS_8),
  9: new Set(WORDS_9),
  10: new Set(WORDS_10),
  11: new Set(WORDS_11),
  12: new Set(WORDS_12),
};

/** Check if a word is a valid English word. Optionally constrain to a specific length. */
export function isValidEnglishWord(word: string, length?: number): boolean {
  const w = word.toLowerCase();
  if (length !== undefined) {
    return w.length === length && (sets[length]?.has(w) ?? false);
  }
  return sets[w.length]?.has(w) ?? false;
}

/** Get the full Set of words for a given length (useful for iteration, e.g. Word Ladder BFS). */
export function getWordSet(length: number): ReadonlySet<string> {
  return sets[length] ?? new Set();
}
