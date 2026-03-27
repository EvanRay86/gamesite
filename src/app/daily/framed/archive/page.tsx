import { getFramedArchiveDates, getTodayDate } from "@/lib/framed-puzzles";
import { isUserSubscribed } from "@/lib/check-subscription";
import ArchivePaywall from "@/components/ArchivePaywall";

export const revalidate = 3600;

export const metadata = {
  title: "Framed Archive — Gamesite",
  description: "Play past Framed puzzles.",
};

export default async function FramedArchivePage() {
  let dates = await getFramedArchiveDates();

  if (dates.length === 0) {
    const today = new Date(getTodayDate());
    dates = Array.from({ length: 7 }, (_, i) => {
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
      gameName="Framed"
      gameSlug="framed"
      gameColor="text-green"
      todayHref="/daily/framed"
      isSubscriber={subscribed}
    />
  );
}
