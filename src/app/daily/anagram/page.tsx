import Link from "next/link";
import AnagramGame from "@/components/AnagramGame";
import MoreDailyGames from "@/components/MoreDailyGames";
import {
  getAnagramPuzzleByDate,
  getTodayDate,
  getFallbackAnagramPuzzle,
} from "@/lib/anagram-puzzles";

export const revalidate = 60;

export const metadata = {
  title: "Anagram Scramble — Gamesite",
  description: "Unscramble five words before time runs out. A new challenge every day.",
};

export default async function AnagramPage() {
  const today = getTodayDate();

  let puzzle = await getAnagramPuzzleByDate(today);

  if (!puzzle) {
    puzzle = getFallbackAnagramPuzzle(today);
  }

  return (
    <main>
      <AnagramGame puzzle={puzzle} />
      <div className="flex justify-center py-6">
        <Link
          href="/daily/anagram/archive"
          className="inline-flex items-center gap-2 rounded-full bg-teal px-6 py-3 text-sm font-semibold text-white shadow-md hover:brightness-90 hover:shadow-lg active:scale-95 transition-all no-underline"
        >
          Play past puzzles &rarr;
        </Link>
      </div>
      <MoreDailyGames currentSlug="anagram" />
    </main>
  );
}
