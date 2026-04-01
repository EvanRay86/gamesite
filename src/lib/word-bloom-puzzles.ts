import { getSupabase } from "./supabase";
import type { WordBloomPuzzle } from "@/types/word-bloom";

export function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

export async function getWordBloomPuzzleByDate(
  date: string
): Promise<WordBloomPuzzle | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("word_bloom_puzzles")
    .select("*")
    .eq("puzzle_date", date)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    puzzle_date: data.puzzle_date,
    letters: data.letters,
  };
}

export async function getWordBloomArchiveDates(): Promise<
  { puzzle_date: string }[]
> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("word_bloom_puzzles")
    .select("puzzle_date")
    .lte("puzzle_date", getTodayDate())
    .order("puzzle_date", { ascending: false });

  if (error || !data) return [];
  return data;
}

export function getFallbackWordBloomPuzzle(date: string): WordBloomPuzzle {
  const epoch = new Date("2024-01-01").getTime();
  const target = new Date(date).getTime();
  const daysSinceEpoch = Math.floor((target - epoch) / (1000 * 60 * 60 * 24));
  const index = Math.abs(daysSinceEpoch) % SEED_PUZZLES.length;

  return {
    id: `fallback-word-bloom-${date}`,
    puzzle_date: date,
    letters: SEED_PUZZLES[index],
  };
}

// ── Seed data ─────────────────────────────────────────────────────────────
// Each entry is 7 uppercase letters. Index 0 = required center letter.
// Chosen for rich valid-word coverage with common vowel/consonant mixes.

const SEED_PUZZLES: string[][] = [
  // 1: center R — TRADING, DARTING, RATING, GRIND, GRAIN, RAID, RANG, etc.
  ["R", "T", "A", "D", "I", "N", "G"],
  // 2: center L — PLACING, LACING, CLAPPING, PALING, PLAIN, PLAN, etc.
  ["L", "P", "A", "C", "I", "N", "G"],
  // 3: center E — SHELTER, LATHERS, HALTERS, STEALER, etc.
  ["E", "S", "H", "L", "T", "A", "R"],
  // 4: center A — ROASTING, RATIONS, SOARING, STORING, etc.
  ["A", "R", "O", "S", "T", "I", "N"],
  // 5: center N — POINTED, PENDING, PINED, OPINED, DOPING, etc.
  ["N", "P", "O", "I", "D", "E", "T"],
  // 6: center T — COUNTER, TROUNCE, RECOUNT, CORNUTE, etc.
  ["T", "C", "O", "U", "N", "R", "E"],
  // 7: center S — BLASTER, STABLER, SALTER, STABLE, etc.
  ["S", "B", "L", "A", "T", "E", "R"],
  // 8: center I — WINSOME, MINOWS, WINOS, MINE, WINE, etc.
  ["I", "W", "N", "S", "O", "M", "E"],
  // 9: center O — FORMING, ROOMING, MOORING, MINOR, FLOOR, etc.
  ["O", "F", "R", "M", "I", "N", "G"],
  // 10: center E — PONDERS, RESPOND, PERSONA, DRAPES, etc.
  ["E", "P", "R", "O", "N", "D", "S"],
  // 11: center A — HUMBLE, CAPABLE, TABLE, CABLE, etc.
  ["A", "C", "B", "L", "E", "T", "H"],
  // 12: center T — PLASTER, STAPLER, PSALTER, etc.
  ["T", "P", "L", "A", "S", "E", "R"],
  // 13: center I — CLAIMED, MEDICAL, DECIMAL, MALICE, etc.
  ["I", "C", "L", "A", "M", "E", "D"],
  // 14: center E — HOSTING, ETHOS, THOSE, SHONE, etc.
  ["E", "H", "O", "S", "T", "I", "N"],
  // 15: center A — DURABLE, BLARED, ALDER, BLADE, etc.
  ["A", "D", "U", "R", "B", "L", "E"],
];
