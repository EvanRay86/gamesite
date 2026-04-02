import Link from "next/link";
import TriviaGame from "@/components/TriviaGame";
import MoreDailyGames from "@/components/MoreDailyGames";
import GameJsonLd from "@/components/seo/GameJsonLd";
import {
  getTriviaPuzzleByDate,
  getTodayDate,
  generateAndStorePuzzle,
  getFallbackTriviaPuzzle,
} from "@/lib/trivia-puzzles";
import { buildGameMetadata } from "@/lib/seo";

export const revalidate = 60;

export const metadata = buildGameMetadata({
  title: "Daily Trivia",
  description: "Test your knowledge with 8 daily trivia questions featuring current events.",
  path: "daily/daily-trivia",
});

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
      <GameJsonLd name="Daily Trivia" description="Test your knowledge with 8 daily trivia questions featuring current events." path="daily/daily-trivia" category="daily" />
      <TriviaGame puzzle={puzzle} />
      <div className="flex justify-center py-6">
        <Link
          href="/daily/daily-trivia/archive"
          className="inline-flex items-center gap-2 rounded-full bg-coral px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-coral-dark hover:shadow-lg active:scale-95 transition-all no-underline"
        >
          Play past puzzles &rarr;
        </Link>
      </div>
      <MoreDailyGames currentSlug="daily-trivia" />
    </main>
  );
}
