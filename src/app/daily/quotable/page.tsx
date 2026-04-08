import Link from "next/link";
import QuotableGame from "@/components/QuotableGame";
import MoreDailyGames from "@/components/MoreDailyGames";
import GameJsonLd from "@/components/seo/GameJsonLd";
import {
  getQuotablePuzzleByDate,
  getTodayDate,
  getFallbackQuotablePuzzle,
} from "@/lib/quotable-puzzles";
import { buildGameMetadata } from "@/lib/seo";

export const revalidate = 60;

export const metadata = buildGameMetadata({
  title: "Play Quotable Online Free — Daily Quote Guessing Game",
  description:
    "Play Quotable today — guess who said the famous quote as words are revealed one by one. A free daily trivia game in your browser.",
  path: "daily/quotable",
  color: "purple",
});

export default async function QuotablePage() {
  const today = getTodayDate();

  let puzzle = await getQuotablePuzzleByDate(today);

  if (!puzzle) {
    puzzle = getFallbackQuotablePuzzle(today);
  }

  return (
    <main>
      <GameJsonLd name="Quotable" description="Guess who said the famous quote as words are revealed. A new challenge every day." path="daily/quotable" category="daily" />
      <QuotableGame puzzle={puzzle} />
      <div className="flex flex-wrap justify-center gap-3 py-6">
        <Link
          href="/daily/quotable/archive"
          className="inline-flex items-center gap-2 rounded-full bg-purple px-6 py-3 text-sm font-semibold text-white shadow-md hover:brightness-90 hover:shadow-lg active:scale-95 transition-all no-underline"
        >
          Play past puzzles &rarr;
        </Link>
        <Link
          href="/daily/quotable/hints"
          className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-6 py-3 text-sm font-semibold text-zinc-600 shadow-sm hover:bg-zinc-50 hover:shadow-md active:scale-95 transition-all no-underline dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          Need a hint?
        </Link>
      </div>
      <MoreDailyGames currentSlug="quotable" />
    </main>
  );
}
