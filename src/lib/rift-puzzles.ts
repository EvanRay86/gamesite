// RIFT — Duel puzzle generation
// Wraps existing puzzle content into head-to-head duel format

import type { DuelPuzzleType, DuelPuzzleData } from "@/types/rift";

// ── Seeded RNG ───────────────────────────────────────────────────────────────

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function shuffleWithSeed<T>(arr: T[], seed: number): T[] {
  const result = [...arr];
  const rand = seededRandom(seed);
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// ── Word Blitz puzzle data ───────────────────────────────────────────────────

interface WordBlitzPayload {
  words: { word: string; scrambled: string; hint: string }[];
}

const WORD_BLITZ_POOL = [
  { word: "PLANET", hint: "Space" },
  { word: "BRIDGE", hint: "Structure" },
  { word: "CASTLE", hint: "Medieval" },
  { word: "FROZEN", hint: "Temperature" },
  { word: "GUITAR", hint: "Music" },
  { word: "ROCKET", hint: "Space" },
  { word: "JUNGLE", hint: "Nature" },
  { word: "MUSEUM", hint: "Culture" },
  { word: "SILVER", hint: "Metal" },
  { word: "GARDEN", hint: "Outdoors" },
  { word: "TROPHY", hint: "Award" },
  { word: "ANCHOR", hint: "Nautical" },
  { word: "SPIRIT", hint: "Energy" },
  { word: "CANDLE", hint: "Light" },
  { word: "PIRATE", hint: "Adventure" },
  { word: "WIZARD", hint: "Fantasy" },
  { word: "TEMPLE", hint: "Architecture" },
  { word: "DRAGON", hint: "Mythology" },
  { word: "BREEZE", hint: "Weather" },
  { word: "OYSTER", hint: "Seafood" },
  { word: "HAMMER", hint: "Tool" },
  { word: "PUZZLE", hint: "Game" },
  { word: "TUNDRA", hint: "Biome" },
  { word: "PARROT", hint: "Bird" },
  { word: "MARBLE", hint: "Material" },
  { word: "SUMMIT", hint: "Mountain" },
  { word: "FALCON", hint: "Bird" },
  { word: "RHYTHM", hint: "Music" },
  { word: "CACTUS", hint: "Plant" },
  { word: "OXYGEN", hint: "Element" },
  { word: "KERNEL", hint: "Computing" },
  { word: "COYOTE", hint: "Animal" },
  { word: "MAGNET", hint: "Physics" },
  { word: "WALNUT", hint: "Food" },
  { word: "METEOR", hint: "Space" },
  { word: "SAFARI", hint: "Travel" },
  { word: "CIPHER", hint: "Code" },
  { word: "GOBLIN", hint: "Fantasy" },
  { word: "PENCIL", hint: "Writing" },
  { word: "IGUANA", hint: "Reptile" },
];

function scrambleWord(word: string, rand: () => number): string {
  const letters = word.split("");
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]];
  }
  // Ensure it's actually scrambled
  const result = letters.join("");
  if (result === word && word.length > 1) {
    return word[word.length - 1] + word.slice(1, -1) + word[0];
  }
  return result;
}

function generateWordBlitz(seed: number): WordBlitzPayload {
  const rand = seededRandom(seed);
  const selected = shuffleWithSeed(WORD_BLITZ_POOL, seed).slice(0, 5);
  return {
    words: selected.map((w) => ({
      word: w.word,
      scrambled: scrambleWord(w.word, rand),
      hint: w.hint,
    })),
  };
}

// ── Number Crunch puzzle data ────────────────────────────────────────────────

interface NumberCrunchPayload {
  equation: string;
  target: number;
}

const NUMBER_CRUNCH_POOL: NumberCrunchPayload[] = [
  { equation: "10+5+3", target: 18 },
  { equation: "50-6-4", target: 40 },
  { equation: "15+9*3", target: 42 },
  { equation: "48/6+2", target: 10 },
  { equation: "7*8-12", target: 44 },
  { equation: "36/4+9", target: 18 },
  { equation: "5*9+13", target: 58 },
  { equation: "64/8+3", target: 11 },
  { equation: "9*7-18", target: 45 },
  { equation: "80-7*9", target: 17 },
  { equation: "6+8*11", target: 94 },
  { equation: "72/9+1", target: 9 },
  { equation: "3*4+28", target: 40 },
  { equation: "56/7+8", target: 16 },
  { equation: "99-8*6", target: 51 },
  { equation: "11*3+7", target: 40 },
  { equation: "4*7+22", target: 50 },
  { equation: "2+8*10", target: 82 },
  { equation: "90/5-6", target: 12 },
  { equation: "45-5*7", target: 10 },
];

