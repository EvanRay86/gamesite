import type { Hint } from "@/types/hints";
import type { WordLadderPuzzle } from "@/lib/word-ladder-puzzles";

export function generateWordLadderHints(puzzle: WordLadderPuzzle): Hint[] {
  const hints: Hint[] = [];
  const steps = puzzle.solution;

  // Mild
  hints.push({
    level: "mild",
    text: `Transform "${puzzle.start.toUpperCase()}" into "${puzzle.end.toUpperCase()}" in ${steps.length - 1} step${steps.length - 1 !== 1 ? "s" : ""}.`,
  });

  // Medium — middle word's first letter
  if (steps.length >= 3) {
    const midIdx = Math.floor(steps.length / 2);
    hints.push({
      level: "medium",
      text: `The middle word (step ${midIdx}) starts with "${steps[midIdx][0].toUpperCase()}".`,
    });
  }

  // Strong — first letter of every other intermediate word
  for (let i = 1; i < steps.length - 1; i += 2) {
    hints.push({
      level: "strong",
      text: `Step ${i} starts with "${steps[i][0].toUpperCase()}".`,
    });
  }

  return hints;
}
