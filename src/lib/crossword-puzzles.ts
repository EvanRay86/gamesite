import type { CrosswordPuzzle, CrosswordClue, CrosswordCell } from "@/types/crossword";

// ---------------------------------------------------------------------------
// Word placement engine — builds a crossword grid from a list of clue entries
// ---------------------------------------------------------------------------

interface ClueEntry {
  answer: string;
  clue: string;
}

interface PlacedWord {
  answer: string;
  clue: string;
  row: number;
  col: number;
  direction: "across" | "down";
}

function placeWords(
  entries: ClueEntry[],
  gridSize: number
): PlacedWord[] | null {
  const grid: (string | null)[][] = Array.from({ length: gridSize }, () =>
    Array(gridSize).fill(null)
  );
  const placed: PlacedWord[] = [];

  // Sort words longest first for better placement
  const sorted = [...entries].sort((a, b) => b.answer.length - a.answer.length);

  // Place first word horizontally in the center
  const first = sorted[0];
  const startRow = Math.floor(gridSize / 2);
  const startCol = Math.floor((gridSize - first.answer.length) / 2);

  for (let i = 0; i < first.answer.length; i++) {
    grid[startRow][startCol + i] = first.answer[i];
  }
  placed.push({
    ...first,
    row: startRow,
    col: startCol,
    direction: "across",
  });

  // Try to place remaining words by finding intersections
  for (let wi = 1; wi < sorted.length; wi++) {
    const word = sorted[wi];
    let bestPlacement: PlacedWord | null = null;
    let bestScore = -1;

    for (const pw of placed) {
      for (let pi = 0; pi < pw.answer.length; pi++) {
        for (let wi2 = 0; wi2 < word.answer.length; wi2++) {
          if (pw.answer[pi] !== word.answer[wi2]) continue;

          const dir: "across" | "down" =
            pw.direction === "across" ? "down" : "across";
          let row: number, col: number;

          if (dir === "down") {
            row = pw.row - wi2;
            col = pw.col + pi;
          } else {
            row = pw.row + pi;
            col = pw.col - wi2;
          }

          if (canPlace(grid, word.answer, row, col, dir, gridSize)) {
            // Score: prefer placements closer to center
            const centerR = gridSize / 2;
            const centerC = gridSize / 2;
            const midR =
              dir === "down" ? row + word.answer.length / 2 : row;
            const midC =
              dir === "across" ? col + word.answer.length / 2 : col;
            const dist = Math.abs(midR - centerR) + Math.abs(midC - centerC);
            const score = 100 - dist;

            if (score > bestScore) {
              bestScore = score;
              bestPlacement = { ...word, row, col, direction: dir };
            }
          }
        }
      }
    }

    if (bestPlacement) {
      const { answer, row, col, direction } = bestPlacement;
      for (let i = 0; i < answer.length; i++) {
        const r = direction === "down" ? row + i : row;
        const c = direction === "across" ? col + i : col;
        grid[r][c] = answer[i];
      }
      placed.push(bestPlacement);
    }
  }

  return placed;
}

function canPlace(
  grid: (string | null)[][],
  word: string,
  row: number,
  col: number,
  dir: "across" | "down",
  size: number
): boolean {
  let hasIntersection = false;

  for (let i = 0; i < word.length; i++) {
    const r = dir === "down" ? row + i : row;
    const c = dir === "across" ? col + i : col;

    // Bounds check
    if (r < 0 || r >= size || c < 0 || c >= size) return false;

    const existing = grid[r][c];

    if (existing !== null) {
      if (existing !== word[i]) return false;
      hasIntersection = true;
    } else {
      // Check adjacent cells perpendicular to direction
      if (dir === "across") {
        if (r > 0 && grid[r - 1][c] !== null) return false;
        if (r < size - 1 && grid[r + 1][c] !== null) return false;
      } else {
        if (c > 0 && grid[r][c - 1] !== null) return false;
        if (c < size - 1 && grid[r][c + 1] !== null) return false;
      }
    }
  }

  // Check cell before start
  const beforeR = dir === "down" ? row - 1 : row;
  const beforeC = dir === "across" ? col - 1 : col;
  if (beforeR >= 0 && beforeC >= 0 && grid[beforeR][beforeC] !== null)
    return false;

  // Check cell after end
  const afterR = dir === "down" ? row + word.length : row;
  const afterC = dir === "across" ? col + word.length : col;
  if (afterR < size && afterC < size && grid[afterR][afterC] !== null)
    return false;

  return hasIntersection || grid.flat().every((c) => c === null);
}

// ---------------------------------------------------------------------------
// Build a CrosswordPuzzle from placed words
// ---------------------------------------------------------------------------