function generateNumberCrunch(seed: number): NumberCrunchPayload {
  const idx = ((seed * 2654435761) >>> 0) % NUMBER_CRUNCH_POOL.length;
  return NUMBER_CRUNCH_POOL[idx];
}

// ── Quick Fire (trivia) puzzle data ──────────────────────────────────────────

interface QuickFireQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

interface QuickFirePayload {
  questions: QuickFireQuestion[];
}

const QUICK_FIRE_POOL: QuickFireQuestion[] = [
  { question: "What planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Saturn"], correctIndex: 1 },
  { question: "What is the largest ocean on Earth?", options: ["Atlantic", "Indian", "Pacific", "Arctic"], correctIndex: 2 },
  { question: "Who painted the Mona Lisa?", options: ["Michelangelo", "Da Vinci", "Raphael", "Donatello"], correctIndex: 1 },
  { question: "What is the chemical symbol for gold?", options: ["Go", "Gd", "Au", "Ag"], correctIndex: 2 },
  { question: "How many continents are there?", options: ["5", "6", "7", "8"], correctIndex: 2 },
  { question: "What is the capital of Japan?", options: ["Osaka", "Kyoto", "Tokyo", "Nagoya"], correctIndex: 2 },
  { question: "Which element has atomic number 1?", options: ["Helium", "Hydrogen", "Lithium", "Carbon"], correctIndex: 1 },
  { question: "What year did World War II end?", options: ["1943", "1944", "1945", "1946"], correctIndex: 2 },
  { question: "What is the tallest mountain in the world?", options: ["K2", "Kangchenjunga", "Everest", "Lhotse"], correctIndex: 2 },
  { question: "Who wrote Romeo and Juliet?", options: ["Dickens", "Shakespeare", "Austen", "Hemingway"], correctIndex: 1 },
  { question: "What is the speed of light in km/s?", options: ["200,000", "300,000", "400,000", "150,000"], correctIndex: 1 },
  { question: "What is the smallest country in the world?", options: ["Monaco", "Vatican City", "San Marino", "Liechtenstein"], correctIndex: 1 },
  { question: "How many bones are in the human body?", options: ["186", "206", "226", "256"], correctIndex: 1 },
  { question: "What gas do plants absorb?", options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Helium"], correctIndex: 2 },
  { question: "Which ocean is the Bermuda Triangle in?", options: ["Pacific", "Indian", "Atlantic", "Arctic"], correctIndex: 2 },
  { question: "What is the hardest natural substance?", options: ["Ruby", "Sapphire", "Diamond", "Emerald"], correctIndex: 2 },
  { question: "Who developed the theory of relativity?", options: ["Newton", "Einstein", "Bohr", "Hawking"], correctIndex: 1 },
  { question: "What is the largest mammal?", options: ["Elephant", "Blue Whale", "Giraffe", "Hippo"], correctIndex: 1 },
  { question: "What country has the most people?", options: ["USA", "India", "China", "Indonesia"], correctIndex: 1 },
  { question: "What is the boiling point of water in Celsius?", options: ["90", "100", "110", "120"], correctIndex: 1 },
  { question: "Who was the first person on the Moon?", options: ["Buzz Aldrin", "Neil Armstrong", "Yuri Gagarin", "John Glenn"], correctIndex: 1 },
  { question: "What is the longest river in the world?", options: ["Amazon", "Nile", "Yangtze", "Mississippi"], correctIndex: 1 },
  { question: "How many strings does a standard guitar have?", options: ["4", "5", "6", "8"], correctIndex: 2 },
  { question: "What is the currency of the UK?", options: ["Euro", "Dollar", "Pound", "Franc"], correctIndex: 2 },
  { question: "What year was the internet invented?", options: ["1969", "1975", "1983", "1991"], correctIndex: 0 },
];

