import Link from "next/link";
import QuotableGame from "@/components/QuotableGame";
import MoreDailyGames from "@/components/MoreDailyGames";
import {
  getQuotablePuzzleByDate,
  getTodayDate,
  getFallbackQuotablePuzzle,
} from "@/lib/quotable-puzzles";

export const revalidate = 60;

export const metadata = {
  title: "Quotable — Gamesite",
  description: "Guess who said the famous quote as words are revealed. A new challenge every day.",
};

export default async function QuotablePage() {
  const today = getTodayDate();

  let puzzle = await getQuotablePuzzleByDate(today);

  if (!puzzle) {
    puzzle = getFallbackQuotablePuzzle(today);
  }

  return (
    <main>
      <QuotableGame puzzle={puzzle} />
      <div className="flex justify-center py-6">
        <Link
          href="/daily/quotable/archive"
          className="inline-flex items-center gap-2 rounded-full bg-purple px-6 py-3 text-sm font-semibold text-white shadow-md hover:brightness-90 hover:shadow-lg active:scale-95 transition-all no-underline"
        >
          Play past puzzles &rarr;
        </Link>
      </div>
      <MoreDailyGames currentSlug="quotable" />
    </main>
  );
}
