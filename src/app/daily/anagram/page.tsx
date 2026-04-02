import Link from "next/link";
import AnagramGame from "@/components/AnagramGame";
import MoreDailyGames from "@/components/MoreDailyGames";
import GameJsonLd from "@/components/seo/GameJsonLd";
import {
  getAnagramPuzzleByDate,
  getTodayDate,
  getFallbackAnagramPuzzle,
} from "@/lib/anagram-puzzles";
import { buildGameMetadata } from "@/lib/seo";

export const revalidate = 60;

export const metadata = buildGameMetadata({
  title: "Anagram Scramble",
  description: "Unscramble five words before time runs out. A new challenge every day.",
  path: "daily/anagram",
});

export default async function AnagramPage() {
  const today = getTodayDate();

  let puzzle = await getAnagramPuzzleByDate(today);

  if (!puzzle) {
    puzzle = getFallbackAnagramPuzzle(today);
  }

  return (
    <main>
      <GameJsonLd name="Anagram Scramble" description="Unscramble five words before time runs out. A new challenge every day." path="daily/anagram" category="daily" />
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