function generateQuickFire(seed: number): QuickFirePayload {
  const selected = shuffleWithSeed(QUICK_FIRE_POOL, seed).slice(0, 5);
  return { questions: selected };
}

// ── Chain Link puzzle data ───────────────────────────────────────────────────

interface ChainLinkPayload {
  chain: string[];
}

const CHAIN_LINK_POOL: string[][] = [
  ["sun", "flower", "pot", "luck", "charm"],
  ["fire", "work", "out", "side", "line"],
  ["book", "mark", "down", "town", "house"],
  ["snow", "ball", "park", "way", "side"],
  ["break", "fast", "track", "suit", "case"],
  ["home", "work", "shop", "lift", "off"],
  ["water", "fall", "out", "break", "down"],
  ["day", "light", "house", "work", "force"],
  ["back", "yard", "stick", "ball", "game"],
  ["head", "band", "stand", "off", "side"],
  ["rain", "drop", "kick", "back", "stroke"],
  ["night", "fall", "back", "stage", "hand"],
  ["over", "board", "walk", "way", "side"],
  ["foot", "print", "out", "side", "kick"],
  ["cross", "word", "play", "ground", "hog"],
  ["horse", "power", "house", "cat", "nap"],
  ["blue", "bird", "house", "fly", "wheel"],
  ["black", "out", "side", "line", "up"],
  ["air", "line", "up", "side", "step"],
  ["pop", "corn", "ball", "game", "play"],
];

function generateChainLink(seed: number): ChainLinkPayload {
  const idx = ((seed * 2654435761) >>> 0) % CHAIN_LINK_POOL.length;
  return { chain: CHAIN_LINK_POOL[idx] };
}

// ── Letter Lock puzzle data ──────────────────────────────────────────────────

interface LetterLockPayload {
  word: string;
  maxGuesses: number;
}

const LETTER_LOCK_POOL = [
  "PLANET", "BRIDGE", "CASTLE", "FROZEN", "GUITAR",
  "ROCKET", "JUNGLE", "MUSEUM", "SILVER", "GARDEN",
  "TROPHY", "ANCHOR", "SPIRIT", "CANDLE", "PIRATE",
  "WIZARD", "TEMPLE", "DRAGON", "BREEZE", "OYSTER",
  "HAMMER", "PUZZLE", "TUNDRA", "PARROT", "MARBLE",
  "SUMMIT", "FALCON", "RHYTHM", "CACTUS", "OXYGEN",
  "KERNEL", "COYOTE", "MAGNET", "WALNUT", "METEOR",
  "SAFARI", "CIPHER", "GOBLIN", "PENCIL", "IGUANA",
];

function generateLetterLock(seed: number): LetterLockPayload {
  const idx = ((seed * 2654435761) >>> 0) % LETTER_LOCK_POOL.length;
  return { word: LETTER_LOCK_POOL[idx], maxGuesses: 6 };
}

// ── Rank It puzzle data ──────────────────────────────────────────────────────

interface RankItItem {
  label: string;
  value: number;
}

interface RankItPayload {
  prompt: string;
  items: RankItItem[];
}

