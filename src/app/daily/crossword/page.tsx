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
      <MoreDailyGames currentSlug="crossword" />
    </main>
  );
}
