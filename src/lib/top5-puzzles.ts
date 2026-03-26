import { getSupabase } from "./supabase";
import type { Top5Puzzle, Top5Item } from "@/types/top5";

export function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

export async function getTop5PuzzleByDate(
  date: string
): Promise<Top5Puzzle | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("top5_puzzles")
    .select("*")
    .eq("puzzle_date", date)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    puzzle_date: data.puzzle_date,
    category: data.category,
    items: data.items,
    unit: data.unit ?? undefined,
  };
}

export async function getTop5ArchiveDates(): Promise<
  { puzzle_date: string }[]
> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("top5_puzzles")
    .select("puzzle_date")
    .lte("puzzle_date", getTodayDate())
    .order("puzzle_date", { ascending: false });

  if (error || !data) return [];
  return data;
}

export function getFallbackTop5Puzzle(date: string): Top5Puzzle {
  const epoch = new Date("2024-01-01").getTime();
  const target = new Date(date).getTime();
  const daysSinceEpoch = Math.floor((target - epoch) / (1000 * 60 * 60 * 24));
  const index = Math.abs(daysSinceEpoch) % TOP5_SEED_PUZZLES.length;

  return {
    id: `fallback-top5-${date}`,
    puzzle_date: date,
    ...TOP5_SEED_PUZZLES[index],
  };
}

// ── Seed data ──────────────────────────────────────────────────────────

interface SeedPuzzle {
  category: string;
  items: Top5Item[];
  unit?: string;
}

const TOP5_SEED_PUZZLES: SeedPuzzle[] = [
  {
    category: "Most populated U.S. states",
    unit: "million",
    items: [
      { name: "California", value: "39.0M" },
      { name: "Texas", value: "30.5M" },
      { name: "Florida", value: "22.6M" },
      { name: "New York", value: "19.6M" },
      { name: "Pennsylvania", value: "12.9M" },
    ],
  },
  {
    category: "Fastest land animals",
    unit: "mph",
    items: [
      { name: "Cheetah", value: "70 mph" },
      { name: "Pronghorn", value: "55 mph" },
      { name: "Springbok", value: "55 mph" },
      { name: "Wildebeest", value: "50 mph" },
      { name: "Lion", value: "50 mph" },
    ],
  },
  {
    category: "Largest planets in our solar system",
    items: [
      { name: "Jupiter", value: "86,881 mi" },
      { name: "Saturn", value: "36,184 mi" },
      { name: "Uranus", value: "15,759 mi" },
      { name: "Neptune", value: "15,299 mi" },
      { name: "Earth", value: "3,959 mi" },
    ],
  },
  {
    category: "Tallest buildings in the world",
    unit: "meters",
    items: [
      { name: "Burj Khalifa", value: "828 m" },
      { name: "Merdeka 118", value: "679 m" },
      { name: "Shanghai Tower", value: "632 m" },
      { name: "Abraj Al-Bait", value: "601 m" },
      { name: "Ping An Finance Centre", value: "599 m" },
    ],
  },
  {
    category: "Countries by land area",
    items: [
      { name: "Russia", value: "17.1M km\u00B2" },
      { name: "Canada", value: "10.0M km\u00B2" },
      { name: "China", value: "9.6M km\u00B2" },
      { name: "United States", value: "9.5M km\u00B2" },
      { name: "Brazil", value: "8.5M km\u00B2" },
    ],
  },
];
