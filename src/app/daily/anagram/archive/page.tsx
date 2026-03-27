import { getAnagramArchiveDates, getTodayDate } from "@/lib/anagram-puzzles";
import { isUserSubscribed } from "@/lib/check-subscription";
import ArchivePaywall from "@/components/ArchivePaywall";

export const revalidate = 3600;

export const metadata = {
  title: "Anagram Scramble Archive — Gamesite",
  description: "Play past Anagram Scramble puzzles.",
};

export default async function AnagramArchivePage() {
  let dates = await getAnagramArchiveDates();

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
      gameName="Anagram Scramble"
      gameSlug="anagram"
      gameColor="text-teal"
      todayHref="/daily/anagram"
      isSubscriber={subscribed}
    />
  );
}
