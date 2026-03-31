import Link from "next/link";
import ClusterGame from "@/components/ClusterGame";
import MoreDailyGames from "@/components/MoreDailyGames";
import { getPuzzleByDate, getTodayDate, getFallbackPuzzle } from "@/lib/puzzles";

export const revalidate = 60;

export const metadata = {
  title: "Cluster",
  description:
    "Find five groups of three words that share a hidden connection. A new puzzle every day.",
};

export default async function ClusterPage() {
  const today = getTodayDate();
  let puzzle = await getPuzzleByDate(today);

  if (!puzzle) {
    puzzle = getFallbackPuzzle(today);
  }

  return (
    <main>
      <ClusterGame puzzle={puzzle} />
      <div className="flex justify-center py-6">
        <Link
          href="/daily/cluster/archive"
          className="text-text-muted text-sm hover:text-coral transition-colors no-underline"
        >
          Play past puzzles &rarr;
        </Link>
      </div>
      <MoreDailyGames currentSlug="cluster" />
    </main>
  );
}
