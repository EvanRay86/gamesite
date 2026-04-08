import type { Hint } from "@/types/hints";
import type { CrosswordPuzzle } from "@/types/crossword";

export function generateCrosswordHints(puzzle: CrosswordPuzzle): Hint[] {
  const hints: Hint[] = [];
  const allClues = [...puzzle.clues.across, ...puzzle.clues.down];

  // Mild
  hints.push({
    level: "mild",
    text: `Today's crossword is "${puzzle.title}"${puzzle.subtitle ? ` — ${puzzle.subtitle}` : ""}.`,
  });
  hints.push({
    level: "mild",
    text: `Grid size: ${puzzle.rows} x ${puzzle.cols} with ${puzzle.clues.across.length} across and ${puzzle.clues.down.length} down clues.`,
  });

  // Medium — first letter of the 3 longest answers
  const sorted = [...allClues].sort(
    (a, b) => b.answer.length - a.answer.length,
  );
  const top3 = sorted.slice(0, 3);
  for (const clue of top3) {
    hints.push({
      level: "medium",
      text: `${clue.number} ${clue.direction}: ${clue.answer.length} letters, starts with "${clue.answer[0]}".`,
    });
  }

  // Strong — answer lengths + a crossing letter for trickier clues
  const medium5 = sorted.slice(0, 5);
  for (const clue of medium5) {
    const mid = Math.floor(clue.answer.length / 2);
    hints.push({
      level: "strong",
      text: `${clue.number} ${clue.direction}: ${clue.answer.length} letters — letter ${mid + 1} is "${clue.answer[mid]}".`,
    });
  }

  return hints;
}
