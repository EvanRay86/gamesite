import { getSupabase } from "./supabase";
import type { TimelinePuzzle, TimelineEvent } from "@/types/timeline";

export function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

export async function getTimelinePuzzleByDate(
  date: string
): Promise<TimelinePuzzle | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("timeline_puzzles")
    .select("*")
    .eq("puzzle_date", date)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    puzzle_date: data.puzzle_date,
    events: data.events,
  };
}

export async function getTimelineArchiveDates(): Promise<
  { puzzle_date: string }[]
> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("timeline_puzzles")
    .select("puzzle_date")
    .lte("puzzle_date", getTodayDate())
    .order("puzzle_date", { ascending: false });

  if (error || !data) return [];
  return data;
}

export function getFallbackTimelinePuzzle(date: string): TimelinePuzzle {
  const epoch = new Date("2024-01-01").getTime();
  const target = new Date(date).getTime();
  const daysSinceEpoch = Math.floor((target - epoch) / (1000 * 60 * 60 * 24));
  const index = Math.abs(daysSinceEpoch) % TIMELINE_SEED_PUZZLES.length;

  return {
    id: `fallback-timeline-${date}`,
    puzzle_date: date,
    events: TIMELINE_SEED_PUZZLES[index],
  };
}

// ── Seed data ──────────────────────────────────────────────────────────

const TIMELINE_SEED_PUZZLES: TimelineEvent[][] = [
  // Day 1 — Space exploration
  [
    { description: "Sputnik, the first satellite, is launched", year: 1957 },
    { description: "First humans walk on the Moon", year: 1969 },
    { description: "First Space Shuttle mission launches", year: 1981 },
    { description: "International Space Station receives first crew", year: 2000 },
    { description: "SpaceX sends first crew to the ISS", year: 2020 },
  ],
  // Day 2 — Blockbuster movies
  [
    { description: "Star Wars: A New Hope premieres", year: 1977 },
    { description: "E.T. the Extra-Terrestrial is released", year: 1982 },
    { description: "Jurassic Park opens in theaters", year: 1993 },
    { description: "Harry Potter and the Sorcerer's Stone debuts", year: 2001 },
    { description: "Avatar becomes the highest-grossing film", year: 2009 },
  ],
  // Day 3 — World-changing inventions
  [
    { description: "Alexander Graham Bell patents the telephone", year: 1876 },
    { description: "Guglielmo Marconi demonstrates radio transmission", year: 1895 },
    { description: "First electronic television is demonstrated", year: 1927 },
    { description: "ARPANET (precursor to the Internet) goes online", year: 1969 },
    { description: "The first iPhone is released", year: 2007 },
  ],
  // Day 4 — U.S. milestones
  [
    { description: "Declaration of Independence is signed", year: 1776 },
    { description: "The Civil War ends at Appomattox", year: 1865 },
    { description: "19th Amendment grants women the right to vote", year: 1920 },
    { description: "Civil Rights Act is signed into law", year: 1964 },
    { description: "Barack Obama is elected President", year: 2008 },
  ],
  // Day 5 — Music milestones
  [
    { description: "Elvis Presley records his first single", year: 1953 },
    { description: "Woodstock music festival takes place", year: 1969 },
    { description: "MTV launches with its first music video", year: 1981 },
    { description: "Napster launches peer-to-peer music sharing", year: 1999 },
    { description: "Spotify launches its streaming service", year: 2008 },
  ],
];
