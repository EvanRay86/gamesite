import { getArchiveDates, getTodayDate } from "@/lib/puzzles";
import { SEED_PUZZLES } from "@/lib/seed-data";
import { isUserSubscribed } from "@/lib/check-subscription";
import ArchivePaywall from "@/components/ArchivePaywall";

export const revalidate = 3600;

export default async function ArchivePage() {
  let dates = await getArchiveDates();

  if (dates.length === 0) {
    const today = new Date(getTodayDate());
    dates = Array.from({ length: SEED_PUZZLES.length }, (_, i) => {
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
      gameName="Cluster"
      gameSlug="cluster"
      gameColor="text-coral"
      todayHref="/"
      isSubscriber={subscribed}
    />
  );
}
