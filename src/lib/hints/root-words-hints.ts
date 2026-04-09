import type { Hint } from "@/types/hints";
import type { RootWordsPuzzle } from "@/types/root-words";

export function generateRootWordsHints(puzzle: RootWordsPuzzle): Hint[] {
  const hints: Hint[] = [];

  // Mild
  hints.push({
    level: "mild",
    text: `Today's root is "${puzzle.root}" from ${puzzle.origin}, meaning "${puzzle.meaning}".`,
  });
  hints.push({
    level: "mild",
    text: "Look for words in science, medicine, and everyday English that contain this root.",
  });

  // Medium — common word patterns
  const root = puzzle.root.toLowerCase();
  hints.push({
    level: "medium",
    text: `Try adding common endings like "-ology", "-tion", "-ic", "-ical", "-ist", or "-ism" to "${root}".`,
  });
  hints.push({
    level: "medium",
    text: `Also try prefixes like "un-", "re-", "anti-", "mono-", or "poly-" before "${root}".`,
  });

  // Strong — specific starting combos
  hints.push({
    level: "strong",
    text: `Words starting with "${root}" are the most obvious — but also look for words where "${root}" appears in the middle or end.`,
  });

  return hints;
}
