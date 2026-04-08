import Link from "next/link";
import WordLadderGame from "@/components/WordLadderGame";
import MoreDailyGames from "@/components/MoreDailyGames";
import GameJsonLd from "@/components/seo/GameJsonLd";
import { getWordLadderPuzzle, getTodayDate } from "@/lib/word-ladder-puzzles";
import { buildGameMetadata } from "@/lib/seo";

export const revalidate = 60;

export const metadata = buildGameMetadata({
  title: "Play Word Ladder Online Free — Daily Word Puzzle",
  description:
    "Play Word Ladder today — change one letter at a time to transform the start word into the target. A free daily word puzzle in your browser.",
  path: "daily/word-ladder",
  color: "teal",
});

export default function WordLadderPage() {
  const today = getTodayDate();
  const puzzle = getWordLadderPuzzle(today);

  return (
    <main>
      <GameJsonLd name="Word Ladder" description="Change one letter at a time to transform the start word into the target word." path="daily/word-ladder" category="daily" />
      <WordLadderGame puzzle={puzzle} date={today} />
      <div className="flex flex-wrap justify-center gap-3 py-6">
        <Link
          href="/daily/word-ladder/archive"
          className="inline-flex items-center gap-2 rounded-full bg-teal px-6 py-3 text-sm font-semibold text-white shadow-md hover:brightness-90 hover:shadow-lg active:scale-95 transition-all no-underline"
        >
          Play past puzzles &rarr;
        </Link>
        <Link
          href="/daily/word-ladder/hints"
          className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-6 py-3 text-sm font-semibold text-zinc-600 shadow-sm hover:bg-zinc-50 hover:shadow-md active:scale-95 transition-all no-underline dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          Need a hint?
        </Link>
      </div>
      <MoreDailyGames currentSlug="word-ladder" />
    </main>
  );
}
