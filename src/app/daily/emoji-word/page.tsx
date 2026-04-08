import Link from "next/link";
import EmojiWordGame from "@/components/EmojiWordGame";
import MoreDailyGames from "@/components/MoreDailyGames";
import GameJsonLd from "@/components/seo/GameJsonLd";
import {
  getEmojiWordPuzzleByDate,
  getTodayDate,
  getFallbackEmojiWordPuzzle,
} from "@/lib/emoji-word-puzzles";
import { buildGameMetadata } from "@/lib/seo";

export const revalidate = 60;

export const metadata = buildGameMetadata({
  title: "Play Emoji Decoder Online Free — Daily Emoji Puzzle",
  description:
    "Play Emoji Decoder today — guess the word or phrase from emoji clues across five rounds. A free daily emoji guessing game in your browser.",
  path: "daily/emoji-word",
  color: "amber",
});

export default async function EmojiWordPage() {
  const today = getTodayDate();

  let puzzle = await getEmojiWordPuzzleByDate(today);

  if (!puzzle) {
    puzzle = getFallbackEmojiWordPuzzle(today);
  }

  return (
    <main>
      <GameJsonLd name="Emoji Decoder" description="Guess the word or phrase from emoji clues. Five rounds that get progressively harder. A new challenge every day." path="daily/emoji-word" category="daily" />
      <EmojiWordGame puzzle={puzzle} />
      <div className="flex flex-wrap justify-center gap-3 py-6">
        <Link
          href="/daily/emoji-word/archive"
          className="inline-flex items-center gap-2 rounded-full bg-amber px-6 py-3 text-sm font-semibold text-white shadow-md hover:brightness-90 hover:shadow-lg active:scale-95 transition-all no-underline"
        >
          Play past puzzles &rarr;
        </Link>
        <Link
          href="/daily/emoji-word/hints"
          className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-6 py-3 text-sm font-semibold text-zinc-600 shadow-sm hover:bg-zinc-50 hover:shadow-md active:scale-95 transition-all no-underline dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          Need a hint?
        </Link>
      </div>
      <MoreDailyGames currentSlug="emoji-word" />
    </main>
  );
}
