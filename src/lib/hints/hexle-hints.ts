import type { Hint } from "@/types/hints";

export function generateHexleHints(word: string): Hint[] {
  const hints: Hint[] = [];
  const upper = word.toUpperCase();
  const vowels = upper.split("").filter((c) => "AEIOU".includes(c));
  const consonants = upper.split("").filter((c) => !"AEIOU".includes(c));
  const hasDouble = new Set(upper.split("")).size < upper.length;

  // Mild
  hints.push({
    level: "mild",
    text: `The word has ${vowels.length} vowel${vowels.length !== 1 ? "s" : ""} and ${consonants.length} consonant${consonants.length !== 1 ? "s" : ""}.`,
  });
  hints.push({
    level: "mild",
    text: hasDouble
      ? "The word contains at least one repeated letter."
      : "All six letters are unique.",
  });

  // Medium — first letter
  hints.push({
    level: "medium",
    text: `The word starts with "${upper[0]}".`,
  });

  // Strong — first + last letter
  hints.push({
    level: "strong",
    text: `The word starts with "${upper[0]}" and ends with "${upper[upper.length - 1]}".`,
  });

  return hints;
}
