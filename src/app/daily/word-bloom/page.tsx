import Link from "next/link";
import WordBloomGame from "@/components/WordBloomGame";
import MoreDailyGames from "@/components/MoreDailyGames";
import GameJsonLd from "@/components/seo/GameJsonLd";
import {
  getWordBloomPuzzleByDate,
  getTodayDate,
  getFallbackWordBloomPuzzle,
} from "@/lib/word-bloom-puzzles";
import { buildGameMetadata } from "@/lib/seo";

export const revalidate = 60;

export const metadata = buildGameMetadata({
  title: "Word Bloom — Find Words from 7 Letters | Free Daily Puzzle",
  description:
    "Build as many words as you can from seven letters — every word must use the center letter. Like Spelling Bee, free daily, no app needed.",
  path: "daily/word-bloom",
  color: "green",
});

export default async function WordBloomPage() {
  const today = getTodayDate();

  let puzzle = await getWordBloomPuzzleByDate(today);

  if (!puzzle) {
    puzzle = getFallbackWordBloomPuzzle(today);
  }

  return (
    <main>
      <GameJsonLd name="Word Bloom" description="Make words from 7 letters, always using the center. A new bloom every day." path="daily/word-bloom" category="daily" />
      <WordBloomGame puzzle={puzzle} />
      <div className="flex flex-col items-center gap-3 py-6 px-4 w-full max-w-md mx-auto">
        <Link
          href="/daily/word-bloom/duel"
          className="w-full text-center rounded-full bg-coral text-white font-semibold py-3 px-6 text-base hover:bg-coral/90 active:scale-[0.98] transition-all no-underline shadow-sm"
        >
          Duel a friend
        </Link>
        <Link
          href="/daily/word-bloom/quickplay"
          className="w-full text-center rounded-full bg-green text-white font-semibold py-3 px-6 text-base hover:bg-green/90 active:scale-[0.98] transition-all no-underline shadow-sm"
        >
          Quickplay — unlimited random puzzles
        </Link>
        <Link
          href="/daily/word-bloom/archive"
          className="w-full text-center rounded-full border-2 border-green text-green font-semibold py-3 px-6 text-base hover:bg-green/10 active:scale-[0.98] transition-all no-underline"
        >
          Play past puzzles
        </Link>
        <Link
          href="/daily/word-bloom/hints"
          className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-6 py-3 text-sm font-semibold text-zinc-600 shadow-sm hover:bg-zinc-50 hover:shadow-md active:scale-95 transition-all no-underline dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          Need a hint?
        </Link>
      </div>
      <MoreDailyGames currentSlug="word-bloom" />

      <section className="mx-auto max-w-2xl px-4 pb-12 text-sm text-zinc-500 dark:text-zinc-400 space-y-3">
        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          What is Word Bloom?
        </h2>
        <p>
          Word Bloom is a daily word-finding game inspired by the NYT Spelling
          Bee. You are given seven letters arranged in a flower pattern, and your
          goal is to build as many valid words as possible. The twist is that
          every word must include the center letter. Words must be at least four
          letters long, and longer words earn more points.
        </p>
        <p>
          A fresh set of letters blooms every day on Gamesite. Play for free in
          your browser on any device. You can also challenge a friend in Duel mode
          or play unlimited random puzzles in Quickplay. No account or download
          required.
        </p>

        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          How to Play
        </h2>
        <ol className="list-decimal list-inside space-y-1">
          <li>Seven letters are arranged around a center letter.</li>
          <li>Build words using any combination of the available letters. Letters can be reused.</li>
          <li>Every word must include the center letter and be at least four letters long.</li>
          <li>Submit valid words to earn points. Longer words score higher.</li>
          <li>Find as many words as you can to climb through the ranking tiers.</li>
        </ol>

        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          Tips &amp; Strategy
        </h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Start with common four-letter words to build momentum, then look for longer ones.</li>
          <li>Try adding common prefixes and suffixes — UN, RE, ING, ED, LY — to words you already found.</li>
          <li>Remember that letters can be reused. &quot;BANANA&quot; is valid if B, A, and N are available.</li>
          <li>Think about less obvious word categories — cooking terms, scientific words, or archaic English can yield surprising finds.</li>
          <li>If you are stuck, step away and come back. Fresh eyes almost always find words you missed.</li>
        </ul>
      </section>
    </main>
  );
}
