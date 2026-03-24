// Heardle — "Name the song from its opening seconds" game data layer

export interface HeardlePuzzle {
  /** ISO date string, e.g. "2026-03-24" */
  date: string;
  /** Variant slug, e.g. "all", "pop", "rock" */
  variant: string;
  /** The correct song title */
  title: string;
  /** The artist name */
  artist: string;
  /** Release year */
  year: number;
  /** Audio clip URL (single file, playback duration controlled by game) */
  audioUrl: string;
}

/**
 * Clip durations in seconds for each guess stage (0-indexed).
 * Each wrong guess or skip reveals a longer portion of the song.
 */
export const CLIP_DURATIONS = [1, 2, 4, 7, 11, 16];

// ---------------------------------------------------------------------------
// Seed data — hardcoded puzzles so the game is playable immediately.
// ---------------------------------------------------------------------------

const seedPuzzles: HeardlePuzzle[] = [
  // ── "All" variant (default) ─────────────────────────────────────────────
  {
    date: "2026-03-24",
    variant: "all",
    title: "Bohemian Rhapsody",
    artist: "Queen",
    year: 1975,
    audioUrl: "/heardle/bohemian-rhapsody/clip.mp3",
  },
  {
    date: "2026-03-25",
    variant: "all",
    title: "Billie Jean",
    artist: "Michael Jackson",
    year: 1982,
    audioUrl: "/heardle/billie-jean/clip.mp3",
  },
  {
    date: "2026-03-26",
    variant: "all",
    title: "Smells Like Teen Spirit",
    artist: "Nirvana",
    year: 1991,
    audioUrl: "/heardle/smells-like-teen-spirit/clip.mp3",
  },

  // ── Pop variant ───────────────────────────────────────────────────────
  {
    date: "2026-03-24",
    variant: "pop",
    title: "Blinding Lights",
    artist: "The Weeknd",
    year: 2019,
    audioUrl: "/heardle/blinding-lights/clip.mp3",
  },

  // ── Rock variant ──────────────────────────────────────────────────────
  {
    date: "2026-03-24",
    variant: "rock",
    title: "Back in Black",
    artist: "AC/DC",
    year: 1980,
    audioUrl: "/heardle/back-in-black/clip.mp3",
  },

  // ── Hip-Hop variant ───────────────────────────────────────────────────
  {
    date: "2026-03-24",
    variant: "hip-hop",
    title: "Lose Yourself",
    artist: "Eminem",
    year: 2002,
    audioUrl: "/heardle/lose-yourself/clip.mp3",
  },

  // ── 2000s variant ─────────────────────────────────────────────────────
  {
    date: "2026-03-24",
    variant: "2000s",
    title: "Mr. Brightside",
    artist: "The Killers",
    year: 2003,
    audioUrl: "/heardle/mr-brightside/clip.mp3",
  },

  // ── Country variant ───────────────────────────────────────────────────
  {
    date: "2026-03-24",
    variant: "country",
    title: "Jolene",
    artist: "Dolly Parton",
    year: 1973,
    audioUrl: "/heardle/jolene/clip.mp3",
  },

  // ── R&B variant ───────────────────────────────────────────────────────
  {
    date: "2026-03-24",
    variant: "rnb",
    title: "No Scrubs",
    artist: "TLC",
    year: 1999,
    audioUrl: "/heardle/no-scrubs/clip.mp3",
  },
];

/**
 * A bank of popular song titles for the autocomplete search.
 * Format: "Song Title – Artist"
 */
