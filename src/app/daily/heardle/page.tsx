import Link from "next/link";
import HeardleGame from "@/components/HeardleGame";
import MoreDailyGames from "@/components/MoreDailyGames";
import { getHeardlePuzzleAsync, getTodayDate } from "@/lib/heardle-puzzles";

export const revalidate = 60;

export const metadata = {
  title: "Heardle — Gamesite",
  description: "Name the song from its opening seconds. 6 clips, 6 guesses.",
};

export default async function HeardlePage() {
  const today = getTodayDate();
  const puzzle = await getHeardlePuzzleAsync(today, "all");

  return (
    <main>
      <HeardleGame puzzle={puzzle} variant="all" />
      <div className="flex justify-center py-6">
        <Link
          href="/daily/heardle/archive"
          className="inline-flex items-center gap-2 rounded-full bg-coral px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-coral-dark hover:shadow-lg active:scale-95 transition-all no-underline"
        >
          Play past puzzles &rarr;
        </Link>
      </div>
      <MoreDailyGames currentSlug="heardle" />
    </main>
  );
}