const RANK_IT_POOL: RankItPayload[] = [
  {
    prompt: "Rank these planets by distance from the Sun (closest first)",
    items: [
      { label: "Mercury", value: 1 },
      { label: "Mars", value: 4 },
      { label: "Jupiter", value: 5 },
      { label: "Venus", value: 2 },
      { label: "Saturn", value: 6 },
    ],
  },
  {
    prompt: "Rank these countries by population (most first)",
    items: [
      { label: "India", value: 1 },
      { label: "USA", value: 3 },
      { label: "Brazil", value: 5 },
      { label: "Indonesia", value: 4 },
      { label: "China", value: 2 },
    ],
  },
  {
    prompt: "Rank these rivers by length (longest first)",
    items: [
      { label: "Nile", value: 1 },
      { label: "Yangtze", value: 3 },
      { label: "Amazon", value: 2 },
      { label: "Mississippi", value: 4 },
      { label: "Danube", value: 5 },
    ],
  },
  {
    prompt: "Rank these elements by atomic number (lowest first)",
    items: [
      { label: "Carbon", value: 6 },
      { label: "Hydrogen", value: 1 },
      { label: "Iron", value: 26 },
      { label: "Helium", value: 2 },
      { label: "Oxygen", value: 8 },
    ],
  },
  {
    prompt: "Rank these years by when the event happened (earliest first)",
    items: [
      { label: "Moon Landing", value: 1969 },
      { label: "Fall of Berlin Wall", value: 1989 },
      { label: "World Wide Web", value: 1991 },
      { label: "iPhone Launch", value: 2007 },
      { label: "Mars Rover", value: 2012 },
    ],
  },
  {
    prompt: "Rank these mountains by height (tallest first)",
    items: [
      { label: "Everest", value: 1 },
      { label: "K2", value: 2 },
      { label: "Kangchenjunga", value: 3 },
      { label: "Lhotse", value: 4 },
      { label: "Makalu", value: 5 },
    ],
  },
  {
    prompt: "Rank these oceans by size (largest first)",
    items: [
      { label: "Pacific", value: 1 },
      { label: "Atlantic", value: 2 },
      { label: "Indian", value: 3 },
      { label: "Southern", value: 4 },
      { label: "Arctic", value: 5 },
    ],
  },
  {
    prompt: "Rank these animals by average lifespan (longest first)",
    items: [
      { label: "Tortoise", value: 1 },
      { label: "Elephant", value: 2 },
      { label: "Horse", value: 3 },
      { label: "Dog", value: 4 },
      { label: "Hamster", value: 5 },
    ],
  },
];

function generateRankIt(seed: number): RankItPayload {
  const idx = ((seed * 2654435761) >>> 0) % RANK_IT_POOL.length;
  const puzzle = RANK_IT_POOL[idx];
  // Shuffle items so player needs to reorder them
  return {
    prompt: puzzle.prompt,
    items: shuffleWithSeed(puzzle.items, seed + 1),
  };
}

// ── Main puzzle generator ────────────────────────────────────────────────────

const PUZZLE_TYPES: DuelPuzzleType[] = [
  "word_blitz",
  "number_crunch",
  "quick_fire",
  "chain_link",
  "letter_lock",
  "rank_it",
];

/** Pick a random puzzle type using a seed. */
export function pickPuzzleType(seed: number): DuelPuzzleType {
  return PUZZLE_TYPES[((seed * 2654435761) >>> 0) % PUZZLE_TYPES.length];
}

/**
 * Generate a duel puzzle. Same seed = same puzzle for both players.
 */
export function generateDuelPuzzle(type: DuelPuzzleType, seed: number): DuelPuzzleData {
  let payload: Record<string, unknown>;

  switch (type) {
    case "word_blitz":
      payload = generateWordBlitz(seed) as unknown as Record<string, unknown>;
      break;
    case "number_crunch":
      payload = generateNumberCrunch(seed) as unknown as Record<string, unknown>;
      break;
    case "quick_fire":
      payload = generateQuickFire(seed) as unknown as Record<string, unknown>;
      break;
    case "chain_link":
      payload = generateChainLink(seed) as unknown as Record<string, unknown>;
      break;
    case "letter_lock":
      payload = generateLetterLock(seed) as unknown as Record<string, unknown>;
      break;
    case "rank_it":
      payload = generateRankIt(seed) as unknown as Record<string, unknown>;
      break;
  }

  return { type, seed, payload };
}

// ── Scoring ──────────────────────────────────────────────────────────────────

/**
 * Calculate duel score from accuracy and time.
 * Higher = better. Max 1000 points.
 * accuracy: 0-1, timeMs: milliseconds taken
 */
export function calculateDuelScore(accuracy: number, timeMs: number): number {
  const accuracyPoints = accuracy * 600; // 0-600
  const maxTime = 60000; // 60 seconds
  const timeBonus = Math.max(0, (1 - timeMs / maxTime)) * 400; // 0-400
  return Math.round(accuracyPoints + timeBonus);
}

/** Get human-readable puzzle type name. */
export function getPuzzleTypeName(type: DuelPuzzleType): string {
  switch (type) {
    case "word_blitz": return "Word Blitz";
    case "number_crunch": return "Number Crunch";
    case "quick_fire": return "Quick Fire";
    case "chain_link": return "Chain Link";
    case "letter_lock": return "Letter Lock";
    case "rank_it": return "Rank It";
  }
}
