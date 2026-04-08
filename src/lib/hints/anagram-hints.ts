import type { Hint } from "@/types/hints";
import type { AnagramPuzzle } from "@/types/anagram";

export function generateAnagramHints(puzzle: AnagramPuzzle): Hint[] {
  const hints: Hint[] = [];

  // Mild — use existing hint field
  for (let i = 0; i < puzzle.words.length; i++) {
    const w = puzzle.words[i];
    hints.push({
      level: "mild",
      text: `Word ${i + 1} (${w.word.length} letters): ${w.hint}`,
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
      text: `Word ${i + 1}: starts with "${w.word[0].toUpperCase()}", ends with "${w.word[w.word.length - 1].toUpperCase()}".`,
    });
  }

  return hints;
}
