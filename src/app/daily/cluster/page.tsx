import Link from "next/link";
import ClusterGame from "@/components/ClusterGame";
import MoreDailyGames from "@/components/MoreDailyGames";
import GameJsonLd from "@/components/seo/GameJsonLd";
import { getPuzzleByDate, getTodayDate, getFallbackPuzzle } from "@/lib/puzzles";
import { buildGameMetadata } from "@/lib/seo";

export const revalidate = 60;

export const metadata = buildGameMetadata({
  title: "Cluster",
  description:
    "Find five groups of three words that share a hidden connection. A new puzzle every day.",
  path: "daily/cluster",
  color: "coral",
});

export default async function ClusterPage() {
  const today = getTodayDate();
  let puzzle = await getPuzzleByDate(today);

  if (!puzzle) {
    puzzle = getFallbackPuzzle(today);
  }

  return (
    <main>
      <GameJsonLd name="Cluster" description="Find five groups of three words that share a hidden connection. A new puzzle every day." path="daily/cluster" category="daily" />
      <ClusterGame puzzle={puzzle} />
      <div className="flex justify-center py-6">
        <Link
          href="/daily/cluster/archive"
          className="inline-flex items-center gap-2 rounded-full bg-coral px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-coral-dark hover:shadow-lg active:scale-95 transition-all no-underline"
        >
          Play past puzzles &rarr;
        </Link>
      </div>
      <MoreDailyGames currentSlug="cluster" />
    </main>
  );
}
