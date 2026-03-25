// Game Registry — metadata for all games on the portal
// Color tokens: coral (#FF6B6B), teal (#4ECDC4), sky (#45B7D1), amber (#F7B731), purple (#A855F7), green (#22C55E)

export type GameColor = "coral" | "teal" | "sky" | "amber" | "purple" | "green";

export type GameCategory = "daily" | "arcade";

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
    slug: "wordle",
    name: "Wordle",
    description: "Six guesses to find the five-letter word.",
    category: "daily",
    color: "green",
    comingSoon: true,
  },

  {
    slug: "heardle",
    name: "Heardle",
    description: "Name the song from its opening seconds.",
    category: "daily",
    color: "purple",
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
    featured: true,
  },

  {
    slug: "daily-trivia",
    name: "8 Second Trivia",
    description: "Eight questions, eight seconds each. How far can you go?",
    category: "daily",
    color: "sky",
  },

  {
    slug: "geo-guess",
    name: "GeoGuess",
    description:
      "Guess the country from progressive hints: flag, capital, population, and fun facts.",
    category: "daily",
    color: "green",
  },

  {
    slug: "mathler",
    name: "Mathler",
    description:
      "Find the hidden math equation that equals the target number.",
    category: "daily",
    color: "purple",
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
    slug: "gem-crush",
    name: "Gem Crush",
    description: "Match gems, chain combos, and climb the leaderboard.",
    category: "arcade",
    color: "purple",
    creditCost: 5,
    comingSoon: true,
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** The featured game, if any. */
export function getFeaturedGame(): Game | undefined {
  return games.find((g) => g.featured && !g.comingSoon);
}

/** All daily-category games. */
export function getDailyGames(): Game[] {
  return games.filter((g) => g.category === "daily");
}

/** All arcade-category games. */
export function getArcadeGames(): Game[] {
  return games.filter((g) => g.category === "arcade");
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
