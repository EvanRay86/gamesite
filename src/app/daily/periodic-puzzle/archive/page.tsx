import { getPeriodicPuzzleArchiveDates, getTodayDate } from "@/lib/periodic-puzzle-puzzles";
import { isUserSubscribed } from "@/lib/check-subscription";
import ArchivePaywall from "@/components/ArchivePaywall";

export const revalidate = 3600;
export const metadata = { title: "Periodic Puzzle Archive — Gamesite", description: "Play past Periodic Puzzle challenges." };

export default async function PeriodicPuzzleArchivePage() {
  let dates = await getPeriodicPuzzleArchiveDates();
  if (dates.length === 0) {
    const today = new Date(getTodayDate());
    dates = Array.from({ length: 10 }, (_, i) => { const d = new Date(today); d.setDate(d.getDate() - i); return { puzzle_date: d.toISOString().split("T")[0] }; });
  }
  const subscribed = await isUserSubscribed();
  return <ArchivePaywall dates={dates} todayDate={getTodayDate()} gameName="Periodic Puzzle" gameSlug="periodic-puzzle" gameColor="text-green" todayHref="/daily/periodic-puzzle" isSubscriber={subscribed} />;
}
