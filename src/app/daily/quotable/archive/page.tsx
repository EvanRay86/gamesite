import { getQuotableArchiveDates, getTodayDate } from "@/lib/quotable-puzzles";
import { isUserSubscribed } from "@/lib/check-subscription";
import ArchivePaywall from "@/components/ArchivePaywall";

export const revalidate = 3600;

export const metadata = {
  title: "Quotable Archive — Gamesite",
  description: "Play past Quotable puzzles.",
};

export default async function QuotableArchivePage() {
  let dates = await getQuotableArchiveDates();

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
      gameName="Quotable"
      gameSlug="quotable"
      gameColor="text-purple"
      todayHref="/daily/quotable"
      isSubscriber={subscribed}
    />
  );
}
