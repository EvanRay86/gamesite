// Hexle — 6-letter word guessing game
// Answer words are curated for broad appeal & recognition. Valid guesses is a superset.

import { isValidEnglishWord } from "./dictionary";

/** Words that can be chosen as the daily answer (common, recognizable 6-letter words). */
export const ANSWER_WORDS: string[] = [
  // Nature & animals
  "FOREST", "GARDEN", "FLOWER", "BREEZE", "STREAM", "ISLAND", "DESERT",
  "WINTER", "SUMMER", "SPRING", "PLANET", "SUNSET", "CANYON", "LAGOON",
  "MEADOW", "JUNGLE", "VALLEY", "NATURE", "BRANCH", "PEBBLE", "FALCON",
  "RABBIT", "WOLVES", "PARROT", "TURTLE", "SPIDER", "KITTEN", "DONKEY",
  // Food & drink
  "COFFEE", "DINNER", "BUTTER", "CHEESE", "PEPPER", "BANANA", "COOKIE",
  "PICKLE", "MUFFIN", "NOODLE", "PASTRY", "WAFFLE", "GINGER", "CELERY",
  "CHERRY", "MANGO", "PASTRY", "NECTAR", "BRUNCH", "OYSTER",
  // People & life
  "FAMILY", "FRIEND", "MOTHER", "FATHER", "COUPLE", "PEOPLE", "LEADER",
  "ARTIST", "SINGER", "AUTHOR", "KNIGHT", "PIRATE", "DOCTOR", "PLAYER",
  "DANCER", "GENIUS", "HERMIT", "NEPHEW",
  // Places & things
  "CASTLE", "BRIDGE", "STREET", "TEMPLE", "MARKET", "MUSEUM", "SCHOOL",
  "CHURCH", "PALACE", "THRONE", "MIRROR", "CANDLE", "RIBBON", "BASKET",
  "QUARTZ", "SILVER", "GOLDEN", "BRONZE", "BOTTLE", "PENCIL", "PILLOW",
  "BLANKE", "HAMMER", "SOCKET", "PUZZLE", "TICKET",
  // Actions & feelings
  "TRAVEL", "WONDER", "LAUNCH", "RESCUE", "CREATE", "ESCAPE", "GATHER",
  "SEARCH", "RETURN", "INVITE", "FREEZE", "THRIVE", "TUMBLE", "HUSTLE",
  "GIGGLE", "SNOOZE", "WANDER", "DRENCH", "FUMBLE", "JOYFUL", "GENTLE",
  "CLEVER", "FIERCE", "HONEST", "HUMBLE", "BRIGHT", "FROZEN", "SILENT",
  "BROKEN", "HIDDEN", "FAMOUS", "SIMPLE", "SACRED", "BITTER", "LIVELY",
  // Culture & fun
  "TROPHY", "ARCADE", "RECORD", "COMEDY", "RHYTHM", "LEGEND", "SPIRIT",
  "CANVAS", "DESIGN", "SKETCH", "MOTION", "POETRY", "VOYAGE", "TRIVIA",
  "SAFARI", "RIDDLE", "CIPHER", "ENIGMA", "MEMOIR", "NOVICE",
  // Science & tech
  "ENERGY", "SYSTEM", "SIGNAL", "SCREEN", "MOBILE", "OPTICS", "HYBRID",
  "ATOMIC", "MATRIX", "NEURAL", "FUSION", "TURBO", "LAUNCH", "ROCKET",
  "TOGGLE", "WIDGET", "GLITCH", "REBOOT",
  // Misc vivid words
  "ZENITH", "ZEPHYR", "VELVET", "HARBOR", "BEACON", "PRIMAL", "NIMBLE",
  "RUSTIC", "GILDED", "MOLTEN", "MYSTIC", "FERVOR", "THWART", "GROTTO",
  "CLUTCH", "FRENZY", "MINGLE", "PORTAL", "BUBBLE", "COBALT", "QUIVER",
  "TANGLE", "BREECH", "DAZZLE", "FROLIC", "SHIELD", "MUFFLE", "CLUMSY",
].filter(w => w.length === 6); // safety filter

// Remove duplicates
const uniqueAnswers = [...new Set(ANSWER_WORDS)];

import { getSupabase } from "./supabase";

/** Fetch today's Hexle word from Supabase. */
export async function getHexlePuzzle(date: string): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("hexle_puzzles")
    .select("word")
    .eq("puzzle_date", date)
    .single();

  if (error || !data) return null;
  return (data.word as string).toUpperCase();
}

/**
 * Fallback: deterministic daily word from a date string (YYYY-MM-DD).
 * Used when Supabase is not configured or the fetch fails.
 */
export function getFallbackHexleWord(date: string): string {
  const words = uniqueAnswers;
  let hash = 0;
  for (let i = 0; i < date.length; i++) {
    hash = (hash * 31 + date.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % words.length;
  return words[index];
}

/** Check if a word is a valid guess (uses comprehensive 6-letter dictionary). */
export function isValidGuess(word: string): boolean {
  return isValidEnglishWord(word, 6);
}

export function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

export function getSeedPuzzleCount(): number {
  return uniqueAnswers.length;
}

/** Fetch all hexle archive dates from Supabase. */
export async function getHexleArchiveDates(): Promise<
  { puzzle_date: string }[]
> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const today = getTodayDate();
  const { data, error } = await supabase
    .from("hexle_puzzles")
    .select("puzzle_date")
    .lte("puzzle_date", today)
    .order("puzzle_date", { ascending: false });

  if (error || !data) return [];
  return data as { puzzle_date: string }[];
}

/** Fetch a hexle puzzle by specific date (for archive). */
export async function getHexlePuzzleByDate(
  date: string
): Promise<string | null> {
  return getHexlePuzzle(date);
}
