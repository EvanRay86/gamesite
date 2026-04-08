import Link from "next/link";
import CrosswordGame from "@/components/CrosswordGame";
import MoreDailyGames from "@/components/MoreDailyGames";
import GameJsonLd from "@/components/seo/GameJsonLd";
import { getCrosswordPuzzle } from "@/lib/crossword-puzzles";
import { buildGameMetadata } from "@/lib/seo";

export const revalidate = 60;

export const metadata = buildGameMetadata({
  title: "Play Daily Crossword Online Free — News Crossword Today",
  description:
    "Play today's crossword — a free daily crossword puzzle built from current headlines and pop culture. Solve online, no app needed.",
  path: "daily/crossword",
  color: "amber",
});

export default async function CrosswordPage() {
  const today = new Date().toISOString().slice(0, 10);
  const puzzle = await getCrosswordPuzzle(today);

  return (
    <main className="mx-auto max-w-[1100px] px-4 py-8">
      <GameJsonLd name="News Crossword" description="A daily crossword puzzle built from today's headlines and pop culture." path="daily/crossword" category="daily" />
      <CrosswordGame puzzle={puzzle} />
      <div className="flex flex-wrap justify-center gap-3 py-6">
        <Link
          href="/daily/crossword/hints"
          className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-6 py-3 text-sm font-semibold text-zinc-600 shadow-sm hover:bg-zinc-50 hover:shadow-md active:scale-95 transition-all no-underline dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          Need a hint?
        </Link>
      </div>
      <MoreDailyGames currentSlug="crossword" />
    </main>
  );
}
