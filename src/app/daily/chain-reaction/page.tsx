import Link from "next/link";
import ChainReactionGame from "@/components/ChainReactionGame";
import MoreDailyGames from "@/components/MoreDailyGames";
import GameJsonLd from "@/components/seo/GameJsonLd";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import {
  getChainReactionPuzzle,
  getTodayDate,
} from "@/lib/chain-reaction-puzzles";
import { buildGameMetadata } from "@/lib/seo";

export const revalidate = 60;

export const metadata = buildGameMetadata({
  title: "Chain Reaction",
  description:
    "Complete the word chain — each pair of neighbors forms a compound word or phrase.",
  path: "daily/chain-reaction",
});

export default function ChainReactionPage() {
  const today = getTodayDate();
  const puzzle = getChainReactionPuzzle(today);

  return (
    <main>
      <GameJsonLd name="Chain Reaction" description="Complete the word chain — each pair of neighbors forms a compound word or phrase." path="daily/chain-reaction" category="daily" />
      <Breadcrumbs crumbs={[
        { label: "Home", href: "/" },
        { label: "Daily", href: "/daily" },
        { label: "Chain Reaction" },
      ]} />
      <ChainReactionGame puzzle={puzzle} date={today} />
      <div className="flex justify-center py-6">
        <Link
          href="/daily/chain-reaction/archive"
          className="inline-flex items-center gap-2 rounded-full bg-amber px-6 py-3 text-sm font-semibold text-white shadow-md hover:brightness-90 hover:shadow-lg active:scale-95 transition-all no-underline"
        >
          Play past puzzles &rarr;
        </Link>
      </div>
      <MoreDailyGames currentSlug="chain-reaction" />
    </main>
  );
}
