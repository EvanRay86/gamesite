// Hexle — 6-letter word guessing game
// Answer words are curated for broad appeal & recognition. Valid guesses is a superset.

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

/** Extended list of valid 6-letter guesses (includes answer words + common English words). */
export const VALID_GUESSES: Set<string> = new Set([
  ...uniqueAnswers,
  // Common 6-letter English words for valid guessing
  "SCREEN", "PLAYER", "POINTS", "ENERGY", "HEALTH", "SHIELD", "ONLINE",
  "MOBILE", "BUTTON", "SEARCH", "DESIGN", "SYSTEM", "ACTION", "CHANGE",
  "BEFORE", "SCHOOL", "SHOULD", "PEOPLE", "REALLY", "THINGS", "AROUND",
  "FAMILY", "LITTLE", "FRIEND", "ALWAYS", "NUMBER", "CALLED", "BETTER",
  "ALMOST", "ENOUGH", "THOUGH", "SECOND", "OTHERS", "DURING", "MARKET",
  "SIMPLE", "ACROSS", "WITHIN", "MAKING", "STRONG", "FOLLOW", "RETURN",
  "GROUND", "LIKELY", "BEGINS", "MOTHER", "FATHER", "BROKEN", "GARDEN",
  "STREAM", "WONDER", "BRIDGE", "DINNER", "PLANET", "FLOWER", "WINTER",
  "SUMMER", "MIRROR", "SILVER", "GOLDEN", "RABBIT", "DRIVER", "PLAYED",
  "TWENTY", "THANKS", "SINGLE", "TRAVEL", "TRYING", "HAPPEN", "MOVING",
  "TOWARD", "ANIMAL", "INDEED", "FIGURE", "CHOICE", "REMAIN", "ACCEPT",
  "MINUTE", "CHANCE", "FINGER", "BROKEN", "BOTTLE", "FUTURE", "APPEAR",
  "METHOD", "RESULT", "EFFORT", "MEMBER", "BEYOND", "RATHER", "SAFETY",
  "ENTIRE", "RECORD", "BELONG", "COFFEE", "HEAVEN", "NOTICE", "ANSWER",
  "COUPLE", "LEADER", "STREET", "NATIVE", "FOREST", "DESERT", "ISLAND",
  "WEIGHT", "HEIGHT", "LENGTH", "BREATH", "GROWTH", "DANGER", "SPEECH",
  "SILENT", "GENTLE", "HIDDEN", "SACRED", "FIERCE", "CLEVER", "BITTER",
  "NARROW", "HOLLOW", "FAMOUS", "HONEST", "GATHER", "DECIDE", "INVITE",
  "ENABLE", "MANAGE", "EXPECT", "REVEAL", "IGNORE", "DEMAND", "SUPPLY",
  "CREATE", "DESIRE", "GLOBAL", "REMOVE", "PERMIT", "OPPOSE", "AFFECT",
  "BELIEF", "STRIKE", "DEFEND", "ATTACH", "DIVIDE", "OBTAIN", "INSIST",
  "ASSUME", "INTEND", "RESIST", "DERIVE", "IMPOSE", "ABSORB", "REFUSE",
  "EMERGE", "PURSUE", "EXCEED", "EXPAND", "OCCUPY", "SUBMIT", "RELATE",
  "TENNIS", "SOCCER", "BOXING", "SPORTS", "JUMBLE", "PUZZLE", "ZOMBIE",
  "SCORES", "MEDALS", "PREACH", "PICKLE", "FRIDGE", "PENCIL", "ERASER",
  "MARKER", "CRAYON", "SKETCH", "CANVAS", "THIRST", "HUNGER", "JOYFUL",
  "CLUMSY", "GRUMPY", "DRAGON", "SNIPER", "DAMAGE", "TURRET", "POTION",
  "HUNTER", "SCROLL", "ATTACK", "CANNON", "ARMOUR", "SHADOW", "UNDEAD",
  "SWORDS", "AMBUSH", "DAGGER", "COMBAT", "BOUNTY", "PATROL", "FLIGHT",
  "SPRINT", "RACING", "BATTLE", "SENTRY", "GUNNER", "BLADES", "MORTAR",
  "AVATAR", "METEOR", "PLAGUE", "RITUAL", "CHARGE", "BREACH", "VORTEX",
  "BANDIT", "WRAITH", "GOBLIN", "VANDAL", "SLAYER", "RANSOM", "FAMINE",
  "ARCANE", "BRAWLS", "VAULTS", "RUBBLE", "POUNCE", "BRUTAL", "STOKER",
  "RANCID", "PLEDGE", "ORPHAN", "MAGNET", "THORNY", "GLIDER", "SALUTE",
  "CRADLE", "BARREN", "QUENCH", "FIDGET", "SPLICE", "ABRUPT", "FLIMSY",
  "CHUNKY", "GLOOMY", "TRICKY", "WOBBLY", "SNEAKY", "SLOPPY", "CRISPY",
  "FROSTY", "FLUFFY", "WITCHY", "STORMY", "CLOUDY", "SLEEPY", "TRENDY",
]);

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

/** Check if a word is a valid guess. */
export function isValidGuess(word: string): boolean {
  return VALID_GUESSES.has(word.toUpperCase());
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
