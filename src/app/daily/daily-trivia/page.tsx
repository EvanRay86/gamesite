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

      <section className="mx-auto max-w-2xl px-4 pb-12 text-sm text-zinc-500 dark:text-zinc-400 space-y-3">
        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          What is 8 Second Trivia?
        </h2>
        <p>
          8 Second Trivia is a free daily trivia game that tests how fast you can
          think under pressure. Each round presents eight multiple-choice
          questions drawn from current events, science, history, entertainment,
          and more — but you only have eight seconds to answer each one. The clock
          adds real tension and makes even easy questions feel thrilling.
        </p>
        <p>
          A fresh set of questions is generated every day on Gamesite. Play in
          your browser on any device, no download or account required. Compare
          your score with friends and see if you can get a perfect streak.
        </p>

        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          How to Play
        </h2>
        <ol className="list-decimal list-inside space-y-1">
          <li>A question appears with four possible answers and an eight-second timer.</li>
          <li>Tap or click the answer you think is correct before time runs out.</li>
          <li>If you answer correctly, you advance to the next question.</li>
          <li>If you answer wrong or run out of time, the game continues but you lose that point.</li>
          <li>After all eight questions, see your final score and share your results.</li>
        </ol>

        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          Tips &amp; Strategy
        </h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Trust your gut — with only eight seconds, overthinking usually leads to wrong answers or timeouts.</li>
          <li>Eliminate obviously wrong answers first to improve your odds if you are unsure.</li>
          <li>Keep up with current events — many questions are drawn from recent news and trending topics.</li>
          <li>If you have no idea, guess anyway. A random guess has a 25% chance, which is better than a timeout.</li>
          <li>Use the hints page if you want to preview the categories before playing.</li>
        </ul>
      </section>
    </main>
  );
}
