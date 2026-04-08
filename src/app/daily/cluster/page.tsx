import Link from "next/link";
import ClusterGame from "@/components/ClusterGame";
import MoreDailyGames from "@/components/MoreDailyGames";
import GameJsonLd from "@/components/seo/GameJsonLd";
import { getPuzzleByDate, getTodayDate, getFallbackPuzzle } from "@/lib/puzzles";
import { buildGameMetadata } from "@/lib/seo";

export const revalidate = 60;

export const metadata = buildGameMetadata({
  title: "Play Cluster Online Free — Daily Word Connection Game",
  description:
    "Play Cluster today — find five groups of three words that share a hidden connection. A free daily word puzzle similar to NYT Connections.",
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
      <div className="flex flex-wrap justify-center gap-3 py-6">
        <Link
          href="/daily/cluster/archive"
          className="inline-flex items-center gap-2 rounded-full bg-coral px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-coral-dark hover:shadow-lg active:scale-95 transition-all no-underline"
        >
          Play past puzzles &rarr;
        </Link>
        <Link
          href="/daily/cluster/hints"
          className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-6 py-3 text-sm font-semibold text-zinc-600 shadow-sm hover:bg-zinc-50 hover:shadow-md active:scale-95 transition-all no-underline dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          Need a hint?
        </Link>
      </div>
      <MoreDailyGames currentSlug="cluster" />
    </main>
  );
}
