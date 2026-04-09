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

      <section className="mx-auto max-w-2xl px-4 pb-12 text-sm text-zinc-500 dark:text-zinc-400 space-y-3">
        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          What is Cluster?
        </h2>
        <p>
          Cluster is a free daily word puzzle game where you sort fifteen words
          into five groups of three based on hidden connections. Each group shares
          a secret theme — it could be anything from types of cheese to words that
          follow &quot;fire.&quot; The catch is that some words feel like they belong in
          multiple groups, so you need to find the connections that account for
          every word perfectly.
        </p>
        <p>
          If you enjoy NYT Connections, you will love Cluster. A brand-new puzzle
          is available every day on Gamesite, completely free with no account or
          download required. Play in your browser on desktop or mobile.
        </p>

        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          How to Play Cluster
        </h2>
        <ol className="list-decimal list-inside space-y-1">
          <li>Look at the fifteen words on the board.</li>
          <li>Select three words you believe share a hidden connection.</li>
          <li>Submit your guess. If correct, the group is revealed and removed.</li>
          <li>If wrong, you lose a life — you have four mistakes before the game ends.</li>
          <li>Find all five groups to win.</li>
        </ol>

        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          Tips &amp; Strategy
        </h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Start with the group you are most confident about — locking in an easy group removes distracting words.</li>
          <li>Watch out for trick words that seem to belong in multiple categories. Ask yourself which grouping accounts for all three words.</li>
          <li>Think beyond literal meanings. Groups can be based on phrases, prefixes, suffixes, or pop-culture references.</li>
          <li>If you are stuck, try working backwards — find the three words that definitely do not belong in any group you can see.</li>
          <li>Save your hardest guess for last when fewer words remain and the answer becomes clearer.</li>
        </ul>
      </section>
    </main>
  );
}
