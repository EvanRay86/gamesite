import Link from "next/link";
import WordLadderGame from "@/components/WordLadderGame";
import MoreDailyGames from "@/components/MoreDailyGames";
import { getWordLadderPuzzle, getTodayDate } from "@/lib/word-ladder-puzzles";

export const revalidate = 60;

export const metadata = {
  title: "Word Ladder — Gamesite",
  description:
    "Change one letter at a time to transform the start word into the target word.",
};

export default function WordLadderPage() {
  const today = getTodayDate();
  const puzzle = getWordLadderPuzzle(today);

  return (
    <main>
      <WordLadderGame puzzle={puzzle} date={today} />
      <div className="flex justify-center py-6">
        <Link
          href="/daily/word-ladder/archive"
          className="inline-flex items-center gap-2 rounded-full bg-teal px-6 py-3 text-sm font-semibold text-white shadow-md hover:brightness-90 hover:shadow-lg active:scale-95 transition-all no-underline"
        >
          Play past puzzles &rarr;
        </Link>
      </div>
      <MoreDailyGames currentSlug="word-ladder" />
    </main>
  );
}
