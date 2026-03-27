import { getTop5ArchiveDates, getTodayDate } from "@/lib/top5-puzzles";
import { isUserSubscribed } from "@/lib/check-subscription";
import ArchivePaywall from "@/components/ArchivePaywall";

export const revalidate = 3600;

export const metadata = {
  title: "Top 5 Archive — Gamesite",
  description: "Play past Top 5 puzzles.",
};

export default async function Top5ArchivePage() {
  let dates = await getTop5ArchiveDates();

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
      gameName="Top 5"
      gameSlug="top-5"
      gameColor="text-amber"
      todayHref="/daily/top-5"
      isSubscriber={subscribed}
    />
  );
}
