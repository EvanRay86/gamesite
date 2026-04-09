import type { Hint } from "@/types/hints";
import type { VocabVaultPuzzle } from "@/types/vocab-vault";

export function generateVocabVaultHints(puzzle: VocabVaultPuzzle): Hint[] {
  const hints: Hint[] = [];

  // Mild — word lengths and broad category
  for (let i = 0; i < puzzle.words.length; i++) {
    const w = puzzle.words[i];
    hints.push({
      level: "mild",
      text: `Word ${i + 1} is ${w.word.length} letters long.`,
    });
  }

  // Medium — first letter
  for (let i = 0; i < puzzle.words.length; i++) {
    const w = puzzle.words[i];
    hints.push({
      level: "medium",
      text: `Word ${i + 1} starts with "${w.word[0].toUpperCase()}".`,
    });
  }

  // Strong — first + last letter
  for (let i = 0; i < puzzle.words.length; i++) {
    const w = puzzle.words[i];
    hints.push({
      level: "strong",
      text: `Word ${i + 1}: starts with "${w.word[0].toUpperCase()}", ends with "${w.word[w.word.length - 1].toUpperCase()}" (${w.word.length} letters).`,
    });
  }

  return hints;
}
