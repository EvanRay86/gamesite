// Mathler — "Find the hidden equation" game data layer

import { getSupabase } from "@/lib/supabase";

export interface MathlerPuzzle {
  /** The hidden equation (exactly 6 characters) */
  equation: string;
  /** The target number the equation evaluates to */
  target: number;
}

// ---------------------------------------------------------------------------
// Seed puzzles — each equation is exactly 6 chars using digits and operators.
// Equations follow standard order of operations.
// ---------------------------------------------------------------------------

const seedPuzzles: MathlerPuzzle[] = [
  // Easy
  { equation: "10+5+3", target: 18 },
  { equation: "50-6-4", target: 40 },
  { equation: "15+9*3", target: 42 },
  { equation: "48/6+2", target: 10 },
  { equation: "7*8-12", target: 44 },
  { equation: "36/4+9", target: 18 },
  { equation: "5*9+13", target: 58 },
  { equation: "64/8+3", target: 11 },
  { equation: "9*7-18", target: 45 },
  { equation: "80-7*9", target: 17 },
  { equation: "6+8*11", target: 94 },
  { equation: "72/9+1", target: 9 },
  { equation: "3*4+28", target: 40 },
  { equation: "56/7+8", target: 16 },
  { equation: "99-8*6", target: 51 },
  { equation: "11*3+7", target: 40 },
  { equation: "4*7+22", target: 50 },
  // Medium
  { equation: "2+8*10", target: 82 },
  { equation: "90/5-6", target: 12 },
  { equation: "45-5*7", target: 10 },
  { equation: "3*8+26", target: 50 },
  { equation: "96/8-7", target: 5 },
  { equation: "17+4*8", target: 49 },
  { equation: "60/5+8", target: 20 },
  { equation: "7*6-19", target: 23 },
  { equation: "88-9*8", target: 16 },
  { equation: "13+9*4", target: 49 },
  { equation: "54/9+6", target: 12 },
  { equation: "6*5+30", target: 60 },
  { equation: "8*3+16", target: 40 },
  { equation: "42/7+5", target: 11 },
  { equation: "19-4+5", target: 20 },
  // Hard
  { equation: "7*9-23", target: 40 },
  { equation: "81/9+4", target: 13 },
  { equation: "3+7*12", target: 87 },
  { equation: "4*6+19", target: 43 },
  { equation: "75/5-3", target: 12 },
  { equation: "9*4-11", target: 25 },
  { equation: "28/4+3", target: 10 },
  { equation: "11+7*6", target: 53 },
  { equation: "8*9-37", target: 35 },
  { equation: "96/6-4", target: 12 },
  { equation: "5+6*13", target: 83 },
  { equation: "84/7-6", target: 6 },
  { equation: "9*5+14", target: 59 },
  { equation: "70-8*7", target: 14 },
  { equation: "6*7+18", target: 60 },
  { equation: "48/8+9", target: 15 },
  { equation: "3*9+17", target: 44 },
  { equation: "21-4+8", target: 25 },
  { equation: "32/8+5", target: 9 },
  { equation: "14+8*3", target: 38 },
  { equation: "7*5-16", target: 19 },
  { equation: "63/7+2", target: 11 },
  { equation: "8+5*14", target: 78 },
  { equation: "6*4+21", target: 45 },
  { equation: "50-9*4", target: 14 },
];

// ---------------------------------------------------------------------------
// Equation evaluator
// ---------------------------------------------------------------------------

/**
 * Safely evaluate a math expression containing only digits and operators.
 * Returns the numeric result or null if invalid.
 * Uses a simple recursive-descent parser (no eval).
 */
export function evaluateEquation(eq: string): number | null {
  // Validate: only digits and operators allowed
  if (!/^[\d+\-*/]+$/.test(eq)) return null;
  // Must not start or end with an operator
  if (/^[+\-*/]/.test(eq) || /[+\-*/]$/.test(eq)) return null;
  // No consecutive operators
  if (/[+\-*/]{2,}/.test(eq)) return null;

  try {
    const result = parseExpression(eq, 0);
    if (result === null || result.pos !== eq.length) return null;
    if (!Number.isFinite(result.value)) return null;
    return result.value;
  } catch {
    return null;
  }
}

interface ParseResult {
  value: number;
  pos: number;
}

function parseExpression(eq: string, pos: number): ParseResult | null {
  let left = parseTerm(eq, pos);
  if (!left) return null;

  while (left.pos < eq.length && (eq[left.pos] === "+" || eq[left.pos] === "-")) {
    const op: string = eq[left.pos];
    const right = parseTerm(eq, left.pos + 1);
    if (!right) return null;
    left = {
      value: op === "+" ? left.value + right.value : left.value - right.value,
      pos: right.pos,
    };
  }
  return left;
}

function parseTerm(eq: string, pos: number): ParseResult | null {
  let left = parseFactor(eq, pos);
  if (!left) return null;

  while (left.pos < eq.length && (eq[left.pos] === "*" || eq[left.pos] === "/")) {
    const op: string = eq[left.pos];
    const right = parseFactor(eq, left.pos + 1);
    if (!right) return null;
    left = {
      value: op === "*" ? left.value * right.value : left.value / right.value,
      pos: right.pos,
    };
  }
  return left;
}

function parseFactor(eq: string, pos: number): ParseResult | null {
  if (pos >= eq.length || !/\d/.test(eq[pos])) return null;
  let end = pos;
  while (end < eq.length && /\d/.test(eq[end])) end++;
  return { value: parseInt(eq.slice(pos, end), 10), pos: end };
}

// ---------------------------------------------------------------------------
// Daily puzzle selector
// ---------------------------------------------------------------------------

function dateToDayNumber(date: string): number {
  const d = new Date(date + "T00:00:00Z");
  return Math.floor(d.getTime() / 86_400_000);
}

export function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getSeedPuzzleCount(): number {
  return seedPuzzles.length;
}

/**
 * Deterministically pick a puzzle based on the date string.
 * Cycles through the puzzle pool using a hash so consecutive days vary.
 */
export function getMathlerPuzzle(date: string): MathlerPuzzle {
  const day = dateToDayNumber(date);
  const hash = ((day * 2654435761) >>> 0) % seedPuzzles.length;
  return seedPuzzles[hash];
}

// ---------------------------------------------------------------------------
// Supabase archive helpers
// ---------------------------------------------------------------------------

export async function getMathlerArchiveDates(): Promise<
  { puzzle_date: string }[]
> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data } = await supabase
    .from("mathler_puzzles")
    .select("puzzle_date")
    .lte("puzzle_date", getTodayDate())
    .order("puzzle_date", { ascending: false });

  return data ?? [];
}

export async function getMathlerPuzzleByDate(
  date: string,
): Promise<MathlerPuzzle | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data } = await supabase
    .from("mathler_puzzles")
    .select("equation, target")
    .eq("puzzle_date", date)
    .single();

  if (!data) return null;
  return { equation: data.equation, target: data.target };
}
