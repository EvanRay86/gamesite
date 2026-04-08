import type { Hint } from "@/types/hints";
import type { FramedPuzzle } from "@/lib/framed-puzzles";

export function generateFramedHints(puzzle: FramedPuzzle): Hint[] {
  const hints: Hint[] = [];
  const decade = Math.floor(puzzle.year / 10) * 10;
  const titleWords = puzzle.title.trim().split(/\s+/);

  // Mild
  hints.push({
    level: "mild",
    text: `This movie is from the ${decade}s.`,
  });

  // Medium
  hints.push({
    level: "medium",
    text: `The title starts with "${puzzle.title[0].toUpperCase()}".`,
  });

  // Strong
  hints.push({
    level: "strong",
    text: `Released in ${puzzle.year}. The title is ${titleWords.length} word${titleWords.length !== 1 ? "s" : ""} long.`,
  });

  return hints;
}
