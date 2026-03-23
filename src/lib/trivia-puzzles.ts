import { getSupabase } from "./supabase";
import { TRIVIA_SEED_PUZZLES } from "./trivia-seed-data";
import type { TriviaPuzzle } from "@/types/trivia";

export function getTodayDate(): string {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

export async function getTriviaPuzzleByDate(
  date: string
): Promise<TriviaPuzzle | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("trivia_puzzles")
    .select("*")
    .eq("puzzle_date", date)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    puzzle_date: data.puzzle_date,
    questions: data.questions,
  };
}

export function getFallbackTriviaPuzzle(date: string): TriviaPuzzle {
  const epoch = new Date("2024-01-01").getTime();
  const target = new Date(date).getTime();
  const daysSinceEpoch = Math.floor((target - epoch) / (1000 * 60 * 60 * 24));
  const index =
    Math.abs(daysSinceEpoch) % TRIVIA_SEED_PUZZLES.length;

  return {
    id: `fallback-trivia-${date}`,
    puzzle_date: date,
    questions: TRIVIA_SEED_PUZZLES[index],
  };
}
