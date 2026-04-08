import type { Hint } from "@/types/hints";
import type { ChainReactionPuzzle } from "@/lib/chain-reaction-puzzles";

export function generateChainReactionHints(
  puzzle: ChainReactionPuzzle,
): Hint[] {
  const hints: Hint[] = [];
  const chain = puzzle.chain;

  // Mild
  hints.push({
    level: "mild",
    text: `Fill in ${chain.length - 2} hidden words between "${chain[0].toUpperCase()}" and "${chain[chain.length - 1].toUpperCase()}". Each adjacent pair forms a compound word or common phrase.`,
  });

  // Medium — hidden word lengths
  for (let i = 1; i < chain.length - 1; i++) {
    hints.push({
      level: "medium",
      text: `Hidden word ${i} is ${chain[i].length} letters long.`,
    });
  }

  // Strong — first letter of hidden words
  for (let i = 1; i < chain.length - 1; i++) {
    hints.push({
      level: "strong",
      text: `Hidden word ${i} starts with "${chain[i][0].toUpperCase()}" (${chain[i].length} letters).`,
    });
  }

  return hints;
}
