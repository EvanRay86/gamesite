import type { Hint } from "@/types/hints";
import type { EmojiWordPuzzle } from "@/types/emoji-word";

export function generateEmojiDecoderHints(puzzle: EmojiWordPuzzle): Hint[] {
  const hints: Hint[] = [];

  // Mild — word/phrase lengths
  for (let i = 0; i < puzzle.rounds.length; i++) {
    const r = puzzle.rounds[i];
    const wordCount = r.answer.trim().split(/\s+/).length;
    hints.push({
      level: "mild",
      text: `Round ${i + 1}: ${wordCount === 1 ? `${r.answer.length} letters` : `${wordCount} words, ${r.answer.length} characters total`}.`,
    });
  }

  // Medium — first letter
  for (let i = 0; i < puzzle.rounds.length; i++) {
    const r = puzzle.rounds[i];
    hints.push({
      level: "medium",
      text: `Round ${i + 1} starts with "${r.answer[0].toUpperCase()}".`,
    });
  }

  // Strong — first letter of each word (for multi-word) or first+last
  for (let i = 0; i < puzzle.rounds.length; i++) {
    const r = puzzle.rounds[i];
    const words = r.answer.trim().split(/\s+/);
    if (words.length > 1) {
      const initials = words.map((w) => w[0].toUpperCase()).join(", ");
      hints.push({
        level: "strong",
        text: `Round ${i + 1}: Word initials are ${initials}.`,
      });
    } else {
      hints.push({
        level: "strong",
        text: `Round ${i + 1}: Starts with "${r.answer[0].toUpperCase()}", ends with "${r.answer[r.answer.length - 1].toUpperCase()}".`,
      });
    }
  }

  return hints;
}
