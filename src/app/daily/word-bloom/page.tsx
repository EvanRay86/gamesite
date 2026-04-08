import Link from "next/link";
import WordBloomGame from "@/components/WordBloomGame";
import MoreDailyGames from "@/components/MoreDailyGames";
import GameJsonLd from "@/components/seo/GameJsonLd";
import {
  getWordBloomPuzzleByDate,
  getTodayDate,
  getFallbackWordBloomPuzzle,
} from "@/lib/word-bloom-puzzles";
import { buildGameMetadata } from "@/lib/seo";

export const revalidate = 60;

export const metadata = buildGameMetadata({
  title: "Play Word Bloom Online Free — Daily Spelling Bee Game",
  description:
    "Play Word Bloom today — make words from 7 letters, always using the center letter. A free daily word game like Spelling Bee in your browser.",
  path: "daily/word-bloom",
  color: "green",
});

export default async function WordBloomPage() {
  const today = getTodayDate();

  let puzzle = await getWordBloomPuzzleByDate(today);

  if (!puzzle) {
    puzzle = getFallbackWordBloomPuzzle(today);
  }

  return (
    <main>
      <GameJsonLd name="Word Bloom" description="Make words from 7 letters, always using the center. A new bloom every day." path="daily/word-bloom" category="daily" />
      <WordBloomGame puzzle={puzzle} />
      <div className="flex flex-col items-center gap-3 py-6 px-4 w-full max-w-md mx-auto">
        <Link
          href="/daily/word-bloom/duel"
          className="w-full text-center rounded-full bg-coral text-white font-semibold py-3 px-6 text-base hover:bg-coral/90 active:scale-[0.98] transition-all no-underline shadow-sm"
        >
          Duel a friend
        </Link>
        <Link
          href="/daily/word-bloom/quickplay"
          className="w-full text-center rounded-full bg-green text-white font-semibold py-3 px-6 text-base hover:bg-green/90 active:scale-[0.98] transition-all no-underline shadow-sm"
        >
          Quickplay — unlimited random puzzles
        </Link>
        <Link
          href="/daily/word-bloom/archive"
          className="w-full text-center rounded-full border-2 border-green text-green font-semibold py-3 px-6 text-base hover:bg-green/10 active:scale-[0.98] transition-all no-underline"
        >
          Play past puzzles
        </Link>
        <Link
          href="/daily/word-bloom/hints"
          className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-6 py-3 text-sm font-semibold text-zinc-600 shadow-sm hover:bg-zinc-50 hover:shadow-md active:scale-95 transition-all no-underline dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          Need a hint?
        </Link>
      </div>
      <MoreDailyGames currentSlug="word-bloom" />
    </main>
  );
}
