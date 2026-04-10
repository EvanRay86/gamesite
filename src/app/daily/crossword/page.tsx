import Link from "next/link";
import CrosswordGame from "@/components/CrosswordGame";
import MoreDailyGames from "@/components/MoreDailyGames";
import GameJsonLd from "@/components/seo/GameJsonLd";
import { getCrosswordPuzzle } from "@/lib/crossword-puzzles";
import { buildGameMetadata } from "@/lib/seo";

export const revalidate = 60;

export const metadata = buildGameMetadata({
  title: "Daily Crossword Puzzle — Free Online Crossword from Today's Headlines",
  description:
    "Solve today's free crossword puzzle built from breaking news and pop culture. New crossword every day — play online, no app needed.",
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

      <section className="mx-auto max-w-2xl px-4 pb-12 text-sm text-zinc-500 dark:text-zinc-400 space-y-3">
        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          What is the News Crossword?
        </h2>
        <p>
          The News Crossword is a free daily crossword puzzle that draws its clues
          from current headlines, trending topics, and pop culture. Unlike
          traditional crosswords that rely on decades-old trivia, this puzzle
          rewards you for staying up to date with the world around you. A new
          crossword is published every day on Gamesite.
        </p>
        <p>
          Play online for free in your browser — no app, no account, no paywall.
          Whether you are a crossword veteran or trying your first grid, the News
          Crossword is designed to be approachable yet satisfying.
        </p>

        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          How to Play
        </h2>
        <ol className="list-decimal list-inside space-y-1">
          <li>Click or tap a clue to highlight the corresponding row or column in the grid.</li>
          <li>Type your answer letter by letter. The cursor advances automatically.</li>
          <li>Press Enter to check your current word — green means correct, red means try again.</li>
          <li>Switch between Across and Down clues by clicking the active cell again or pressing the arrow keys.</li>
          <li>Fill every cell in the grid to complete the puzzle.</li>
        </ol>

        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          Tips &amp; Strategy
        </h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Start with the clues you know for sure — filling in confirmed letters helps solve intersecting words.</li>
          <li>Short words (3-4 letters) are often the easiest entry points into the grid.</li>
          <li>If a clue ends with a question mark, expect a pun or wordplay rather than a straight definition.</li>
          <li>Stuck on a clue? Skip it and come back after you have more crossing letters filled in.</li>
          <li>Pay attention to the puzzle title and subtitle — they often hint at the overall theme.</li>
        </ul>
      </section>
    </main>
  );
}
