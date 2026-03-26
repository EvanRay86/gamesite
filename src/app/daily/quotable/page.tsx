import Link from "next/link";
import QuotableGame from "@/components/QuotableGame";
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
          className="text-text-muted text-sm hover:text-purple transition-colors no-underline"
        >
          Play past puzzles &rarr;
        </Link>
      </div>
    </main>
  );
}
