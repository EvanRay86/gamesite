import type { Hint } from "@/types/hints";
import type { TriviaPuzzle } from "@/types/trivia";

export function generateTriviaHints(puzzle: TriviaPuzzle): Hint[] {
  const hints: Hint[] = [];
  const questions = puzzle.questions;

  // Mild — categories covered
  const categories = [...new Set(questions.map((q) => q.category))];
  hints.push({
    level: "mild",
    text: `Today's ${questions.length} questions span these categories: ${categories.join(", ")}.`,
  });

  // Medium — eliminate 1 wrong option per question
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const wrongIdx = q.options.findIndex(
      (_, idx) => idx !== q.correctIndex,
    );
    if (wrongIdx !== -1) {
      hints.push({
        level: "medium",
        text: `Q${i + 1} (${q.category}): It's NOT "${q.options[wrongIdx]}".`,
      });
    }
  }

  // Strong — eliminate 2 wrong options (leaving correct + 1 decoy)
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const wrongOptions = q.options.filter(
      (_, idx) => idx !== q.correctIndex,
    );
    const eliminated = wrongOptions.slice(0, 2);
    if (eliminated.length === 2) {
      hints.push({
        level: "strong",
        text: `Q${i + 1}: Eliminate "${eliminated[0]}" and "${eliminated[1]}".`,
      });
    }
  }

  return hints;
}
