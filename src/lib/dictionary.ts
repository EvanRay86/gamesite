// Shared English word dictionary for all puzzle games.
// Comprehensive word lists (3–6 letters) sourced from SCOWL via an-array-of-english-words.

import { WORDS_3, WORDS_4, WORDS_5, WORDS_6 } from "@/data/word-list";

const sets: Record<number, Set<string>> = {
  3: new Set(WORDS_3),
  4: new Set(WORDS_4),
  5: new Set(WORDS_5),
  6: new Set(WORDS_6),
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
