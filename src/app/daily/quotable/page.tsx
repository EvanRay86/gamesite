import Link from "next/link";
import QuotableGame from "@/components/QuotableGame";
import MoreDailyGames from "@/components/MoreDailyGames";
import GameJsonLd from "@/components/seo/GameJsonLd";
import {
  getQuotablePuzzleByDate,
  getTodayDate,
  getFallbackQuotablePuzzle,
} from "@/lib/quotable-puzzles";
import { buildGameMetadata } from "@/lib/seo";

export const revalidate = 60;

export const metadata = buildGameMetadata({
  title: "Play Quotable Online Free — Daily Quote Guessing Game",
  description:
    "Play Quotable today — guess who said the famous quote as words are revealed one by one. A free daily trivia game in your browser.",
  path: "daily/quotable",
  color: "purple",
});

export default async function QuotablePage() {
  const today = getTodayDate();

  let puzzle = await getQuotablePuzzleByDate(today);

  if (!puzzle) {
    puzzle = getFallbackQuotablePuzzle(today);
  }

  return (
    <main>
      <GameJsonLd name="Quotable" description="Guess who said the famous quote as words are revealed. A new challenge every day." path="daily/quotable" category="daily" />
      <QuotableGame puzzle={puzzle} />
      <div className="flex flex-wrap justify-center gap-3 py-6">
        <Link
          href="/daily/quotable/archive"
          className="inline-flex items-center gap-2 rounded-full bg-purple px-6 py-3 text-sm font-semibold text-white shadow-md hover:brightness-90 hover:shadow-lg active:scale-95 transition-all no-underline"
        >
          Play past puzzles &rarr;
        </Link>
        <Link
          href="/daily/quotable/hints"
          className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-6 py-3 text-sm font-semibold text-zinc-600 shadow-sm hover:bg-zinc-50 hover:shadow-md active:scale-95 transition-all no-underline dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          Need a hint?
        </Link>
      </div>
      <MoreDailyGames currentSlug="quotable" />

      <section className="mx-auto max-w-2xl px-4 pb-12 text-sm text-zinc-500 dark:text-zinc-400 space-y-3">
        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          What is Quotable?
        </h2>
        <p>
          Quotable is a daily quote-guessing game where a famous quote is revealed
          one word at a time. Your challenge is to figure out who said it before
          the full quote is shown. You are given multiple-choice options for the
          speaker, and the fewer words you need to guess correctly, the better
          your score.
        </p>
        <p>
          A new Quotable puzzle is published every day on Gamesite. Play for free
          in your browser — no app or account needed. It is a great way to test
          your knowledge of famous quotes from history, literature, politics,
          entertainment, and more.
        </p>

        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          How to Play
        </h2>
        <ol className="list-decimal list-inside space-y-1">
          <li>A quote begins to appear one word at a time.</li>
          <li>Four possible speakers are listed as multiple-choice options.</li>
          <li>Guess the speaker as early as possible for the best score.</li>
          <li>If you wait, more words are revealed, making it easier but lowering your potential score.</li>
          <li>Select the correct speaker to complete the puzzle.</li>
        </ol>

        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          Tips &amp; Strategy
        </h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Pay attention to the tone and vocabulary of the first few words — formal language might suggest a historical figure, while casual phrasing points to a modern celebrity.</li>
          <li>Use the multiple-choice options as context. If one person is from the 1800s and the quote sounds modern, you can eliminate them.</li>
          <li>Famous catchphrases or signature styles can be recognized from just a few words — &quot;I have a dream&quot; or &quot;One small step&quot; are instant giveaways.</li>
          <li>If you are unsure early on, wait for one or two more words rather than guessing blindly.</li>
          <li>The more quotes you encounter, the better you get at recognizing speaking styles and famous lines.</li>
        </ul>
      </section>
    </main>
  );
}
