import { getTriviaArchiveDates, getTodayDate } from "@/lib/trivia-puzzles";
import { TRIVIA_SEED_PUZZLES } from "@/lib/trivia-seed-data";
import { isUserSubscribed } from "@/lib/check-subscription";
import ArchivePaywall from "@/components/ArchivePaywall";

export const revalidate = 3600;

export const metadata = {
  title: "News Trivia Archive — Gamesite",
  description: "Play past News Trivia puzzles.",
};

export default async function TriviaArchivePage() {
  let dates = await getTriviaArchiveDates();

  if (dates.length === 0) {
    const today = new Date(getTodayDate());
    dates = Array.from({ length: TRIVIA_SEED_PUZZLES.length }, (_, i) => {
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
      gameName="News Trivia"
      gameSlug="daily-trivia"
      gameColor="text-sky"
      todayHref="/daily/daily-trivia"
      isSubscriber={subscribed}
    />
  );
}
