import {
  getHexleArchiveDates,
  getTodayDate,
  getSeedPuzzleCount,
} from "@/lib/hexle-words";
import { isUserSubscribed } from "@/lib/check-subscription";
import ArchivePaywall from "@/components/ArchivePaywall";

export const revalidate = 3600;

export const metadata = {
  title: "Hexle Archive — Gamesite",
  description: "Play past Hexle puzzles.",
};

export default async function HexleArchivePage() {
  let dates = await getHexleArchiveDates();

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
      gameName="Hexle"
      gameSlug="hexle"
      gameColor="text-amber"
      todayHref="/daily/hexle"
      isSubscriber={subscribed}
    />
  );
}
