// Hexle — 6-letter gaming-themed word game
// Answer words are curated for fun & recognition. Valid guesses is a superset.

/** Words that can be chosen as the daily answer (all gaming-themed, 6 letters). */
export const ANSWER_WORDS: string[] = [
  "SHIELD", "DRAGON", "PORTAL", "SNIPER", "TROPHY", "HEALER", "KNIGHT",
  "PIRATE", "ZOMBIE", "WIZARD", "ARCHER", "RAIDER", "DAMAGE", "TURRET",
  "MUZZLE", "POTION", "HUNTER", "GOLEM", "SCROLL", "LANCER", "ROGUE",
  "CLERIC", "WARDEN", "TEMPLE", "CASTLE", "THRONE", "SUMMON", "ATTACK",
  "STRIKE", "STEEDS", "CANNON", "BOSSES", "ARMOUR", "MYSTIC", "SHADOW",
  "UNDEAD", "SWORDS", "QUESTS", "AMBUSH", "DAGGER", "COMBAT", "BOUNTY",
  "PATROL", "GLADIO", "FLIGHT", "FRENZY", "LAUNCH", "SPRINT", "TURBO",
  "SPRINT", "RACING", "RESCUE", "JETSKI", "BATTLE", "DUELER", "ROGUES",
  "SENTRY", "SHIELD", "GUNNER", "BLADES", "MORTAR", "WOLVES", "FALCON",
  "VOODOO", "HAMMER", "SCARAB", "FIENDS", "AVATAR", "MIRAGE", "METEOR",
  "PLAGUE", "INVOKE", "PARLEY", "RITUAL", "CHARGE", "BREACH", "FABLED",
  "LEGEND", "FORGED", "NIMBLE", "EMBLEM", "VORTEX", "CASTER", "RUNE",
  "RELICS", "BANDIT", "CHOSEN", "ENIGMA", "WRAITH", "GAZING", "HARBOR",
  "STANCE", "SPIRIT", "MENACE", "TORQUE", "WYVERN", "RANKED", "GLYPH",
  "HYBRID", "ORACLE", "TROPHY", "SUMMIT", "BLITZ", "VALIANT", "GOBLIN",
  "VANDAL", "FUSION", "FROZEN", "NECTAR", "MASTER", "SLAYER", "GRAVEL",
  "STOKER", "RANSOM", "FAMINE", "DUSTED", "CIPHER", "ARCANE", "CLUTCH",
  "BRAWLS", "FLAWED", "GROTTO", "THWART", "VAULTS", "RUBBLE", "KINDLY",
  "POUNCE", "FERVOR", "ZEPHYR", "GILDED", "BEACON", "SIPHON", "PRIMAL",
  "BRUTAL", "MOLTEN", "ONSLAUGHT",
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
  "TENNIS", "SOCCER", "BOXING", "RODEO", "SPORTS", "JUMBLE", "PUZZLE",
  "RUBIKS", "SCORES", "MEDALS", "PREACH", "PICKLE", "FRIDGE", "ZOMBIE",
  "PENCIL", "ERASER", "MARKER", "CRAYON", "SKETCH", "CANVAS", "THIRST",
  "HUNGER", "WONDER", "JOYFUL", "CLUMSY", "GRUMPY",
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
