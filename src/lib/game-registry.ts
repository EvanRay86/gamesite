// Game Registry — metadata for all games on the portal
// Color tokens: coral (#FF6B6B), teal (#4ECDC4), sky (#45B7D1), amber (#F7B731), purple (#A855F7), green (#22C55E)

export type GameColor = "coral" | "teal" | "sky" | "amber" | "purple" | "green";

export type GameCategory = "daily" | "arcade" | "community" | "learn";

export interface GameVariant {
  slug: string;
  name: string;
  description: string;
  comingSoon?: boolean;
}

export interface Game {
  slug: string;
  name: string;
  description: string;
  category: GameCategory;
  color: GameColor;
  comingSoon?: boolean;
  featured?: boolean;
  /** Hidden games are excluded from all listings but routes still work. */
  hidden?: boolean;
  variants?: GameVariant[];
  /** Credits required to play (arcade games only). 0 = free. */
  creditCost?: number;
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const games: Game[] = [
  // ── Daily Games ──────────────────────────────────────────────────────────

  {
    slug: "cluster",
    name: "Cluster",
    description:
      "Find five groups of three words that share a hidden connection.",
    category: "daily",
    color: "coral",
  },

  {
    slug: "hexle",
    name: "Hexle",
    description: "Seven guesses to crack the six-letter word.",
    category: "daily",
    color: "amber",
  },

  {
    slug: "heardle",
    name: "Heardle",
    description: "Name the song from its opening seconds.",
    category: "daily",
    color: "purple",
    hidden: true,
    variants: [
      {
        slug: "pop",
        name: "Pop",
        description: "Guess the pop hit from its opening seconds.",
      },
      {
        slug: "rock",
        name: "Rock",
        description: "Guess the rock track from its opening seconds.",
      },
      {
        slug: "hip-hop",
        name: "Hip-Hop",
        description: "Guess the hip-hop track from its opening seconds.",
      },
      {
        slug: "2000s",
        name: "2000s",
        description: "Guess the 2000s hit from its opening seconds.",
      },
      {
        slug: "country",
        name: "Country",
        description: "Guess the country song from its opening seconds.",
      },
      {
        slug: "rnb",
        name: "R&B",
        description: "Guess the R&B track from its opening seconds.",
      },
    ],
  },

  {
    slug: "framed",
    name: "Framed",
    description: "Guess the movie one frame at a time.",
    category: "daily",
    color: "green",
    hidden: true,
    variants: [
      {
        slug: "action",
        name: "Action",
        description: "Guess the action movie one frame at a time.",
      },
      {
        slug: "horror",
        name: "Horror",
        description: "Guess the horror movie one frame at a time.",
      },
      {
        slug: "2000s",
        name: "2000s",
        description: "Guess the 2000s movie one frame at a time.",
      },
      {
        slug: "sci-fi",
        name: "Sci-Fi",
        description: "Guess the sci-fi movie one frame at a time.",
      },
      {
        slug: "animated",
        name: "Animated",
        description: "Guess the animated movie one frame at a time.",
        comingSoon: true,
      },
      {
        slug: "comedy",
        name: "Comedy",
        description: "Guess the comedy movie one frame at a time.",
        comingSoon: true,
      },
    ],
  },

  {
    slug: "crossword",
    name: "News Crossword",
    description:
      "A daily crossword puzzle built from today's headlines and pop culture.",
    category: "daily",
    color: "amber",
  },

  {
    slug: "daily-trivia",
    name: "8 Second Trivia",
    description: "Eight questions, eight seconds each. How far can you go?",
    category: "daily",
    color: "sky",
  },

  {
    slug: "mathler",
    name: "Mathler",
    description:
      "Find the hidden math equation that equals the target number.",
    category: "learn",
    color: "purple",
  },

  {
    slug: "word-ladder",
    name: "Word Ladder",
    description:
      "Change one letter at a time to transform the start word into the target word.",
    category: "daily",
    color: "teal",
  },

  {
    slug: "anagram",
    name: "Anagram Scramble",
    description:
      "Unscramble five jumbled words before the clock runs out.",
    category: "daily",
    color: "teal",
  },

  {
    slug: "quotable",
    name: "Quotable",
    description:
      "Guess who said the famous quote as words are progressively revealed.",
    category: "learn",
    color: "purple",
  },

  {
    slug: "timeline",
    name: "Timeline",
    description:
      "Put five historical events in chronological order. Three attempts to get it right.",
    category: "learn",
    color: "teal",
  },

  {
    slug: "chain-reaction",
    name: "Chain Reaction",
    description:
      "Complete the word chain — each pair forms a compound word or phrase.",
    category: "daily",
    color: "coral",
  },

  {
    slug: "wordsmith",
    name: "Wordsmith",
    description:
      "Forge words through five rounds, collect power-ups, and chase the daily high score.",
    category: "daily",
    color: "amber",
  },

  {
    slug: "word-bloom",
    name: "Word Bloom",
    description:
      "Build words from seven letters — every word must use the center. How many can you find?",
    category: "daily",
    color: "green",
  },

  {
    slug: "vocab-vault",
    name: "Vocab Vault",
    description:
      "Guess vocabulary words from their definitions and example sentences.",
    category: "daily",
    color: "purple",
  },

  {
    slug: "root-words",
    name: "Root Words",
    description:
      "Find English words built from a Latin or Greek root before time runs out.",
    category: "daily",
    color: "teal",
  },

  {
    slug: "periodic-puzzle",
    name: "Periodic Puzzle",
    description:
      "Guess the chemical element from comparison clues about the periodic table.",
    category: "daily",
    color: "green",
  },

  // ── Learn Games ──────────────────────────────────────────────────────────

  {
    slug: "country-mastery",
    name: "Country Mastery",
    description:
      "Learn every country from progressive hints: outline, population, flag, capital, and fun facts.",
    category: "learn",
    color: "green",
  },

  {
    slug: "globle",
    name: "Globle",
    description:
      "Guess the mystery country on an interactive globe — color-coded clues show how close you are.",
    category: "daily",
    color: "green",
  },

  {
    slug: "emoji-word",
    name: "Emoji Decoder",
    description:
      "Guess the word or phrase from emoji clues — five rounds that get progressively harder.",
    category: "daily",
    color: "amber",
  },

  {
    slug: "top-5",
    name: "Top 5",
    description:
      "Rank five items in the correct order. How well do you know your facts?",
    category: "daily",
    color: "amber",
  },

  // ── Community Games ──────────────────────────────────────────────────────

  {
    slug: "pixelville",
    name: "PixelVille",
    description:
      "Farm, build, chat, and hang out in a pixel-art community world.",
    category: "community",
    color: "green",
    hidden: true,
    creditCost: 0,
  },

  {
    slug: "rift",
    name: "RIFT",
    description:
      "Join a faction and conquer the hex map through real-time puzzle duels. ELO rankings, seasons, and territory wars.",
    category: "community",
    color: "coral",
    featured: true,
    hidden: true,
    creditCost: 0,
  },

  // ── Arcade Games ─────────────────────────────────────────────────────────

  {
    slug: "slime-volleyball",
    name: "Slime Volleyball",
    description: "Jump, bump, and spike your way to 7 points.",
    category: "arcade",
    color: "teal",
    creditCost: 0,
  },

  {
    slug: "koala-clicker",
    name: "Koala Clicker",
    description:
      "Click the koala, collect eucalyptus leaves, and build the ultimate koala colony.",
    category: "arcade",
    color: "green",
    creditCost: 0,
  },

  {
    slug: "snake-arena",
    name: "Snake Arena",
    description:
      "Eat, grow, and devour other players in this multiplayer snake battle.",
    category: "arcade",
    color: "green",
    creditCost: 0,
  },

  {
    slug: "2048",
    name: "2048",
    description:
      "Slide tiles, combine numbers, and reach the 2048 tile to win.",
    category: "arcade",
    color: "amber",
    creditCost: 0,
  },

  {
    slug: "meteor-mayhem",
    name: "Meteor Mayhem",
    description:
      "Blast meteors, grab power-ups, and chase your high score in this neon space shooter.",
    category: "arcade",
    color: "coral",
    hidden: true,
    creditCost: 3,
  },

  {
    slug: "ginormo-sword",
    name: "Big Ah Sword",
    description:
      "Slay monsters, collect gold, and grow your sword to absurd proportions in this action RPG.",
    category: "arcade",
    color: "coral",
    hidden: true,
    creditCost: 0,
  },

  {
    slug: "sky-hopper",
    name: "Sky Hopper",
    description:
      "Tap to flap, dodge the pipes, and chase your high score in this endless arcade hopper.",
    category: "arcade",
    color: "sky",
    creditCost: 0,
  },

  {
    slug: "lexicon-quest",
    name: "Lexicon Quest",
    description:
      "Spell words to slay monsters in this roguelike dungeon crawler. How deep can you go?",
    category: "arcade",
    color: "purple",
    hidden: true,
    creditCost: 0,
    featured: true,
  },

  {
    slug: "orb-merge",
    name: "Orb Merge",
    description:
      "Drop orbs, match colors, and merge your way to the top tier. Physics-based chaos.",
    category: "arcade",
    color: "purple",
    creditCost: 0,
  },

  {
    slug: "warp",
    name: "WARP",
    description:
      "Aim, launch, and slingshot through gravitational fields in this orbital puzzle game.",
    category: "arcade",
    color: "purple",
    creditCost: 0,
  },

  {
    slug: "gem-crush",
    name: "Gem Crush",
    description: "Match gems, chain combos, and climb the leaderboard.",
    category: "arcade",
    color: "purple",
    creditCost: 5,
    comingSoon: true,
  },

  {
    slug: "wave-rider",
    name: "Wave Rider",
    description: "Upload a song or paste a SoundCloud link and surf the waveform.",
    category: "arcade",
    color: "purple",
    creditCost: 0,
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** All games that should appear in listings (excludes hidden). */
const visible = (g: Game) => !g.hidden;

/** The featured game, if any. */
export function getFeaturedGame(): Game | undefined {
  return games.find((g) => g.featured && !g.comingSoon && visible(g));
}

/** All daily-category games. */
export function getDailyGames(): Game[] {
  return games.filter((g) => g.category === "daily" && visible(g));
}

/** All arcade-category games. */
export function getArcadeGames(): Game[] {
  return games.filter((g) => g.category === "arcade" && visible(g));
}

/** All community-category games. */
export function getCommunityGames(): Game[] {
  return games.filter((g) => g.category === "community" && visible(g));
}

/** All learn-category games. */
export function getLearnGames(): Game[] {
  return games.filter((g) => g.category === "learn" && visible(g));
}

/** Look up a game by its slug. Returns `undefined` if not found. */
export function getGameBySlug(slug: string): Game | undefined {
  return games.find((g) => g.slug === slug);
}

/**
 * Look up a specific variant within a game.
 * Returns `undefined` if the game or variant is not found.
 */
export function getVariant(
  gameSlug: string,
  variantSlug: string,
): GameVariant | undefined {
  const game = getGameBySlug(gameSlug);
  return game?.variants?.find((v) => v.slug === variantSlug);
}
