import { getRootWordsArchiveDates, getTodayDate } from "@/lib/root-words-puzzles";
import { isUserSubscribed } from "@/lib/check-subscription";
import ArchivePaywall from "@/components/ArchivePaywall";

export const revalidate = 3600;
export const metadata = { title: "Root Words Archive — Gamesite", description: "Play past Root Words puzzles." };

export default async function RootWordsArchivePage() {
  let dates = await getRootWordsArchiveDates();
  if (dates.length === 0) {
    const today = new Date(getTodayDate());
    dates = Array.from({ length: 10 }, (_, i) => { const d = new Date(today); d.setDate(d.getDate() - i); return { puzzle_date: d.toISOString().split("T")[0] }; });
  }
  const subscribed = await isUserSubscribed();
  return <ArchivePaywall dates={dates} todayDate={getTodayDate()} gameName="Root Words" gameSlug="root-words" gameColor="text-teal" todayHref="/daily/root-words" isSubscriber={subscribed} />;
}
