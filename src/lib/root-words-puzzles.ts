import { getSupabase } from "./supabase";
import type { RootWordsPuzzle } from "@/types/root-words";

export function getTodayDate(): string {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

export async function getRootWordsPuzzleByDate(
  date: string
): Promise<RootWordsPuzzle | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("root_words_puzzles")
    .select("*")
    .eq("puzzle_date", date)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    puzzle_date: data.puzzle_date,
    root: data.root,
    meaning: data.meaning,
    origin: data.origin,
  };
}

export async function getRootWordsArchiveDates(): Promise<
  { puzzle_date: string }[]
> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("root_words_puzzles")
    .select("puzzle_date")
    .lte("puzzle_date", getTodayDate())
    .order("puzzle_date", { ascending: false });

  if (error || !data) return [];
  return data;
}

export function getFallbackRootWordsPuzzle(date: string): RootWordsPuzzle {
  const epoch = new Date("2024-01-01").getTime();
  const target = new Date(date).getTime();
  const daysSinceEpoch = Math.floor((target - epoch) / (1000 * 60 * 60 * 24));
  const index = Math.abs(daysSinceEpoch) % SEED_ROOTS.length;

  return {
    id: `fallback-root-words-${date}`,
    puzzle_date: date,
    root: SEED_ROOTS[index].root,
    meaning: SEED_ROOTS[index].meaning,
    origin: SEED_ROOTS[index].origin,
  };
}

// ── Seed data (60+ roots with meanings and origins) ───────────────────

const SEED_ROOTS: { root: string; meaning: string; origin: string }[] = [
  { root: "CHRON", meaning: "time", origin: "Greek" },
  { root: "BIO", meaning: "life", origin: "Greek" },
  { root: "GEO", meaning: "earth", origin: "Greek" },
  { root: "GRAPH", meaning: "write", origin: "Greek" },
  { root: "PHON", meaning: "sound", origin: "Greek" },
  { root: "MORPH", meaning: "form", origin: "Greek" },
  { root: "PHIL", meaning: "love", origin: "Greek" },
  { root: "SCOPE", meaning: "see/watch", origin: "Greek" },
  { root: "DICT", meaning: "say", origin: "Latin" },
  { root: "RUPT", meaning: "break", origin: "Latin" },
  { root: "STRUCT", meaning: "build", origin: "Latin" },
  { root: "PORT", meaning: "carry", origin: "Latin" },
  { root: "SPEC", meaning: "look", origin: "Latin" },
  { root: "JECT", meaning: "throw", origin: "Latin" },
  { root: "TRACT", meaning: "pull/draw", origin: "Latin" },
  { root: "VERT", meaning: "turn", origin: "Latin" },
  { root: "CRED", meaning: "believe", origin: "Latin" },
  { root: "CRYPT", meaning: "hidden", origin: "Greek" },
  { root: "CYCL", meaning: "circle", origin: "Greek" },
  { root: "DEMO", meaning: "people", origin: "Greek" },
  { root: "DERM", meaning: "skin", origin: "Greek" },
  { root: "HYDRO", meaning: "water", origin: "Greek" },
  { root: "LOGY", meaning: "study", origin: "Greek" },
  { root: "METER", meaning: "measure", origin: "Greek" },
  { root: "MICRO", meaning: "small", origin: "Greek" },
  { root: "MONO", meaning: "one", origin: "Greek" },
  { root: "PATH", meaning: "feeling/disease", origin: "Greek" },
  { root: "POLY", meaning: "many", origin: "Greek" },
  { root: "PSYCH", meaning: "mind", origin: "Greek" },
  { root: "THERM", meaning: "heat", origin: "Greek" },
  { root: "ANIM", meaning: "life/spirit", origin: "Latin" },
  { root: "AUD", meaning: "hear", origin: "Latin" },
  { root: "BENE", meaning: "good/well", origin: "Latin" },
  { root: "CARN", meaning: "flesh", origin: "Latin" },
  { root: "CENT", meaning: "hundred", origin: "Latin" },
  { root: "COSM", meaning: "universe/order", origin: "Greek" },
  { root: "DENT", meaning: "tooth", origin: "Latin" },
  { root: "DUC", meaning: "lead", origin: "Latin" },
  { root: "FLEX", meaning: "bend", origin: "Latin" },
  { root: "FORT", meaning: "strong", origin: "Latin" },
  { root: "GRAT", meaning: "pleasing/thankful", origin: "Latin" },
  { root: "HEMO", meaning: "blood", origin: "Greek" },
  { root: "JUNCT", meaning: "join", origin: "Latin" },
  { root: "LUM", meaning: "light", origin: "Latin" },
  { root: "MAGN", meaning: "great/large", origin: "Latin" },
  { root: "MANU", meaning: "hand", origin: "Latin" },
  { root: "MISS", meaning: "send", origin: "Latin" },
  { root: "MORT", meaning: "death", origin: "Latin" },
  { root: "NOV", meaning: "new", origin: "Latin" },
  { root: "OMNI", meaning: "all", origin: "Latin" },
  { root: "PED", meaning: "foot", origin: "Latin" },
  { root: "PEND", meaning: "hang/weigh", origin: "Latin" },
  { root: "PHOT", meaning: "light", origin: "Greek" },
  { root: "PRIM", meaning: "first", origin: "Latin" },
  { root: "SCRIB", meaning: "write", origin: "Latin" },
  { root: "SENS", meaning: "feel", origin: "Latin" },
  { root: "SOL", meaning: "sun", origin: "Latin" },
  { root: "TERRA", meaning: "earth/land", origin: "Latin" },
  { root: "THEO", meaning: "god", origin: "Greek" },
  { root: "VIS", meaning: "see", origin: "Latin" },
  { root: "VOC", meaning: "voice/call", origin: "Latin" },
  { root: "ARCH", meaning: "chief/rule", origin: "Greek" },
  { root: "AUTO", meaning: "self", origin: "Greek" },
  { root: "BELL", meaning: "war", origin: "Latin" },
  { root: "CEDE", meaning: "go/yield", origin: "Latin" },
  { root: "CORP", meaning: "body", origin: "Latin" },
  { root: "FID", meaning: "faith/trust", origin: "Latin" },
  { root: "GRESS", meaning: "step/walk", origin: "Latin" },
  { root: "HELIO", meaning: "sun", origin: "Greek" },
  { root: "LEG", meaning: "law/read", origin: "Latin" },
  { root: "LIBER", meaning: "free", origin: "Latin" },
  { root: "LITH", meaning: "stone", origin: "Greek" },
  { root: "MNEM", meaning: "memory", origin: "Greek" },
  { root: "NEO", meaning: "new", origin: "Greek" },
  { root: "NEUR", meaning: "nerve", origin: "Greek" },
  { root: "OPT", meaning: "eye/sight", origin: "Greek" },
  { root: "PROTO", meaning: "first", origin: "Greek" },
  { root: "SANGUI", meaning: "blood", origin: "Latin" },
  { root: "SOPH", meaning: "wisdom", origin: "Greek" },
  { root: "TELE", meaning: "far/distant", origin: "Greek" },
];
