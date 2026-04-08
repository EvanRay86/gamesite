import type { Hint } from "@/types/hints";
import type { QuotablePuzzle } from "@/types/quotable";

export function generateQuotableHints(puzzle: QuotablePuzzle): Hint[] {
  const hints: Hint[] = [];

  // Mild
  if (puzzle.hint) {
    hints.push({ level: "mild", text: puzzle.hint });
  } else {
    hints.push({
      level: "mild",
      text: `The quote is ${puzzle.quote.split(/\s+/).length} words long.`,
    });
  }

  // Medium — first letter of attribution
  hints.push({
    level: "medium",
    text: `The speaker's name starts with "${puzzle.attribution[0].toUpperCase()}".`,
  });

  // Strong — eliminate 2 wrong options
  const wrong = puzzle.options.filter((o) => o !== puzzle.attribution);
  if (wrong.length >= 2) {
    hints.push({
      level: "strong",
      text: `It's NOT ${wrong[0]} or ${wrong[1]}.`,
    });
  }

  return hints;
}
