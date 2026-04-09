import type { PeriodicPuzzle } from "@/types/periodic-puzzle";
import type { Element } from "@/types/periodic-puzzle";
import { ELEMENTS } from "./periodic-puzzle-data";
import { getSupabase } from "@/lib/supabase";

/** Elements 1-103 are used for puzzles (skip superheavy 104+) */
const PUZZLE_ELEMENTS = ELEMENTS.filter((el) => el.atomicNumber <= 103);

export function getTodayDate(): string {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

export async function getPeriodicPuzzleByDate(
  date: string
): Promise<PeriodicPuzzle | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("periodic_puzzles")
    .select("*")
    .eq("puzzle_date", date)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    puzzle_date: data.puzzle_date,
    element: data.element,
  };
}

export function getFallbackPeriodicPuzzle(date: string): PeriodicPuzzle {
  const epoch = new Date("2024-01-01").getTime();
  const target = new Date(date).getTime();
  const daysSinceEpoch = Math.floor((target - epoch) / (1000 * 60 * 60 * 24));
  const index = Math.abs(daysSinceEpoch) % PUZZLE_ELEMENTS.length;

  return {
    id: `fallback-periodic-${date}`,
    puzzle_date: date,
    element: PUZZLE_ELEMENTS[index],
  };
}

export async function getPeriodicPuzzleArchiveDates(): Promise<
  { puzzle_date: string }[]
> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("periodic_puzzles")
    .select("puzzle_date")
    .lte("puzzle_date", getTodayDate())
    .order("puzzle_date", { ascending: false });

  if (error || !data) return [];
  return data;
}

export function getElementByName(name: string): Element | undefined {
  return ELEMENTS.find(
    (el) => el.name.toLowerCase() === name.toLowerCase()
  );
}

export function getAllElementNames(): string[] {
  return ELEMENTS.map((el) => el.name);
}
