// Word Ladder — change one letter at a time from start to end word

export interface WordLadderPuzzle {
  /** The starting word */
  start: string;
  /** The target word */
  end: string;
  /** One optimal solution path (start → end inclusive) */
  solution: string[];
}

import { isValidEnglishWord } from "./dictionary";

/** Check if a word is valid (uses comprehensive 4-letter dictionary). */
export function isValidWord(word: string): boolean {
  return isValidEnglishWord(word, 4);
}

/** Check if two words differ by exactly one letter */
export function differsByOneLetter(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diffs = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) diffs++;
    if (diffs > 1) return false;
  }
  return diffs === 1;
}

// ---------------------------------------------------------------------------
// BFS-validated puzzles — every step changes exactly 1 letter and all
// intermediate words exist in VALID_WORDS.
// ---------------------------------------------------------------------------

const SAFE_PUZZLES: WordLadderPuzzle[] = [
  { start: "cold", end: "warm", solution: ["cold", "cord", "card", "ward", "warm"] },
  { start: "head", end: "tail", solution: ["head", "heal", "hell", "hall", "hail", "tail"] },
  { start: "fast", end: "slow", solution: ["fast", "fest", "feat", "flat", "flaw", "flow", "slow"] },
  { start: "rise", end: "fall", solution: ["rise", "rile", "file", "fill", "fall"] },
  { start: "mice", end: "cats", solution: ["mice", "mite", "bite", "bits", "bats", "cats"] },
  { start: "hill", end: "vale", solution: ["hill", "hall", "hale", "vale"] },
  { start: "five", end: "four", solution: ["five", "file", "fill", "fall", "fail", "foil", "foul", "four"] },
  { start: "bell", end: "ring", solution: ["bell", "ball", "bald", "band", "bang", "rang", "ring"] },
  { start: "wine", end: "beer", solution: ["wine", "wind", "bind", "bend", "bead", "bear", "beer"] },
  { start: "hunt", end: "fish", solution: ["hunt", "hint", "mint", "mist", "fist", "fish"] },
  { start: "boot", end: "shoe", solution: ["boot", "soot", "shot", "shoe"] },
  { start: "lead", end: "gold", solution: ["lead", "head", "held", "hold", "gold"] },
  { start: "fire", end: "cool", solution: ["fire", "fore", "core", "cork", "cook", "cool"] },
  { start: "book", end: "read", solution: ["book", "boom", "room", "roam", "road", "read"] },
  { start: "warm", end: "cold", solution: ["warm", "ward", "card", "cord", "cold"] },
  { start: "meal", end: "dish", solution: ["meal", "meat", "feat", "fest", "fist", "fish", "dish"] },
  { start: "road", end: "lane", solution: ["road", "load", "lead", "lend", "land", "lane"] },
  { start: "cake", end: "cook", solution: ["cake", "care", "core", "cork", "cook"] },
  { start: "rock", end: "sand", solution: ["rock", "rack", "rank", "sank", "sand"] },
  { start: "hope", end: "wish", solution: ["hope", "hose", "rose", "rise", "wise", "wish"] },
  { start: "dark", end: "lamp", solution: ["dark", "dare", "dame", "damp", "lamp"] },
  { start: "love", end: "hate", solution: ["love", "cove", "cave", "have", "hate"] },
  { start: "work", end: "play", solution: ["work", "fork", "fort", "foot", "soot", "slot", "plot", "ploy", "play"] },
  { start: "fish", end: "bird", solution: ["fish", "fist", "mist", "mint", "mind", "bind", "bird"] },
  { start: "pork", end: "beef", solution: ["pork", "perk", "peak", "beak", "bean", "been", "beef"] },
  { start: "kite", end: "soar", solution: ["kite", "site", "sits", "sets", "seas", "sear", "soar"] },
  { start: "hide", end: "seek", solution: ["hide", "hire", "here", "herd", "heed", "seed", "seek"] },
  { start: "salt", end: "lime", solution: ["salt", "sale", "same", "lame", "lime"] },
  { start: "king", end: "rule", solution: ["king", "ring", "rung", "rune", "rule"] },
  { start: "bare", end: "cold", solution: ["bare", "bale", "bald", "bold", "cold"] },
  { start: "rich", end: "poor", solution: ["rich", "rice", "rile", "pile", "pole", "poll", "pool", "poor"] },
  { start: "wild", end: "tame", solution: ["wild", "mild", "mile", "tile", "tale", "tame"] },
  { start: "gain", end: "lose", solution: ["gain", "main", "maid", "laid", "land", "lane", "lone", "lose"] },
  { start: "tall", end: "tiny", solution: ["tall", "tale", "tile", "tine", "tiny"] },
  { start: "loud", end: "hush", solution: ["loud", "lord", "lore", "lose", "lost", "lust", "lush", "hush"] },
  { start: "east", end: "west", solution: ["east", "fast", "fest", "west"] },
  { start: "more", end: "less", solution: ["more", "lore", "lose", "loss", "less"] },
  { start: "best", end: "last", solution: ["best", "lest", "last"] },
  { start: "life", end: "dead", solution: ["life", "line", "mine", "mind", "mend", "mead", "dead"] },
  { start: "make", end: "ruin", solution: ["make", "male", "mall", "mail", "rail", "rain", "ruin"] },
  { start: "save", end: "lose", solution: ["save", "cave", "cove", "love", "lose"] },
  { start: "warm", end: "cool", solution: ["warm", "ward", "word", "wood", "wool", "cool"] },
  { start: "dull", end: "keen", solution: ["dull", "dual", "deal", "dean", "bean", "been", "keen"] },
  { start: "bulk", end: "slim", solution: ["bulk", "sulk", "sunk", "sank", "sand", "said", "slid", "slim"] },
  { start: "bear", end: "deer", solution: ["bear", "dear", "deer"] },
  { start: "mare", end: "colt", solution: ["mare", "care", "core", "cole", "colt"] },
  { start: "duck", end: "swan", solution: ["duck", "dock", "sock", "soak", "soap", "swap", "swan"] },
  { start: "soup", end: "stew", solution: ["soup", "soap", "slap", "slaw", "slew", "stew"] },
  { start: "rice", end: "corn", solution: ["rice", "race", "rare", "care", "core", "corn"] },
  { start: "meat", end: "bean", solution: ["meat", "beat", "bean"] },
  { start: "bake", end: "cook", solution: ["bake", "cake", "care", "core", "cork", "cook"] },
  { start: "milk", end: "beer", solution: ["milk", "mild", "meld", "mead", "bead", "bear", "beer"] },
  { start: "tart", end: "cake", solution: ["tart", "cart", "care", "cake"] },
  { start: "coal", end: "gold", solution: ["coal", "coat", "colt", "cold", "gold"] },
  { start: "rain", end: "snow", solution: ["rain", "raid", "said", "slid", "sled", "slew", "slow", "snow"] },
  { start: "moon", end: "star", solution: ["moon", "moan", "mean", "bean", "bear", "sear", "star"] },
  { start: "lake", end: "pond", solution: ["lake", "bake", "bane", "band", "bond", "pond"] },
  { start: "leaf", end: "stem", solution: ["leaf", "deaf", "dead", "deed", "seed", "seem", "stem"] },
  { start: "wave", end: "surf", solution: ["wave", "cave", "care", "cure", "sure", "surf"] },
  { start: "dune", end: "sand", solution: ["dune", "dane", "sane", "sand"] },
  { start: "walk", end: "runs", solution: ["walk", "talk", "tank", "rank", "rang", "rung", "runs"] },
  { start: "talk", end: "yell", solution: ["talk", "tall", "tell", "yell"] },
  { start: "kick", end: "ball", solution: ["kick", "sick", "silk", "sill", "bill", "ball"] },
  { start: "read", end: "book", solution: ["read", "bead", "beat", "boat", "boot", "book"] },
  { start: "push", end: "pull", solution: ["push", "mush", "muse", "mule", "mull", "pull"] },
  { start: "hand", end: "foot", solution: ["hand", "band", "bond", "fond", "food", "foot"] },
  { start: "hair", end: "bald", solution: ["hair", "hail", "hall", "ball", "bald"] },
  { start: "bone", end: "skin", solution: ["bone", "cone", "core", "corn", "coin", "chin", "shin", "skin"] },
  { start: "heel", end: "toes", solution: ["heel", "feel", "fuel", "duel", "dues", "does", "toes"] },
  { start: "face", end: "mask", solution: ["face", "fare", "mare", "mark", "mask"] },
  { start: "chin", end: "neck", solution: ["chin", "coin", "corn", "cork", "pork", "perk", "peck", "neck"] },
  { start: "palm", end: "fist", solution: ["palm", "pale", "male", "malt", "mast", "fast", "fist"] },
  { start: "limb", end: "bone", solution: ["limb", "lime", "line", "lone", "bone"] },
  { start: "door", end: "gate", solution: ["door", "moor", "mood", "mold", "mole", "male", "gale", "gate"] },
  { start: "wall", end: "door", solution: ["wall", "tall", "toll", "poll", "pool", "poor", "door"] },
  { start: "roof", end: "dome", solution: ["roof", "root", "soot", "sort", "sore", "some", "dome"] },
  { start: "rope", end: "cord", solution: ["rope", "cope", "core", "cord"] },
  { start: "nail", end: "bolt", solution: ["nail", "mail", "mall", "malt", "molt", "bolt"] },
  { start: "wire", end: "cord", solution: ["wire", "wore", "core", "cord"] },
  { start: "knob", end: "bolt", solution: ["knob", "snob", "slob", "slot", "soot", "boot", "bolt"] },
  { start: "town", end: "city", solution: ["town", "torn", "corn", "core", "cure", "cute", "cite", "city"] },
  { start: "home", end: "fort", solution: ["home", "come", "core", "fore", "fort"] },
  { start: "farm", end: "barn", solution: ["farm", "fare", "bare", "barn"] },
  { start: "park", end: "wood", solution: ["park", "pork", "work", "word", "wood"] },
  { start: "hall", end: "room", solution: ["hall", "ball", "bald", "bold", "bolt", "boot", "boom", "room"] },
  { start: "port", end: "dock", solution: ["port", "pork", "perk", "peck", "deck", "dock"] },
  { start: "cave", end: "mine", solution: ["cave", "cane", "mane", "mine"] },
  { start: "word", end: "poem", solution: ["word", "ford", "fort", "port", "poet", "poem"] },
  { start: "joke", end: "jest", solution: ["joke", "poke", "pose", "post", "pest", "jest"] },
  { start: "myth", end: "lore", solution: ["myth", "math", "mate", "mare", "more", "lore"] },
  { start: "fate", end: "doom", solution: ["fate", "fare", "fore", "form", "foam", "roam", "room", "doom"] },
  { start: "risk", end: "safe", solution: ["risk", "rink", "sink", "sank", "sane", "safe"] },
  { start: "debt", end: "paid", solution: ["debt", "dent", "sent", "send", "sand", "said", "paid"] },
  { start: "fear", end: "bold", solution: ["fear", "bear", "bead", "bend", "bond", "bold"] },
  { start: "rage", end: "calm", solution: ["rage", "page", "pale", "palm", "calm"] },
  { start: "zeal", end: "fire", solution: ["zeal", "heal", "head", "herd", "here", "hire", "fire"] },
  { start: "plea", end: "pray", solution: ["plea", "flea", "flew", "flaw", "claw", "clay", "play", "pray"] },
  { start: "worm", end: "bird", solution: ["worm", "form", "ford", "fond", "bond", "bind", "bird"] },
  { start: "sail", end: "dock", solution: ["sail", "said", "sand", "sank", "sack", "sock", "dock"] },
  { start: "gift", end: "give", solution: ["gift", "lift", "life", "live", "give"] },
  { start: "mold", end: "cure", solution: ["mold", "cold", "cord", "core", "cure"] },
  { start: "pest", end: "cure", solution: ["pest", "past", "cast", "cart", "care", "cure"] },
  { start: "band", end: "song", solution: ["band", "sand", "sang", "song"] },
  { start: "film", end: "reel", solution: ["film", "fill", "fell", "feel", "reel"] },
  { start: "fort", end: "wall", solution: ["fort", "font", "wont", "want", "wait", "wail", "wall"] },
  { start: "ship", end: "dock", solution: ["ship", "snip", "snap", "soap", "soak", "sock", "dock"] },
  { start: "poll", end: "vote", solution: ["poll", "pole", "role", "rote", "vote"] },
  { start: "dime", end: "coin", solution: ["dime", "dome", "come", "core", "corn", "coin"] },
  { start: "plow", end: "farm", solution: ["plow", "slow", "slot", "soot", "foot", "fort", "form", "farm"] },
  { start: "haze", end: "mist", solution: ["haze", "maze", "male", "malt", "mast", "mist"] },
  { start: "foam", end: "wave", solution: ["foam", "form", "fore", "wore", "wove", "wave"] },
  { start: "burn", end: "cool", solution: ["burn", "born", "corn", "coin", "coil", "cool"] },
  { start: "melt", end: "cold", solution: ["melt", "molt", "colt", "cold"] },
  { start: "sore", end: "heal", solution: ["sore", "lore", "lord", "load", "lead", "head", "heal"] },
  { start: "lost", end: "find", solution: ["lost", "most", "mist", "mint", "mind", "find"] },
  { start: "slam", end: "door", solution: ["slam", "seam", "sear", "soar", "sour", "pour", "poor", "door"] },
  { start: "sail", end: "wind", solution: ["sail", "said", "sand", "wand", "wind"] },
  { start: "tide", end: "wave", solution: ["tide", "wide", "wade", "wave"] },
  { start: "robe", end: "vest", solution: ["robe", "rose", "lose", "lost", "lest", "vest"] },
  { start: "lark", end: "song", solution: ["lark", "bark", "bank", "bang", "sang", "song"] },
  { start: "cord", end: "rope", solution: ["cord", "core", "cope", "rope"] },
  { start: "mane", end: "hair", solution: ["mane", "male", "hale", "hall", "hail", "hair"] },
  { start: "nest", end: "bird", solution: ["nest", "best", "bent", "bend", "bind", "bird"] },
  { start: "coal", end: "fire", solution: ["coal", "coil", "coin", "corn", "core", "fore", "fire"] },
  { start: "lure", end: "hook", solution: ["lure", "cure", "core", "cork", "cook", "hook"] },
  { start: "pawn", end: "king", solution: ["pawn", "pain", "paid", "said", "sand", "sang", "sing", "king"] },
  { start: "sage", end: "wise", solution: ["sage", "wage", "wade", "wide", "wise"] },
  { start: "duke", end: "earl", solution: ["duke", "dune", "dane", "dare", "darn", "earn", "earl"] },
  { start: "gust", end: "wind", solution: ["gust", "must", "mist", "mint", "mind", "wind"] },
  { start: "tomb", end: "dead", solution: ["tomb", "tome", "home", "hole", "hold", "held", "head", "dead"] },
  { start: "cure", end: "heal", solution: ["cure", "curl", "hurl", "hull", "hell", "heal"] },
  { start: "muse", end: "poem", solution: ["muse", "must", "most", "post", "poet", "poem"] },
  { start: "rune", end: "code", solution: ["rune", "rude", "rode", "code"] },
  { start: "myth", end: "tale", solution: ["myth", "math", "mate", "male", "tale"] },
  { start: "yarn", end: "tale", solution: ["yarn", "barn", "bare", "bale", "tale"] },
  { start: "moat", end: "fort", solution: ["moat", "boat", "boot", "foot", "fort"] },
  { start: "oath", end: "bond", solution: ["oath", "math", "mate", "mane", "bane", "band", "bond"] },
  { start: "gold", end: "mine", solution: ["gold", "mold", "mild", "mind", "mine"] },
  { start: "calm", end: "rage", solution: ["calm", "palm", "pale", "page", "rage"] },
  { start: "dirt", end: "soil", solution: ["dirt", "dart", "wart", "wait", "wail", "sail", "soil"] },
  { start: "sled", end: "snow", solution: ["sled", "slew", "slow", "snow"] },
  { start: "math", end: "test", solution: ["math", "bath", "bats", "bass", "lass", "last", "lest", "test"] },
  { start: "cash", end: "gold", solution: ["cash", "cast", "cost", "colt", "cold", "gold"] },
  { start: "hurt", end: "heal", solution: ["hurt", "hurl", "hull", "hell", "heal"] },
  { start: "warm", end: "fire", solution: ["warm", "farm", "fare", "fire"] },
  { start: "cool", end: "wind", solution: ["cool", "fool", "food", "fond", "find", "wind"] },
  { start: "silk", end: "lace", solution: ["silk", "sick", "lick", "lack", "lace"] },
  { start: "spin", end: "turn", solution: ["spin", "shin", "chin", "coin", "corn", "torn", "turn"] },
  { start: "mask", end: "face", solution: ["mask", "mark", "mare", "fare", "face"] },
  { start: "song", end: "tune", solution: ["song", "long", "lone", "tone", "tune"] },
  { start: "fool", end: "sage", solution: ["fool", "pool", "poll", "pole", "sole", "sale", "sage"] },
  { start: "cork", end: "wine", solution: ["cork", "core", "wore", "wire", "wine"] },
  { start: "gate", end: "door", solution: ["gate", "mate", "male", "mole", "mold", "mood", "moor", "door"] },
  { start: "bolt", end: "lock", solution: ["bolt", "boot", "book", "look", "lock"] },
  { start: "rake", end: "leaf", solution: ["rake", "lake", "lane", "land", "lend", "lead", "leaf"] },
  { start: "wand", end: "wave", solution: ["wand", "sand", "sane", "save", "wave"] },
  { start: "peel", end: "rind", solution: ["peel", "reel", "reed", "rend", "rind"] },
  { start: "bean", end: "soup", solution: ["bean", "bear", "sear", "soar", "soap", "soup"] },
  { start: "bait", end: "hook", solution: ["bait", "wait", "wail", "tail", "toil", "tool", "took", "hook"] },
  { start: "comb", end: "hair", solution: ["comb", "come", "cole", "hole", "hale", "hall", "hail", "hair"] },
  { start: "foam", end: "beer", solution: ["foam", "roam", "roar", "rear", "bear", "beer"] },
  { start: "desk", end: "work", solution: ["desk", "deck", "peck", "perk", "pork", "work"] },
  { start: "bone", end: "meal", solution: ["bone", "bond", "bend", "bead", "mead", "meal"] },
  { start: "cape", end: "hero", solution: ["cape", "care", "hare", "here", "hero"] },
  { start: "dice", end: "game", solution: ["dice", "dace", "dame", "game"] },
  { start: "fuse", end: "bomb", solution: ["fuse", "fume", "fame", "came", "come", "comb", "bomb"] },
  { start: "gale", end: "wind", solution: ["gale", "bale", "bane", "band", "wand", "wind"] },
  { start: "herd", end: "farm", solution: ["herd", "here", "hare", "fare", "farm"] },
  { start: "mint", end: "coin", solution: ["mint", "mind", "find", "fond", "ford", "cord", "corn", "coin"] },
  { start: "pave", end: "road", solution: ["pave", "pare", "pore", "lore", "lord", "load", "road"] },
  { start: "torn", end: "mend", solution: ["torn", "born", "bore", "bone", "bond", "bend", "mend"] },
  { start: "warp", end: "bend", solution: ["warp", "ward", "wand", "band", "bend"] },
  { start: "dome", end: "roof", solution: ["dome", "some", "sore", "sort", "soot", "root", "roof"] },
  { start: "flag", end: "pole", solution: ["flag", "flat", "feat", "meat", "moat", "molt", "mole", "pole"] },
  { start: "jade", end: "gold", solution: ["jade", "made", "mode", "mole", "mold", "gold"] },
  { start: "mast", end: "sail", solution: ["mast", "malt", "mall", "mail", "sail"] },
  { start: "stew", end: "soup", solution: ["stew", "slew", "slaw", "slap", "soap", "soup"] },
  { start: "tusk", end: "bone", solution: ["tusk", "task", "tank", "bank", "bane", "bone"] },
  { start: "wilt", end: "fade", solution: ["wilt", "hilt", "halt", "hale", "male", "made", "fade"] },
  { start: "yoke", end: "bond", solution: ["yoke", "poke", "pore", "bore", "bone", "bond"] },
  { start: "zoom", end: "fast", solution: ["zoom", "boom", "boot", "boat", "beat", "feat", "fest", "fast"] },
  { start: "dark", end: "dawn", solution: ["dark", "darn", "dawn"] },
  { start: "cold", end: "heat", solution: ["cold", "hold", "held", "head", "heat"] },
  { start: "come", end: "gone", solution: ["come", "cone", "gone"] },
  { start: "stay", end: "left", solution: ["stay", "slay", "slat", "flat", "feat", "fest", "lest", "left"] },
  { start: "meal", end: "cook", solution: ["meal", "peal", "peak", "perk", "pork", "cork", "cook"] },
  { start: "flow", end: "drip", solution: ["flow", "plow", "prow", "prop", "drop", "drip"] },
  { start: "ruin", end: "mend", solution: ["ruin", "rain", "raid", "laid", "land", "lend", "mend"] },
  { start: "sink", end: "swim", solution: ["sink", "sank", "sand", "said", "slid", "slim", "swim"] },
  { start: "lean", end: "bulk", solution: ["lean", "bean", "beat", "belt", "bell", "bull", "bulk"] },
  { start: "fake", end: "real", solution: ["fake", "take", "tale", "tall", "tell", "teal", "real"] },
  { start: "take", end: "give", solution: ["take", "cake", "cave", "gave", "give"] },
  { start: "send", end: "mail", solution: ["send", "sand", "said", "maid", "mail"] },
  { start: "seed", end: "grow", solution: ["seed", "sled", "slew", "slow", "glow", "grow"] },
  { start: "note", end: "song", solution: ["note", "none", "lone", "long", "song"] },
  { start: "pack", end: "load", solution: ["pack", "lack", "lark", "lard", "lord", "load"] },
  { start: "harm", end: "heal", solution: ["harm", "hare", "hale", "hall", "hell", "heal"] },
  { start: "dust", end: "mite", solution: ["dust", "must", "muse", "mute", "mite"] },
  { start: "code", end: "hack", solution: ["code", "rode", "ride", "rice", "race", "rack", "hack"] },
  { start: "page", end: "book", solution: ["page", "cage", "care", "core", "cork", "cook", "book"] },
  { start: "test", end: "pass", solution: ["test", "pest", "past", "pass"] },
];

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

export function getWordLadderPuzzle(date: string): WordLadderPuzzle {
  const day = dateToDayNumber(date);
  const hash = ((day * 2654435761) >>> 0) % SAFE_PUZZLES.length;
  return SAFE_PUZZLES[hash];
}

/** Return the number of seed puzzles available (used for archive generation) */
export function getSeedPuzzleCount(): number {
  return SAFE_PUZZLES.length;
}

// ---------------------------------------------------------------------------
// Supabase queries (for archive)
// ---------------------------------------------------------------------------

import { getSupabase } from "@/lib/supabase";

export async function getWordLadderArchiveDates(): Promise<{ puzzle_date: string }[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const today = getTodayDate();
  const { data } = await supabase
    .from("word_ladder_puzzles")
    .select("puzzle_date")
    .lte("puzzle_date", today)
    .order("puzzle_date", { ascending: false });

  return data ?? [];
}

export async function getWordLadderPuzzleByDate(date: string): Promise<WordLadderPuzzle | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data } = await supabase
    .from("word_ladder_puzzles")
    .select("start_word, end_word, solution")
    .eq("puzzle_date", date)
    .single();

  if (!data) return null;
  return {
    start: data.start_word,
    end: data.end_word,
    solution: data.solution,
  };
}
