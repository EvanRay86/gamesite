import Link from "next/link";
import MathlerGame from "@/components/MathlerGame";
import MoreDailyGames from "@/components/MoreDailyGames";
import { getMathlerPuzzle, getTodayDate } from "@/lib/mathler-puzzles";

export const revalidate = 60;

export const metadata = {
  title: "Mathler — Gamesite",
  description:
    "Find the hidden math equation that equals the target number. 6 guesses, 6 characters.",
};

export default function MathlerPage() {
  const today = getTodayDate();
  const puzzle = getMathlerPuzzle(today);

  return (
    <main>
      <MathlerGame puzzle={puzzle} date={today} />
      <div className="flex justify-center py-6">
        <Link
          href="/daily/mathler/archive"
          className="text-text-muted text-sm hover:text-teal transition-colors no-underline"
        >
          Play past puzzles &rarr;
        </Link>
      </div>
      <MoreDailyGames currentSlug="mathler" />
    </main>
  );
}
