import Link from "next/link";
import ChainReactionGame from "@/components/ChainReactionGame";
import MoreDailyGames from "@/components/MoreDailyGames";
import GameJsonLd from "@/components/seo/GameJsonLd";
import {
  getChainReactionPuzzle,
  getTodayDate,
} from "@/lib/chain-reaction-puzzles";
import { buildGameMetadata } from "@/lib/seo";

export const revalidate = 60;

export const metadata = buildGameMetadata({
  title: "Play Chain Reaction Online Free — Daily Word Chain Game",
  description:
    "Play Chain Reaction today — complete the word chain where each pair forms a compound word or phrase. A free daily word puzzle in your browser.",
  path: "daily/chain-reaction",
  color: "coral",
});

export default function ChainReactionPage() {
  const today = getTodayDate();
  const puzzle = getChainReactionPuzzle(today);

  return (
    <main>
      <GameJsonLd name="Chain Reaction" description="Complete the word chain — each pair of neighbors forms a compound word or phrase." path="daily/chain-reaction" category="daily" />
      <ChainReactionGame puzzle={puzzle} date={today} />
      <div className="flex flex-wrap justify-center gap-3 py-6">
        <Link
          href="/daily/chain-reaction/archive"
          className="inline-flex items-center gap-2 rounded-full bg-amber px-6 py-3 text-sm font-semibold text-white shadow-md hover:brightness-90 hover:shadow-lg active:scale-95 transition-all no-underline"
        >
          Play past puzzles &rarr;
        </Link>
        <Link
          href="/daily/chain-reaction/hints"
          className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-6 py-3 text-sm font-semibold text-zinc-600 shadow-sm hover:bg-zinc-50 hover:shadow-md active:scale-95 transition-all no-underline dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          Need a hint?
        </Link>
      </div>
      <MoreDailyGames currentSlug="chain-reaction" />
    </main>
  );
}
