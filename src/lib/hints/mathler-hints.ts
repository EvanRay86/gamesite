import type { Hint } from "@/types/hints";
import type { MathlerPuzzle } from "@/lib/mathler-puzzles";

export function generateMathlerHints(puzzle: MathlerPuzzle): Hint[] {
  const hints: Hint[] = [];
  const eq = puzzle.equation;

  // Mild — target is already shown in game, but confirm
  hints.push({
    level: "mild",
    text: `The target number is ${puzzle.target}. Find the 6-character equation.`,
  });

  // Medium — which operators are used
  const ops = eq.split("").filter((c) => "+-*/".includes(c));
  const uniqueOps = [...new Set(ops)];
  hints.push({
    level: "medium",
    text: `The equation uses ${uniqueOps.length === 1 ? "one operator" : `${uniqueOps.length} operators`}: ${uniqueOps.map((o) => `"${o}"`).join(" and ")}.`,
  });

  // Strong — digit frequency
  const digits = eq.split("").filter((c) => /\d/.test(c));
  const freq: Record<string, number> = {};
  for (const d of digits) freq[d] = (freq[d] || 0) + 1;
  const freqStr = Object.entries(freq)
    .map(([d, count]) => `"${d}"${count > 1 ? ` x${count}` : ""}`)
    .join(", ");
  hints.push({
    level: "strong",
    text: `The equation contains these digits: ${freqStr}.`,
  });

  return hints;
}