export const songBank: string[] = [
  "Bohemian Rhapsody – Queen",
  "Billie Jean – Michael Jackson",
  "Smells Like Teen Spirit – Nirvana",
  "Blinding Lights – The Weeknd",
  "Back in Black – AC/DC",
  "Lose Yourself – Eminem",
  "Mr. Brightside – The Killers",
  "Jolene – Dolly Parton",
  "No Scrubs – TLC",
  "Hotel California – Eagles",
  "Stairway to Heaven – Led Zeppelin",
  "Imagine – John Lennon",
  "Like a Rolling Stone – Bob Dylan",
  "Hey Jude – The Beatles",
  "Let It Be – The Beatles",
  "Wonderwall – Oasis",
  "Creep – Radiohead",
  "Superstition – Stevie Wonder",
  "Respect – Aretha Franklin",
  "What's Going On – Marvin Gaye",
  "Purple Rain – Prince",
  "Sweet Child O' Mine – Guns N' Roses",
  "November Rain – Guns N' Roses",
  "Under Pressure – Queen & David Bowie",
  "Don't Stop Believin' – Journey",
  "Livin' on a Prayer – Bon Jovi",
  "Africa – Toto",
  "Take On Me – a-ha",
  "Every Breath You Take – The Police",
  "Stayin' Alive – Bee Gees",
  "Dancing Queen – ABBA",
  "Thriller – Michael Jackson",
  "Beat It – Michael Jackson",
  "Smooth Criminal – Michael Jackson",
  "Bad Guy – Billie Eilish",
  "Happier Than Ever – Billie Eilish",
  "Shape of You – Ed Sheeran",
  "Thinking Out Loud – Ed Sheeran",
  "Rolling in the Deep – Adele",
  "Someone Like You – Adele",
  "Hello – Adele",
  "Uptown Funk – Mark Ronson ft. Bruno Mars",
  "Just the Way You Are – Bruno Mars",
  "Levitating – Dua Lipa",
  "Don't Start Now – Dua Lipa",
  "drivers license – Olivia Rodrigo",
  "good 4 u – Olivia Rodrigo",
  "Anti-Hero – Taylor Swift",
  "Shake It Off – Taylor Swift",
  "Cruel Summer – Taylor Swift",
  "Old Town Road – Lil Nas X",
  "HUMBLE. – Kendrick Lamar",
  "Alright – Kendrick Lamar",
  "Sicko Mode – Travis Scott",
  "God's Plan – Drake",
  "Hotline Bling – Drake",
  "In Da Club – 50 Cent",
  "Stan – Eminem",
  "Juicy – The Notorious B.I.G.",
  "California Love – 2Pac",
  "Crazy in Love – Beyoncé",
  "Halo – Beyoncé",
  "Formation – Beyoncé",
  "No Diggity – Blackstreet",
  "Waterfalls – TLC",
  "Kiss from a Rose – Seal",
  "Unbreak My Heart – Toni Braxton",
  "I Will Always Love You – Whitney Houston",
  "Before He Cheats – Carrie Underwood",
  "Need You Now – Lady A",
  "Cruise – Florida Georgia Line",
  "Body Like a Back Road – Sam Hunt",
  "Wagon Wheel – Darius Rucker",
  "Friends in Low Places – Garth Brooks",
  "Ring of Fire – Johnny Cash",
  "Humble and Kind – Tim McGraw",
  "Seven Nation Army – The White Stripes",
  "Karma Police – Radiohead",
  "Losing My Religion – R.E.M.",
  "Come as You Are – Nirvana",
  "Enter Sandman – Metallica",
  "Welcome to the Jungle – Guns N' Roses",
  "Somebody That I Used to Know – Gotye",
  "Pumped Up Kicks – Foster the People",
  "Radioactive – Imagine Dragons",
  "Royals – Lorde",
  "Get Lucky – Daft Punk",
  "One More Time – Daft Punk",
  "Toxic – Britney Spears",
  "...Baby One More Time – Britney Spears",
  "Since U Been Gone – Kelly Clarkson",
  "Complicated – Avril Lavigne",
  "Hey Ya! – Outkast",
  "Crazy – Gnarls Barkley",
  "Umbrella – Rihanna",
  "We Found Love – Rihanna",
  "Poker Face – Lady Gaga",
  "Bad Romance – Lady Gaga",
];

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

import { getSupabase } from "./supabase";

export function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Try to fetch a heardle puzzle from Supabase.
 * Returns null if Supabase is unavailable or no row found.
 */
async function getFromSupabase(
  date: string,
  variant: string,
): Promise<HeardlePuzzle | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from("heardle_puzzles")
      .select("*")
      .eq("puzzle_date", date)
      .eq("variant", variant)
      .single();

    if (error || !data) return null;

    return {
      date: data.puzzle_date,
      variant: data.variant,
      title: data.title,
      artist: data.artist,
      year: data.year,
      audioUrl: data.audio_url,
    };
  } catch {
    return null;
  }
}

/**
 * Get the puzzle for a given date + variant.
 * Checks Supabase first, then falls back to seed data.
 */
export async function getHeardlePuzzleAsync(
  date: string,
  variant: string = "all",
): Promise<HeardlePuzzle> {
  const fromDb = await getFromSupabase(date, variant);
  if (fromDb) return fromDb;

  return getHeardlePuzzle(date, variant);
}

/**
 * Get the puzzle for a given date + variant from seed data only.
 * Falls back to cycling through seed data if no exact date match.
 */
export function getHeardlePuzzle(
  date: string,
  variant: string = "all",
): HeardlePuzzle {
  // Try exact match first
  const exact = seedPuzzles.find(
    (p) => p.date === date && p.variant === variant,
  );
  if (exact) return exact;

  // Fall back: cycle through seed puzzles for this variant
  const variantPuzzles = seedPuzzles.filter((p) => p.variant === variant);
  if (variantPuzzles.length === 0) {
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

/** All variant slugs that have at least one puzzle. */
export function getAvailableVariants(): string[] {
  const set = new Set(seedPuzzles.map((p) => p.variant));
  return Array.from(set);
}
