import Link from "next/link";
import Top5Game from "@/components/Top5Game";
import MoreDailyGames from "@/components/MoreDailyGames";
import {
  getTop5PuzzleByDate,
  getTodayDate,
  getFallbackTop5Puzzle,
} from "@/lib/top5-puzzles";

export const revalidate = 60;

export const metadata = {
  title: "Top 5 — Gamesite",
  description: "Rank five items in the correct order. A new challenge every day.",
};

export default async function Top5Page() {
  const today = getTodayDate();

  let puzzle = await getTop5PuzzleByDate(today);

  if (!puzzle) {
    puzzle = getFallbackTop5Puzzle(today);
  }

  return (
    <main>
      <Top5Game puzzle={puzzle} />
      <div className="flex justify-center py-6">
        <Link
          href="/daily/top-5/archive"
          className="inline-flex items-center gap-2 rounded-full bg-amber px-6 py-3 text-sm font-semibold text-white shadow-md hover:brightness-90 hover:shadow-lg active:scale-95 transition-all no-underline"
        >
          Play past puzzles &rarr;
        </Link>
      </div>
      <MoreDailyGames currentSlug="top-5" />
    </main>
  );
}
