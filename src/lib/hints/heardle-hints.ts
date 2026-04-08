import type { Hint } from "@/types/hints";
import type { HeardlePuzzle } from "@/lib/heardle-puzzles";

export function generateHeardleHints(puzzle: HeardlePuzzle): Hint[] {
  const hints: Hint[] = [];
  const decade = Math.floor(puzzle.year / 10) * 10;
  const titleWords = puzzle.title.trim().split(/\s+/);

  // Mild
  hints.push({
    level: "mild",
    text: `This song is from the ${decade}s.`,
  });

  // Medium
  hints.push({
    level: "medium",
    text: `The artist's name starts with "${puzzle.artist[0].toUpperCase()}".`,
  });

  // Strong
  hints.push({
    level: "strong",
    text: `Released in ${puzzle.year}. The song title is ${titleWords.length} word${titleWords.length !== 1 ? "s" : ""} long.`,
  });

  return hints;
}
