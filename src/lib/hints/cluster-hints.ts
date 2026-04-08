import type { Hint } from "@/types/hints";
import type { Puzzle } from "@/types/puzzle";

export function generateClusterHints(puzzle: Puzzle): Hint[] {
  const hints: Hint[] = [];
  const groups = puzzle.groups;

  // Mild
  hints.push({
    level: "mild",
    text: `Today's puzzle has ${groups.length} groups to find.`,
  });
  const difficulties = groups
    .map((g) => g.difficulty)
    .sort((a, b) => a - b);
  const diffLabels = difficulties.map((d) =>
    d <= 1 ? "easy" : d <= 2 ? "medium" : d <= 3 ? "hard" : "tricky",
  );
  hints.push({
    level: "mild",
    text: `Difficulty spread: ${diffLabels.join(", ")}.`,
  });
  hints.push({
    level: "mild",
    text: `Each group contains ${groups[0]?.words.length ?? 3} words.`,
  });

  // Medium — broad theme per group without naming the category
  for (let i = 0; i < groups.length; i++) {
    const cat = groups[i].category;
    const broadTheme = getBroadTheme(cat);
    hints.push({
      level: "medium",
      text: `Group ${i + 1} (${diffLabels[i]}): Think about ${broadTheme}.`,
    });
  }

  // Strong — reveal one word from each group
  for (let i = 0; i < groups.length; i++) {
    const words = groups[i].words;
    const revealIdx = Math.floor(words.length / 2);
    hints.push({
      level: "strong",
      text: `Group ${i + 1} includes the word "${words[revealIdx]}".`,
    });
  }

  return hints;
}

function getBroadTheme(category: string): string {
  const lower = category.toLowerCase();
  if (lower.includes("food") || lower.includes("dish") || lower.includes("cuisine") || lower.includes("pasta") || lower.includes("fruit"))
    return "things you might eat or drink";
  if (lower.includes("movie") || lower.includes("film") || lower.includes("actor"))
    return "the world of cinema";
  if (lower.includes("music") || lower.includes("song") || lower.includes("band") || lower.includes("artist"))
    return "the world of music";
  if (lower.includes("sport") || lower.includes("game") || lower.includes("team"))
    return "sports and competition";
  if (lower.includes("animal") || lower.includes("bird") || lower.includes("fish"))
    return "the animal kingdom";
  if (lower.includes("color") || lower.includes("colour"))
    return "colors and shades";
  if (lower.includes("country") || lower.includes("city") || lower.includes("place") || lower.includes("state"))
    return "geography and places";
  if (lower.includes("body") || lower.includes("anatomy"))
    return "the human body";
  if (lower.includes("tech") || lower.includes("computer") || lower.includes("software"))
    return "technology";
  if (lower.includes("book") || lower.includes("author") || lower.includes("novel"))
    return "literature";
  // Fallback: use first word of category as a vague hint
  const firstWord = category.split(/\s+/)[0].toLowerCase();
  return `things related to "${firstWord}..."`;
}
