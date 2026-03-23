import TriviaGame from "@/components/TriviaGame";
import {
  getTriviaPuzzleByDate,
  getTodayDate,
  getFallbackTriviaPuzzle,
} from "@/lib/trivia-puzzles";
import Link from "next/link";

export const revalidate = 60;

export const metadata = {
  title: "Daily Trivia — Gamesite",
  description: "Test your knowledge with 8 daily trivia questions.",
};

export default async function TriviaPage() {
  const today = getTodayDate();
  let puzzle = await getTriviaPuzzleByDate(today);

  if (!puzzle) {
    puzzle = getFallbackTriviaPuzzle(today);
  }

  return (
    <main>
      <TriviaGame puzzle={puzzle} />
      <div className="fixed bottom-4 right-4">
        <Link
          href="/"
          className="bg-surface text-text-muted border border-border-light
                     rounded-full px-4 py-2 text-xs font-semibold
                     hover:bg-surface-hover hover:text-text-secondary transition-all
                     no-underline"
        >
          More Games
        </Link>
      </div>
    </main>
  );
}
