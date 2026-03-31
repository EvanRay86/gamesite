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
      <MoreDailyGames currentSlug="chain-reaction" />
    </main>
  );
}
