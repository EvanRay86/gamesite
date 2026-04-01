import Link from "next/link";
import WordBloomGame from "@/components/WordBloomGame";
import MoreDailyGames from "@/components/MoreDailyGames";
import {
  getWordBloomPuzzleByDate,
  getTodayDate,
  getFallbackWordBloomPuzzle,
} from "@/lib/word-bloom-puzzles";

export const revalidate = 60;

export const metadata = {
  title: "Word Bloom — Gamesite",
  description:
    "Make words from 7 letters, always using the center. A new bloom every day.",
};

export default async function WordBloomPage() {
  const today = getTodayDate();

  let puzzle = await getWordBloomPuzzleByDate(today);

  if (!puzzle) {
    puzzle = getFallbackWordBloomPuzzle(today);
  }

  return (
    <main>
      <WordBloomGame puzzle={puzzle} />
      <div className="flex justify-center py-6">
        <Link
          href="/daily/word-bloom/archive"
          className="text-text-muted text-sm hover:text-green transition-colors no-underline"
        >
          Play past puzzles &rarr;
        </Link>
      </div>
      <MoreDailyGames currentSlug="word-bloom" />
    </main>
  );
}
