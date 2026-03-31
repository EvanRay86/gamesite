import Link from "next/link";
import EmojiWordGame from "@/components/EmojiWordGame";
import MoreDailyGames from "@/components/MoreDailyGames";
import {
  getEmojiWordPuzzleByDate,
  getTodayDate,
  getFallbackEmojiWordPuzzle,
} from "@/lib/emoji-word-puzzles";

export const revalidate = 60;

export const metadata = {
  title: "Emoji Decoder — Gamesite",
  description:
    "Guess the word or phrase from emoji clues. Five rounds that get progressively harder. A new challenge every day.",
};

export default async function EmojiWordPage() {
  const today = getTodayDate();

  let puzzle = await getEmojiWordPuzzleByDate(today);

  if (!puzzle) {
    puzzle = getFallbackEmojiWordPuzzle(today);
  }

  return (
    <main>
      <EmojiWordGame puzzle={puzzle} />
      <div className="flex justify-center py-6">
        <Link
          href="/daily/emoji-word/archive"
          className="text-text-muted text-sm hover:text-amber transition-colors no-underline"
        >
          Play past puzzles &rarr;
        </Link>
      </div>
      <MoreDailyGames currentSlug="emoji-word" />
    </main>
  );
}
