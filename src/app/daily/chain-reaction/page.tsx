import Link from "next/link";
import ChainReactionGame from "@/components/ChainReactionGame";
import MoreDailyGames from "@/components/MoreDailyGames";
import {
  getChainReactionPuzzle,
  getTodayDate,
} from "@/lib/chain-reaction-puzzles";

export const revalidate = 60;

export const metadata = {
  title: "Chain Reaction — Gamesite",
  description:
    "Complete the word chain — each pair of neighbors forms a compound word or phrase.",
};

export default function ChainReactionPage() {
  const today = getTodayDate();
  const puzzle = getChainReactionPuzzle(today);

  return (
    <main>
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
