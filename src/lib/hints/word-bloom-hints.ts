import type { Hint } from "@/types/hints";
import type { WordBloomPuzzle } from "@/types/word-bloom";

export function generateWordBloomHints(puzzle: WordBloomPuzzle): Hint[] {
  const hints: Hint[] = [];
  const letters = puzzle.letters;

  // Mild
  hints.push({
    level: "mild",
    text: `Your center letter is "${letters[0].toUpperCase()}" — every word must include it.`,
  });
  hints.push({
    level: "mild",
    text: `Your available letters are: ${letters.map((l) => l.toUpperCase()).join(", ")}.`,
  });

  // Medium — common starting combos
  const outer = letters.slice(1).map((l) => l.toUpperCase());
  hints.push({
    level: "medium",
    text: `Try combining the center letter "${letters[0].toUpperCase()}" with each outer letter: ${outer.join(", ")}.`,
  });
  hints.push({
    level: "medium",
    text: "Look for common 3-letter words first, then build up to longer ones.",
  });

  // Strong — specific two-letter starts
  const combos = outer
    .map((l) => `${letters[0].toUpperCase()}${l}`)
    .slice(0, 3);
  hints.push({
    level: "strong",
    text: `Try words starting with: ${combos.join(", ")}.`,
  });

  return hints;
}
