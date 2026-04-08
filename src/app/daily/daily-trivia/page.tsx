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
  title: "Play Daily Trivia Online Free — News Quiz Today",
  description:
    "Play today's trivia — 8 questions about current events and trending news. A free daily trivia quiz you can play in your browser.",
  path: "daily/daily-trivia",
  color: "sky",
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
      <div className="flex flex-wrap justify-center gap-3 py-6">
        <Link
          href="/daily/daily-trivia/archive"
          className="inline-flex items-center gap-2 rounded-full bg-coral px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-coral-dark hover:shadow-lg active:scale-95 transition-all no-underline"
        >
          Play past puzzles &rarr;
        </Link>
        <Link
          href="/daily/daily-trivia/hints"
          className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-6 py-3 text-sm font-semibold text-zinc-600 shadow-sm hover:bg-zinc-50 hover:shadow-md active:scale-95 transition-all no-underline dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          Need a hint?
        </Link>
      </div>
      <MoreDailyGames currentSlug="daily-trivia" />
    </main>
  );
}
