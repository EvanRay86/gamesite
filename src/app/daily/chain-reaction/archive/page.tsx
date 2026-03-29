import {
  getChainReactionArchiveDates,
  getTodayDate,
  getSeedPuzzleCount,
} from "@/lib/chain-reaction-puzzles";
import { isUserSubscribed } from "@/lib/check-subscription";
import ArchivePaywall from "@/components/ArchivePaywall";

export const revalidate = 3600;

export const metadata = {
  title: "Chain Reaction Archive — Gamesite",
  description: "Play past Chain Reaction puzzles.",
};

export default async function ChainReactionArchivePage() {
  let dates = await getChainReactionArchiveDates();

  if (dates.length === 0) {
    const today = new Date(getTodayDate());
    dates = Array.from({ length: getSeedPuzzleCount() }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      return { puzzle_date: d.toISOString().split("T")[0] };
    });
  }

  const subscribed = await isUserSubscribed();

  return (
    <ArchivePaywall
      dates={dates}
      todayDate={getTodayDate()}
      gameName="Chain Reaction"
      gameSlug="chain-reaction"
      gameColor="text-coral"
      todayHref="/daily/chain-reaction"
      isSubscriber={subscribed}
    />
  );
}
