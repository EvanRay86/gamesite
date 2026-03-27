import { getTimelineArchiveDates, getTodayDate } from "@/lib/timeline-puzzles";
import { isUserSubscribed } from "@/lib/check-subscription";
import ArchivePaywall from "@/components/ArchivePaywall";

export const revalidate = 3600;

export const metadata = {
  title: "Timeline Archive — Gamesite",
  description: "Play past Timeline puzzles.",
};

export default async function TimelineArchivePage() {
  let dates = await getTimelineArchiveDates();

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
      gameName="Timeline"
      gameSlug="timeline"
      gameColor="text-teal"
      todayHref="/daily/timeline"
      isSubscriber={subscribed}
    />
  );
}
