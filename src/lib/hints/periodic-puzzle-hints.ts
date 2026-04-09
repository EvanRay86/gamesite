import type { Hint } from "@/types/hints";
import type { PeriodicPuzzle } from "@/types/periodic-puzzle";

export function generatePeriodicPuzzleHints(puzzle: PeriodicPuzzle): Hint[] {
  const hints: Hint[] = [];
  const el = puzzle.element;

  // Mild
  hints.push({
    level: "mild",
    text: `The element is a ${el.state} at room temperature.`,
  });
  hints.push({
    level: "mild",
    text: `It belongs to the ${el.category} category.`,
  });

  // Medium
  hints.push({
    level: "medium",
    text: `It is in period ${el.period} of the periodic table.`,
  });
  hints.push({
    level: "medium",
    text: `It was discovered in the ${el.discoveryEra}.`,
  });

  // Strong
  hints.push({
    level: "strong",
    text: `Its atomic number is between ${Math.max(1, el.atomicNumber - 5)} and ${el.atomicNumber + 5}.`,
  });
  hints.push({
    level: "strong",
    text: `Common use: ${el.commonUse}.`,
  });

  return hints;
}
