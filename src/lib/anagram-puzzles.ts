import { getSupabase } from "./supabase";
import type { AnagramPuzzle, AnagramWord } from "@/types/anagram";

export function getTodayDate(): string {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

export async function getAnagramPuzzleByDate(
  date: string
): Promise<AnagramPuzzle | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("anagram_puzzles")
    .select("*")
    .eq("puzzle_date", date)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    puzzle_date: data.puzzle_date,
    words: data.words,
  };
}

export async function getAnagramArchiveDates(): Promise<{ puzzle_date: string }[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("anagram_puzzles")
    .select("puzzle_date")
    .lte("puzzle_date", getTodayDate())
    .order("puzzle_date", { ascending: false });

  if (error || !data) return [];
  return data;
}

export function getFallbackAnagramPuzzle(date: string): AnagramPuzzle {
  const epoch = new Date("2024-01-01").getTime();
  const target = new Date(date).getTime();
  const daysSinceEpoch = Math.floor((target - epoch) / (1000 * 60 * 60 * 24));
  const index = Math.abs(daysSinceEpoch) % ANAGRAM_SEED_PUZZLES.length;

  return {
    id: `fallback-anagram-${date}`,
    puzzle_date: date,
    words: ANAGRAM_SEED_PUZZLES[index],
  };
}

// ── Seed data (10 days of puzzles) ──────────────────────────────────────

const ANAGRAM_SEED_PUZZLES: AnagramWord[][] = [
  // Day 1
  [
    { word: "PLANET", scrambled: "LENTAP", hint: "Space" },
    { word: "BRIDGE", scrambled: "DGEBIR", hint: "Structure" },
    { word: "CASTLE", scrambled: "CLATSE", hint: "Medieval" },
    { word: "FROZEN", scrambled: "NORFEZ", hint: "Temperature" },
    { word: "GUITAR", scrambled: "TIRGUA", hint: "Music" },
  ],
  // Day 2
  [
    { word: "ROCKET", scrambled: "COKRET", hint: "Space" },
    { word: "JUNGLE", scrambled: "LUNGJE", hint: "Nature" },
    { word: "MUSEUM", scrambled: "USEMMU", hint: "Culture" },
    { word: "SILVER", scrambled: "LIVERS", hint: "Metal" },
    { word: "GARDEN", scrambled: "DANGER", hint: "Outdoors" },
  ],
  // Day 3
  [
    { word: "TROPHY", scrambled: "PYTHRO", hint: "Award" },
    { word: "ANCHOR", scrambled: "RANCHO", hint: "Nautical" },
    { word: "SPIRIT", scrambled: "TRIPSI", hint: "Energy" },
    { word: "CANDLE", scrambled: "LANCED", hint: "Light" },
    { word: "PIRATE", scrambled: "TAPIRE", hint: "Adventure" },
  ],
  // Day 4
  [
    { word: "WIZARD", scrambled: "ZIDRAW", hint: "Fantasy" },
    { word: "TEMPLE", scrambled: "METPLE", hint: "Architecture" },
    { word: "DRAGON", scrambled: "GRANDO", hint: "Mythology" },
    { word: "BREEZE", scrambled: "ZEBREE", hint: "Weather" },
    { word: "VELVET", scrambled: "LEVVET", hint: "Fabric" },
  ],
  // Day 5
  [
    { word: "OYSTER", scrambled: "STOREY", hint: "Seafood" },
    { word: "HAMMER", scrambled: "MAMHER", hint: "Tool" },
    { word: "PUZZLE", scrambled: "ZULPEZ", hint: "Game" },
    { word: "TUNDRA", scrambled: "UNTRAD", hint: "Biome" },
    { word: "SPHINX", scrambled: "PHINXS", hint: "Ancient" },
  ],
  // Day 6
  [
    { word: "PARROT", scrambled: "RAPTOR", hint: "Bird" },
    { word: "MARBLE", scrambled: "BLAMER", hint: "Material" },
    { word: "SUMMIT", scrambled: "TIMMSU", hint: "Mountain" },
    { word: "COBALT", scrambled: "ALTBOC", hint: "Color" },
    { word: "QUARTZ", scrambled: "TZARQU", hint: "Mineral" },
  ],
  // Day 7
  [
    { word: "FALCON", scrambled: "CLONFA", hint: "Bird" },
    { word: "BASKET", scrambled: "STEABK", hint: "Container" },
    { word: "RHYTHM", scrambled: "THYMRH", hint: "Music" },
    { word: "CACTUS", scrambled: "TCACSU", hint: "Plant" },
    { word: "OXYGEN", scrambled: "GONEXY", hint: "Element" },
  ],
  // Day 8
  [
    { word: "KERNEL", scrambled: "LENREK", hint: "Computing" },
    { word: "COYOTE", scrambled: "TOYCOE", hint: "Animal" },
    { word: "MAGNET", scrambled: "TANGME", hint: "Physics" },
    { word: "WALNUT", scrambled: "NUTLAW", hint: "Food" },
    { word: "METEOR", scrambled: "REMOTE", hint: "Space" },
  ],
  // Day 9
  [
    { word: "SAFARI", scrambled: "FARSAI", hint: "Travel" },
    { word: "CIPHER", scrambled: "PHRICE", hint: "Code" },
    { word: "GOBLIN", scrambled: "BONGIL", hint: "Fantasy" },
    { word: "PENCIL", scrambled: "CLIPEN", hint: "Writing" },
    { word: "STEREO", scrambled: "REESTO", hint: "Audio" },
  ],
  // Day 10
  [
    { word: "IGUANA", scrambled: "GUANAI", hint: "Reptile" },
    { word: "ZENITH", scrambled: "THINZE", hint: "Astronomy" },
    { word: "FJORD", scrambled: "DJORF", hint: "Geography" },
    { word: "LOCKET", scrambled: "CKOTLE", hint: "Jewelry" },
    { word: "TURBAN", scrambled: "BURNTA", hint: "Clothing" },
  ],
];
