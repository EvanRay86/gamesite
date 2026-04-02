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
  title: "Emoji Decoder",
  description:
    "Guess the word or phrase from emoji clues. Five rounds that get progressively harder. A new challenge every day.",
  path: "daily/emoji-word",
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
      <div className="flex justify-center py-6">
        <Link
          href="/daily/emoji-word/archive"
          className="inline-flex items-center gap-2 rounded-full bg-amber px-6 py-3 text-sm font-semibold text-white shadow-md hover:brightness-90 hover:shadow-lg active:scale-95 transition-all no-underline"
        >
          Play past puzzles &rarr;
        </Link>
      </div>
      <MoreDailyGames currentSlug="emoji-word" />
    </main>
  );
}
