import { getSupabase } from "./supabase";
import type { EmojiWordPuzzle, EmojiWordRound } from "@/types/emoji-word";

export function getTodayDate(): string {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

export async function getEmojiWordPuzzleByDate(
  date: string
): Promise<EmojiWordPuzzle | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("emoji_word_puzzles")
    .select("*")
    .eq("puzzle_date", date)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    puzzle_date: data.puzzle_date,
    rounds: data.rounds,
  };
}

export async function getEmojiWordArchiveDates(): Promise<
  { puzzle_date: string }[]
> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("emoji_word_puzzles")
    .select("puzzle_date")
    .lte("puzzle_date", getTodayDate())
    .order("puzzle_date", { ascending: false });

  if (error || !data) return [];
  return data;
}

export function getFallbackEmojiWordPuzzle(date: string): EmojiWordPuzzle {
  const epoch = new Date("2024-01-01").getTime();
  const target = new Date(date).getTime();
  const daysSinceEpoch = Math.floor((target - epoch) / (1000 * 60 * 60 * 24));
  const index = Math.abs(daysSinceEpoch) % EMOJI_WORD_SEED_PUZZLES.length;

  return {
    id: `fallback-emoji-word-${date}`,
    puzzle_date: date,
    rounds: EMOJI_WORD_SEED_PUZZLES[index],
  };
}

// ── Seed data (10 days of puzzles, 5 rounds each, progressive difficulty) ──

