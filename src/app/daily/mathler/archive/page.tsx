import {
  getMathlerArchiveDates,
  getTodayDate,
  getSeedPuzzleCount,
} from "@/lib/mathler-puzzles";
import { isUserSubscribed } from "@/lib/check-subscription";
import ArchivePaywall from "@/components/ArchivePaywall";

export const revalidate = 3600;

export const metadata = {
  title: "Mathler Archive — Gamesite",
  description: "Play past Mathler puzzles.",
};

export default async function MathlerArchivePage() {
  let dates = await getMathlerArchiveDates();

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
      gameName="Mathler"
      gameSlug="mathler"
      gameColor="text-green"
      todayHref="/daily/mathler"
      isSubscriber={subscribed}
    />
  );
}
