import { getSupabase } from "./supabase";
import type { QuotablePuzzle } from "@/types/quotable";

export function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

export async function getQuotablePuzzleByDate(
  date: string
): Promise<QuotablePuzzle | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("quotable_puzzles")
    .select("*")
    .eq("puzzle_date", date)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    puzzle_date: data.puzzle_date,
    quote: data.quote,
    attribution: data.attribution,
    hint: data.hint ?? undefined,
    options: data.options,
  };
}

export async function getQuotableArchiveDates(): Promise<
  { puzzle_date: string }[]
> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("quotable_puzzles")
    .select("puzzle_date")
    .lte("puzzle_date", getTodayDate())
    .order("puzzle_date", { ascending: false });

  if (error || !data) return [];
  return data;
}

export function getFallbackQuotablePuzzle(date: string): QuotablePuzzle {
  const epoch = new Date("2024-01-01").getTime();
  const target = new Date(date).getTime();
  const daysSinceEpoch = Math.floor((target - epoch) / (1000 * 60 * 60 * 24));
  const index = Math.abs(daysSinceEpoch) % QUOTABLE_SEED_PUZZLES.length;

  return {
    id: `fallback-quotable-${date}`,
    puzzle_date: date,
    ...QUOTABLE_SEED_PUZZLES[index],
  };
}

// ── Seed data ──────────────────────────────────────────────────────────

interface SeedPuzzle {
  quote: string;
  attribution: string;
  hint?: string;
  options: string[];
}

const QUOTABLE_SEED_PUZZLES: SeedPuzzle[] = [
  {
    quote:
      "Imagination is more important than knowledge. Knowledge is limited. Imagination encircles the world.",
    attribution: "Albert Einstein",
    hint: "Physicist",
    options: [
      "Albert Einstein",
      "Isaac Newton",
      "Nikola Tesla",
      "Stephen Hawking",
      "Richard Feynman",
      "Marie Curie",
      "Galileo Galilei",
      "Carl Sagan",
      "Neil deGrasse Tyson",
      "Thomas Edison",
    ],
  },
  {
    quote:
      "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    attribution: "Winston Churchill",
    hint: "World leader",
    options: [
      "Winston Churchill",
      "Theodore Roosevelt",
      "Abraham Lincoln",
      "Franklin D. Roosevelt",
      "John F. Kennedy",
      "Nelson Mandela",
      "Mahatma Gandhi",
      "Martin Luther King Jr.",
      "Barack Obama",
      "Charles de Gaulle",
    ],
  },
  {
    quote:
      "The secret of getting ahead is getting started. The secret of getting started is breaking your complex overwhelming tasks into small manageable tasks, and then starting on the first one.",
    attribution: "Mark Twain",
    hint: "American author",
    options: [
      "Mark Twain",
      "Ernest Hemingway",
      "F. Scott Fitzgerald",
      "Charles Dickens",
      "Oscar Wilde",
      "Ralph Waldo Emerson",
      "Henry David Thoreau",
      "Benjamin Franklin",
      "Walt Whitman",
      "Edgar Allan Poe",
    ],
  },
  {
    quote:
      "We delight in the beauty of the butterfly, but rarely admit the changes it has gone through to achieve that beauty.",
    attribution: "Maya Angelou",
    hint: "Poet and memoirist",
    options: [
      "Maya Angelou",
      "Toni Morrison",
      "Oprah Winfrey",
      "Rosa Parks",
      "Michelle Obama",
      "Alice Walker",
      "Audre Lorde",
      "Langston Hughes",
      "James Baldwin",
      "Zora Neale Hurston",
    ],
  },
  {
    quote:
      "Your time is limited, so don't waste it living someone else's life. Don't be trapped by dogma, which is living with the results of other people's thinking.",
    attribution: "Steve Jobs",
    hint: "Tech visionary",
    options: [
      "Steve Jobs",
      "Bill Gates",
      "Elon Musk",
      "Jeff Bezos",
      "Mark Zuckerberg",
      "Larry Page",
      "Tim Cook",
      "Satya Nadella",
      "Jack Dorsey",
      "Steve Wozniak",
    ],
  },
];
