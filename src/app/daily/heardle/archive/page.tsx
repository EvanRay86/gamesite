import { getHeardleArchiveDates, getTodayDate } from "@/lib/heardle-puzzles";
import ArchivePaywall from "@/components/ArchivePaywall";

export const revalidate = 3600;

export const metadata = {
  title: "Heardle Archive — Gamesite",
  description: "Play past Heardle puzzles.",
};

export default async function HeardleArchivePage() {
  let dates = await getHeardleArchiveDates();

  if (dates.length === 0) {
    const today = new Date(getTodayDate());
    dates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      return { puzzle_date: d.toISOString().split("T")[0] };
    });
  }

  return (
    <ArchivePaywall
      dates={dates}
      todayDate={getTodayDate()}
      gameName="Heardle"
      gameSlug="heardle"
      gameColor="text-purple"
      todayHref="/daily/heardle"
      isSubscriber={true}
    />
  );
}