const EMOJI_WORD_SEED_PUZZLES: EmojiWordRound[][] = [
  // Day 1
  [
    { emojis: "🌞🌻", answer: "SUNFLOWER", difficulty: 1 },
    { emojis: "🏠🔑", answer: "HOUSE KEY", hint: "What you need to get inside", difficulty: 2 },
    { emojis: "⚡🐁", answer: "PIKACHU", hint: "Gotta catch 'em all", difficulty: 3 },
    { emojis: "🧊🏔️💀", answer: "TITANIC", hint: "An unsinkable ship", difficulty: 4 },
    { emojis: "🎭🃏😈", answer: "JOKER", hint: "Why so serious?", difficulty: 5 },
  ],
  // Day 2
  [
    { emojis: "🌈🦄", answer: "UNICORN", difficulty: 1 },
    { emojis: "🍕🇮🇹", answer: "PIZZA", hint: "Born in Naples", difficulty: 2 },
    { emojis: "👑🦁", answer: "LION KING", hint: "Hakuna Matata", difficulty: 3 },
    { emojis: "🕷️🧑", answer: "SPIDER-MAN", hint: "Your friendly neighborhood…", difficulty: 4 },
    { emojis: "🧠💊🔴🔵", answer: "MATRIX", hint: "Red pill or blue pill?", difficulty: 5 },
  ],
  // Day 3
  [
    { emojis: "⭐🐟", answer: "STARFISH", difficulty: 1 },
    { emojis: "🎸🔥", answer: "ROCK AND ROLL", hint: "A genre of music", difficulty: 2 },
    { emojis: "🧙‍♂️💍", answer: "LORD OF THE RINGS", hint: "One ring to rule them all", difficulty: 3 },
    { emojis: "🎩🐇✨", answer: "MAGIC TRICK", hint: "Now you see it, now you don't", difficulty: 4 },
    { emojis: "🦇🌃🔦", answer: "BATMAN", hint: "The dark knight", difficulty: 5 },
  ],
  // Day 4
  [
    { emojis: "🐶🦴", answer: "DOG BONE", difficulty: 1 },
    { emojis: "☕🍩", answer: "BREAKFAST", hint: "The most important meal", difficulty: 2 },
    { emojis: "🚀🌕", answer: "MOON LANDING", hint: "One small step", difficulty: 3 },
    { emojis: "🎪🤡🎈", answer: "CIRCUS", hint: "The greatest show on earth", difficulty: 4 },
    { emojis: "🗡️👑❄️🐉", answer: "GAME OF THRONES", hint: "Winter is coming", difficulty: 5 },
  ],
  // Day 5
  [
    { emojis: "🔥🚒", answer: "FIRE TRUCK", difficulty: 1 },
    { emojis: "🎵👂🐛", answer: "EARWORM", hint: "A catchy song stuck in your head", difficulty: 2 },
    { emojis: "🧊❄️👸", answer: "FROZEN", hint: "Let it go", difficulty: 3 },
    { emojis: "🏴‍☠️💀🗺️", answer: "TREASURE MAP", hint: "X marks the spot", difficulty: 4 },
    { emojis: "🌀😵🐰⏰", answer: "ALICE IN WONDERLAND", hint: "Down the rabbit hole", difficulty: 5 },
  ],
  // Day 6
  [
    { emojis: "🌙⭐", answer: "MOONLIGHT", difficulty: 1 },
    { emojis: "🐸👑💋", answer: "FROG PRINCE", hint: "A fairy tale transformation", difficulty: 2 },
    { emojis: "🦈🌊😱", answer: "JAWS", hint: "You're gonna need a bigger boat", difficulty: 3 },
    { emojis: "🏰👻🎃", answer: "HAUNTED HOUSE", hint: "Enter if you dare", difficulty: 4 },
    { emojis: "⏰🔙🚗⚡", answer: "BACK TO THE FUTURE", hint: "88 miles per hour", difficulty: 5 },
  ],
  // Day 7
  [
    { emojis: "🍎📱", answer: "IPHONE", difficulty: 1 },
    { emojis: "🎤👑", answer: "QUEEN", hint: "We will rock you", difficulty: 2 },
    { emojis: "🧟‍♂️🧠🌍", answer: "ZOMBIE APOCALYPSE", hint: "The walking dead", difficulty: 3 },
    { emojis: "🕶️🥋💊", answer: "MATRIX", hint: "Follow the white rabbit", difficulty: 4 },
    { emojis: "🐋🌊📖👦", answer: "MOBY DICK", hint: "Call me Ishmael", difficulty: 5 },
  ],
  // Day 8
  [
    { emojis: "🍦🍨", answer: "ICE CREAM", difficulty: 1 },
    { emojis: "🦸‍♂️🔨⚡", answer: "THOR", hint: "God of thunder", difficulty: 2 },
    { emojis: "🎹🌙🎶", answer: "MOONLIGHT SONATA", hint: "A Beethoven classic", difficulty: 3 },
    { emojis: "🧪👨‍🔬💚💪", answer: "HULK", hint: "You wouldn't like me when I'm angry", difficulty: 4 },
    { emojis: "🏝️🏐🧔🚢", answer: "CAST AWAY", hint: "Wilson!", difficulty: 5 },
  ],
  // Day 9
  [
    { emojis: "🌊🏄", answer: "SURFING", difficulty: 1 },
    { emojis: "🐭🏰✨", answer: "DISNEY", hint: "The happiest place on earth", difficulty: 2 },
    { emojis: "👽🚲🌕", answer: "E.T.", hint: "Phone home", difficulty: 3 },
    { emojis: "🎰💰🃏🏨", answer: "LAS VEGAS", hint: "What happens here stays here", difficulty: 4 },
    { emojis: "🐒🍌🛢️👸", answer: "DONKEY KONG", hint: "A classic arcade villain", difficulty: 5 },
  ],
  // Day 10
  [
    { emojis: "⚽🥅", answer: "GOAL", difficulty: 1 },
    { emojis: "🎃👻🍬", answer: "HALLOWEEN", hint: "Trick or treat", difficulty: 2 },
    { emojis: "🧊🏠🐧", answer: "IGLOO", hint: "An Arctic shelter", difficulty: 3 },
    { emojis: "🎸🤘👅", answer: "ROLLING STONES", hint: "Paint it black", difficulty: 4 },
    { emojis: "🌹🥀🕯️👻🎭", answer: "PHANTOM OF THE OPERA", hint: "The music of the night", difficulty: 5 },
  ],
];
