import ChainReactionGame from "@/components/ChainReactionGame";
import MoreDailyGames from "@/components/MoreDailyGames";
import {
  getChainReactionPuzzle,
  getTodayDate,
} from "@/lib/chain-reaction-puzzles";
import Link from "next/link";

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
      <div className="fixed bottom-4 left-4">
        <Link
          href="/daily/chain-reaction/archive"
          className="bg-surface text-text-muted border border-border-light
                     rounded-full px-4 py-2 text-xs font-semibold
                     hover:bg-surface-hover hover:text-text-secondary transition-all
                     no-underline"
        >
          Past puzzles
        </Link>
      </div>
      <MoreDailyGames currentSlug="chain-reaction" />
    </main>
  );
}
