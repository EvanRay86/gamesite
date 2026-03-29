// Framed — "Guess the movie from still frames" game data layer

export interface FramedPuzzle {
  /** ISO date string, e.g. "2026-03-24" */
  date: string;
  /** Variant slug, e.g. "all", "action", "horror" */
  variant: string;
  /** TMDB movie ID (for future API integration) */
  tmdbId?: number;
  /** The correct movie title */
  title: string;
  /** Release year */
  year: number;
  /**
   * 6 frame URLs, ordered easiest-to-hardest (most obscure first).
   * For now we use placeholder gradient URLs; later these will be
   * real screenshot URLs from a CDN or TMDB backdrops.
   */
  frames: [string, string, string, string, string, string];
}

// ---------------------------------------------------------------------------
// Seed data — hardcoded puzzles so the game is playable immediately.
// Each variant gets a rotating set keyed by date.
// ---------------------------------------------------------------------------

const seedPuzzles: FramedPuzzle[] = [
  // ── "All" variant (default) ─────────────────────────────────────────────
  {
    date: "2026-03-24",
    variant: "all",
    tmdbId: 27205,
    title: "Inception",
    year: 2010,
    frames: [
      "/framed/inception/frame-1.svg",
      "/framed/inception/frame-2.svg",
      "/framed/inception/frame-3.svg",
      "/framed/inception/frame-4.svg",
      "/framed/inception/frame-5.svg",
      "/framed/inception/frame-6.svg",
    ],
  },
  {
    date: "2026-03-25",
    variant: "all",
    tmdbId: 680,
    title: "Pulp Fiction",
    year: 1994,
    frames: [
      "/framed/pulp-fiction/frame-1.svg",
      "/framed/pulp-fiction/frame-2.svg",
      "/framed/pulp-fiction/frame-3.svg",
      "/framed/pulp-fiction/frame-4.svg",
      "/framed/pulp-fiction/frame-5.svg",
      "/framed/pulp-fiction/frame-6.svg",
    ],
  },
  {
    date: "2026-03-26",
    variant: "all",
    tmdbId: 155,
    title: "The Dark Knight",
    year: 2008,
    frames: [
      "/framed/dark-knight/frame-1.svg",
      "/framed/dark-knight/frame-2.svg",
      "/framed/dark-knight/frame-3.svg",
      "/framed/dark-knight/frame-4.svg",
      "/framed/dark-knight/frame-5.svg",
      "/framed/dark-knight/frame-6.svg",
    ],
  },

  // ── Action variant ──────────────────────────────────────────────────────
  {
    date: "2026-03-24",
    variant: "action",
    tmdbId: 603,
    title: "The Matrix",
    year: 1999,
    frames: [
      "/framed/matrix/frame-1.svg",
      "/framed/matrix/frame-2.svg",
      "/framed/matrix/frame-3.svg",
      "/framed/matrix/frame-4.svg",
      "/framed/matrix/frame-5.svg",
      "/framed/matrix/frame-6.svg",
    ],
  },

  // ── Horror variant ──────────────────────────────────────────────────────
  {
    date: "2026-03-24",
    variant: "horror",
    tmdbId: 694,
    title: "The Shining",
    year: 1980,
    frames: [
      "/framed/shining/frame-1.svg",
      "/framed/shining/frame-2.svg",
      "/framed/shining/frame-3.svg",
      "/framed/shining/frame-4.svg",
      "/framed/shining/frame-5.svg",
      "/framed/shining/frame-6.svg",
    ],
  },

  // ── 2000s variant ───────────────────────────────────────────────────────
  {
    date: "2026-03-24",
    variant: "2000s",
    tmdbId: 120,
    title: "The Lord of the Rings: The Fellowship of the Ring",
    year: 2001,
    frames: [
      "/framed/lotr/frame-1.svg",
      "/framed/lotr/frame-2.svg",
      "/framed/lotr/frame-3.svg",
      "/framed/lotr/frame-4.svg",
      "/framed/lotr/frame-5.svg",
      "/framed/lotr/frame-6.svg",
    ],
  },

  // ── Sci-Fi variant ──────────────────────────────────────────────────────
  {
    date: "2026-03-24",
    variant: "sci-fi",
    tmdbId: 348,
    title: "Alien",
    year: 1979,
    frames: [
      "/framed/alien/frame-1.svg",
      "/framed/alien/frame-2.svg",
      "/framed/alien/frame-3.svg",
      "/framed/alien/frame-4.svg",
      "/framed/alien/frame-5.svg",
      "/framed/alien/frame-6.svg",
    ],
  },
];

/**
 * A bank of popular movie titles for the autocomplete search.
 * In production this would hit TMDB's search API.
 */
