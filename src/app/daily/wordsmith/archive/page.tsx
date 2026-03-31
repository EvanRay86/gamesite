import { isUserSubscribed } from "@/lib/check-subscription";
import ArchivePaywall from "@/components/ArchivePaywall";

export const revalidate = 3600;

export const metadata = {
  title: "Wordsmith Archive — Gamesite",
  description: "Play past Wordsmith puzzles.",
};

/** Wordsmith epoch — first puzzle date. */
const EPOCH = "2026-03-29";

function getWordsmithArchiveDates(): { puzzle_date: string }[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const epoch = new Date(EPOCH + "T00:00:00");
  const dates: { puzzle_date: string }[] = [];

  const d = new Date(today);
  while (d >= epoch) {
    dates.push({ puzzle_date: d.toISOString().split("T")[0] });
    d.setDate(d.getDate() - 1);
  }

  return dates;
}

export default async function WordsmithArchivePage() {
  const dates = getWordsmithArchiveDates();
  const today = new Date().toISOString().split("T")[0];
  const subscribed = await isUserSubscribed();

  return (
    <ArchivePaywall
      dates={dates}
      todayDate={today}
      gameName="Wordsmith"
      gameSlug="wordsmith"
      gameColor="text-amber"
      todayHref="/daily/wordsmith"
      isSubscriber={subscribed}
    />
  );
}