function buildPuzzle(
  id: string,
  date: string,
  title: string,
  subtitle: string,
  placedWords: PlacedWord[]
): CrosswordPuzzle {
  // Find bounding box
  let minR = Infinity,
    maxR = -Infinity,
    minC = Infinity,
    maxC = -Infinity;

  for (const w of placedWords) {
    const endR =
      w.direction === "down" ? w.row + w.answer.length - 1 : w.row;
    const endC =
      w.direction === "across" ? w.col + w.answer.length - 1 : w.col;
    minR = Math.min(minR, w.row);
    maxR = Math.max(maxR, endR);
    minC = Math.min(minC, w.col);
    maxC = Math.max(maxC, endC);
  }

  // Add 1 cell padding
  minR -= 1;
  minC -= 1;
  maxR += 1;
  maxC += 1;

  const rows = maxR - minR + 1;
  const cols = maxC - minC + 1;

  // Shift placed words
  const shifted = placedWords.map((w) => ({
    ...w,
    row: w.row - minR,
    col: w.col - minC,
  }));

  // Build letter grid
  const letterGrid: (string | null)[][] = Array.from({ length: rows }, () =>
    Array(cols).fill(null)
  );

  for (const w of shifted) {
    for (let i = 0; i < w.answer.length; i++) {
      const r = w.direction === "down" ? w.row + i : w.row;
      const c = w.direction === "across" ? w.col + i : w.col;
      letterGrid[r][c] = w.answer[i];
    }
  }

  // Assign clue numbers
  const numberMap = new Map<string, number>();
  let clueNum = 1;

  // Collect all start positions, sort by row then col
  const starts = shifted
    .map((w) => ({ key: `${w.row},${w.col}`, row: w.row, col: w.col }))
    .sort((a, b) => a.row - b.row || a.col - b.col);

  for (const s of starts) {
    if (!numberMap.has(s.key)) {
      numberMap.set(s.key, clueNum++);
    }
  }

  // Build cells
  const grid: CrosswordCell[][] = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => ({
      letter: letterGrid[r][c] ?? "",
      isBlack: letterGrid[r][c] === null,
      row: r,
      col: c,
      number: numberMap.get(`${r},${c}`),
    }))
  );

  // Build clues
  const acrossClues: CrosswordClue[] = [];
  const downClues: CrosswordClue[] = [];

  for (const w of shifted) {
    const num = numberMap.get(`${w.row},${w.col}`)!;
    const clue: CrosswordClue = {
      number: num,
      clue: w.clue,
      answer: w.answer,
      direction: w.direction,
      row: w.row,
      col: w.col,
    };
    if (w.direction === "across") acrossClues.push(clue);
    else downClues.push(clue);
  }

  acrossClues.sort((a, b) => a.number - b.number);
  downClues.sort((a, b) => a.number - b.number);

  return {
    id,
    date,
    title,
    subtitle,
    grid,
    clues: { across: acrossClues, down: downClues },
    rows,
    cols,
  };
}

// ---------------------------------------------------------------------------
// Daily puzzle data — news & pop culture themed
// ---------------------------------------------------------------------------

const dailyPuzzles: Record<string, { title: string; subtitle: string; entries: ClueEntry[] }> = {
  "2026-03-24": {
    title: "News Crossword",
    subtitle: "Today in the headlines — March 24, 2026",
    entries: [
      { answer: "DAREDEVIL", clue: "Marvel hero back for 'Born Again' Season 2 on Disney+" },
      { answer: "GOSLING", clue: "Ryan ___, star of sci-fi film 'Project Hail Mary'" },
      { answer: "TEHRAN", clue: "Iranian capital at center of ongoing conflict" },
      { answer: "MULLIN", clue: "Markwayne ___, newly confirmed DHS Secretary" },
      { answer: "PIXAR", clue: "Animation studio behind new film 'Hoppers'" },
      { answer: "HATHAWAY", clue: "Anne ___, actress with six films releasing in 2026" },
      { answer: "NASDAQ", clue: "Tech-heavy stock index that gained 1.38% Monday" },
      { answer: "CARELL", clue: "Steve ___, star of HBO comedy 'Rooster'" },
      { answer: "STYLES", clue: "Harry ___, recent SNL host and musical guest" },
      { answer: "DRONE", clue: "Type of strike on Saudi port of Yanbu" },
      { answer: "CUBA", clue: "Island nation where power grid collapsed in March" },
      { answer: "FISK", clue: "Wilson ___, Kingpin who declared martial law in Hell's Kitchen" },
    ],
  },
};

// Fallback puzzle for any date without specific data
const fallbackEntries: ClueEntry[] = [
  { answer: "HEADLINE", clue: "Top story in a newspaper" },
  { answer: "BREAKING", clue: "___ news: urgent report" },
  { answer: "ANCHOR", clue: "TV news presenter" },
  { answer: "VIRAL", clue: "Spreading rapidly online" },
  { answer: "TREND", clue: "What's popular on social media" },
  { answer: "SUMMIT", clue: "Meeting of world leaders" },
  { answer: "CLIMATE", clue: "Global ___ change" },
  { answer: "BALLOT", clue: "What voters cast on Election Day" },
  { answer: "PODCAST", clue: "Audio show you subscribe to" },
  { answer: "STREAM", clue: "Watch a show online" },
  { answer: "MEME", clue: "Funny image shared on the internet" },
  { answer: "SCOOP", clue: "Exclusive news story" },
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

const GRID_SIZE = 20;

export function getCrosswordPuzzle(date: string): CrosswordPuzzle {
  const data = dailyPuzzles[date] ?? {
    title: "News Crossword",
    subtitle: "Test your knowledge of current events",
    entries: fallbackEntries,
  };

  const placed = placeWords(data.entries, GRID_SIZE);

  if (!placed || placed.length === 0) {
    // Should not happen with well-chosen words, but fallback
    const fb = placeWords(fallbackEntries, GRID_SIZE)!;
    return buildPuzzle(date, date, data.title, data.subtitle, fb);
  }

  return buildPuzzle(date, date, data.title, data.subtitle, placed);
}

export function getTodaysCrossword(): CrosswordPuzzle {
  const today = new Date().toISOString().slice(0, 10);
  return getCrosswordPuzzle(today);
}