export const movieBank: string[] = [
  "Inception", "The Dark Knight", "Pulp Fiction", "Fight Club",
  "The Matrix", "Interstellar", "The Shining", "Alien", "Aliens",
  "The Godfather", "The Godfather Part II", "Goodfellas",
  "Schindler's List", "Forrest Gump", "The Shawshank Redemption",
  "Titanic", "Jurassic Park", "Back to the Future",
  "Star Wars: Episode IV - A New Hope", "The Empire Strikes Back",
  "Return of the Jedi", "Raiders of the Lost Ark",
  "The Lord of the Rings: The Fellowship of the Ring",
  "The Lord of the Rings: The Two Towers",
  "The Lord of the Rings: The Return of the King",
  "Harry Potter and the Sorcerer's Stone", "The Avengers",
  "Iron Man", "Spider-Man", "Batman Begins",
  "Gladiator", "Braveheart", "The Prestige", "Memento",
  "Django Unchained", "Kill Bill: Volume 1", "Kill Bill: Volume 2",
  "No Country for Old Men", "There Will Be Blood",
  "The Social Network", "Gone Girl", "Se7en",
  "The Silence of the Lambs", "Get Out", "Us",
  "A Quiet Place", "Hereditary", "Midsommar",
  "The Exorcist", "Halloween", "Scream", "It",
  "Jaws", "E.T. the Extra-Terrestrial", "Close Encounters of the Third Kind",
  "Blade Runner", "Blade Runner 2049", "The Terminator", "Terminator 2: Judgment Day",
  "Avatar", "The Lion King", "Toy Story", "Finding Nemo",
  "Up", "WALL·E", "Inside Out", "Coco", "Ratatouille",
  "Shrek", "Spirited Away", "My Neighbor Totoro",
  "La La Land", "Whiplash", "The Grand Budapest Hotel",
  "Parasite", "Oldboy", "Amélie",
  "Mad Max: Fury Road", "John Wick", "Die Hard",
  "Top Gun", "Top Gun: Maverick", "Mission: Impossible",
  "The Departed", "Casino Royale", "Skyfall",
  "Everything Everywhere All at Once", "Dune", "Dune: Part Two",
  "Oppenheimer", "Barbie", "The Batman",
  "Milk Money",
];

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

import { getSupabase } from "./supabase";

export function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Try to fetch a framed puzzle from Supabase.
 * Returns null if Supabase is unavailable or no row found.
 */
async function getFromSupabase(
  date: string,
  variant: string,
): Promise<FramedPuzzle | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from("framed_puzzles")
      .select("*")
      .eq("puzzle_date", date)
      .eq("variant", variant)
      .single();

    if (error || !data) return null;

    return {
      date: data.puzzle_date,
      variant: data.variant,
      tmdbId: data.tmdb_id,
      title: data.title,
      year: data.year,
      frames: data.frames as [string, string, string, string, string, string],
    };
  } catch {
    return null;
  }
}

/**
 * Get the puzzle for a given date + variant.
 * Checks Supabase first, then falls back to seed data.
 */
export async function getFramedPuzzleAsync(
  date: string,
  variant: string = "all",
): Promise<FramedPuzzle> {
  // 1. Try Supabase
  const fromDb = await getFromSupabase(date, variant);
  if (fromDb) return fromDb;

  // 2. Fall back to seed data
  return getFramedPuzzle(date, variant);
}

/**
 * Get the puzzle for a given date + variant from seed data only.
 * Falls back to cycling through seed data if no exact date match.
 */
export function getFramedPuzzle(
  date: string,
  variant: string = "all",
): FramedPuzzle {
  // Try exact match first
  const exact = seedPuzzles.find(
    (p) => p.date === date && p.variant === variant,
  );
  if (exact) return exact;

  // Fall back: cycle through seed puzzles for this variant
  const variantPuzzles = seedPuzzles.filter((p) => p.variant === variant);
  if (variantPuzzles.length === 0) {
    // If variant has no puzzles, fall back to "all"
    const allPuzzles = seedPuzzles.filter((p) => p.variant === "all");
    const dayHash = dateToDayNumber(date);
    return allPuzzles[dayHash % allPuzzles.length];
  }

  const dayHash = dateToDayNumber(date);
  return variantPuzzles[dayHash % variantPuzzles.length];
}

/** Convert a date string to a deterministic day number for cycling. */
function dateToDayNumber(date: string): number {
  const d = new Date(date + "T00:00:00Z");
  return Math.floor(d.getTime() / 86_400_000);
}

export async function getFramedArchiveDates(): Promise<{ puzzle_date: string }[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("framed_puzzles")
    .select("puzzle_date")
    .eq("variant", "all")
    .lte("puzzle_date", getTodayDate())
    .order("puzzle_date", { ascending: false });

  if (error || !data) return [];
  return data;
}

/** All variant slugs that have at least one puzzle. */
export function getAvailableVariants(): string[] {
  const set = new Set(seedPuzzles.map((p) => p.variant));
  return Array.from(set);
}
