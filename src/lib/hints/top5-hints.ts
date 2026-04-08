import type { Hint } from "@/types/hints";
import type { Top5Puzzle } from "@/types/top5";

export function generateTop5Hints(puzzle: Top5Puzzle): Hint[] {
  const hints: Hint[] = [];
  const items = puzzle.items;

  // Mild
  hints.push({
    level: "mild",
    text: `Today's category: "${puzzle.category}". Rank ${items.length} items in order.`,
  });

  // Medium — first letter of the #1 item
  if (items.length > 0) {
    hints.push({
      level: "medium",
      text: `The #1 item starts with "${items[0].name[0].toUpperCase()}".`,
    });
  }

  // Strong — first letter of each item
  for (let i = 0; i < items.length; i++) {
    hints.push({
      level: "strong",
      text: `#${i + 1} starts with "${items[i].name[0].toUpperCase()}".`,
    });
  }

  return hints;
}
