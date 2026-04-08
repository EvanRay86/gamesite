import type { Hint } from "@/types/hints";
import type { TimelinePuzzle } from "@/types/timeline";

export function generateTimelineHints(puzzle: TimelinePuzzle): Hint[] {
  const hints: Hint[] = [];
  const events = puzzle.events;
  const years = events.map((e) => e.year).sort((a, b) => a - b);

  // Mild
  const minCentury = Math.floor(years[0] / 100) * 100;
  const maxCentury = Math.floor(years[years.length - 1] / 100) * 100;
  hints.push({
    level: "mild",
    text:
      minCentury === maxCentury
        ? `All events are from the ${minCentury}s.`
        : `Events span from the ${minCentury}s to the ${maxCentury}s.`,
  });

  // Medium — earliest and latest year
  hints.push({
    level: "medium",
    text: `The earliest event is from ${years[0]} and the latest is from ${years[years.length - 1]}.`,
  });

  // Strong — reveal one event's correct position
  const sorted = [...events].sort((a, b) => a.year - b.year);
  const midIdx = Math.floor(sorted.length / 2);
  hints.push({
    level: "strong",
    text: `"${sorted[midIdx].description}" is event #${midIdx + 1} chronologically (${sorted[midIdx].year}).`,
  });

  return hints;
}
