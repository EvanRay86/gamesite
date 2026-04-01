import { getWordBloomArchiveDates, getTodayDate } from "@/lib/word-bloom-puzzles";
import { isUserSubscribed } from "@/lib/check-subscription";
import ArchivePaywall from "@/components/ArchivePaywall";

export const revalidate = 3600;

export const metadata = {
  title: "Word Bloom Archive — Gamesite",
  description: "Play past Word Bloom puzzles.",
};

export default async function WordBloomArchivePage() {
  let dates = await getWordBloomArchiveDates();

  if (dates.length === 0) {
    const today = new Date(getTodayDate());
    dates = Array.from({ length: 10 }, (_, i) => {
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
      gameName="Word Bloom"
      gameSlug="word-bloom"
      gameColor="text-green"
      todayHref="/daily/word-bloom"
      isSubscriber={subscribed}
    />
  );
}
