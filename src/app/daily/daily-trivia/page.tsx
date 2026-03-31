import Link from "next/link";
import TriviaGame from "@/components/TriviaGame";
import MoreDailyGames from "@/components/MoreDailyGames";
import {
  getTriviaPuzzleByDate,
  getTodayDate,
  generateAndStorePuzzle,
  getFallbackTriviaPuzzle,
} from "@/lib/trivia-puzzles";

export const revalidate = 60;

export const metadata = {
  title: "Daily Trivia — Gamesite",
  description: "Test your knowledge with 8 daily trivia questions featuring current events.",
};

export default async function TriviaPage() {
  const today = getTodayDate();

  // 1. Try Supabase
  let puzzle = await getTriviaPuzzleByDate(today);

  // 2. If not found, generate with Gemini + store
  if (!puzzle) {
    puzzle = await generateAndStorePuzzle(today);
  }

  // 3. Last resort: seed data
  if (!puzzle) {
    puzzle = getFallbackTriviaPuzzle(today);
  }

  return (
    <main>
      <TriviaGame puzzle={puzzle} />
      <div className="flex justify-center py-6">
        <Link
          href="/daily/daily-trivia/archive"
          className="text-text-muted text-sm hover:text-coral transition-colors no-underline"
        >
          Play past puzzles &rarr;
        </Link>
      </div>
      <MoreDailyGames currentSlug="daily-trivia" />
    </main>
  );
}
