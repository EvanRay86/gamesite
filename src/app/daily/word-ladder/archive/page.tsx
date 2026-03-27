import {
  getWordLadderArchiveDates,
  getTodayDate,
  getSeedPuzzleCount,
} from "@/lib/word-ladder-puzzles";
import { isUserSubscribed } from "@/lib/check-subscription";
import ArchivePaywall from "@/components/ArchivePaywall";

export const revalidate = 3600;

export const metadata = {
  title: "Word Ladder Archive — Gamesite",
  description: "Play past Word Ladder puzzles.",
};

export default async function WordLadderArchivePage() {
  let dates = await getWordLadderArchiveDates();

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
      gameName="Word Ladder"
      gameSlug="word-ladder"
      gameColor="text-teal"
      todayHref="/daily/word-ladder"
      isSubscriber={subscribed}
    />
  );
}
