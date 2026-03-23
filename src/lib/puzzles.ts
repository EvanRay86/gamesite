import { getSupabase } from "./supabase";
import type { Puzzle, Group } from "@/types/puzzle";
import { SEED_PUZZLES } from "./seed-data";

/** Get today's date as YYYY-MM-DD in local time */
export function getTodayDate(): string {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

/** Fetch puzzle for a given date from Supabase */
export async function getPuzzleByDate(
  date: string
): Promise<Puzzle | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("puzzles")
    .select("id, puzzle_date, groups")
    .eq("puzzle_date", date)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    puzzle_date: data.puzzle_date,
    groups: data.groups as Group[],
  };
}

/** Fetch all past puzzles (dates only, for the archive) */
export async function getArchiveDates(): Promise<
  { puzzle_date: string }[]
> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("puzzles")
    .select("puzzle_date")
    .lte("puzzle_date", getTodayDate())
    .order("puzzle_date", { ascending: false });

  if (error || !data) return [];
  return data;
}

/**
 * Fallback: pick a puzzle from local seed data based on the date.
 * Used when Supabase is not configured or the fetch fails.
 */
export function getFallbackPuzzle(date: string): Puzzle {
  const daysSinceEpoch = Math.floor(
    new Date(date).getTime() / (1000 * 60 * 60 * 24)
  );
  const index = Math.abs(daysSinceEpoch) % SEED_PUZZLES.length;
  return {
    id: `local-${index}`,
    puzzle_date: date,
    groups: SEED_PUZZLES[index],
  };
}
