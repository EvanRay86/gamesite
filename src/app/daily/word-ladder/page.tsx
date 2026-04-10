import Link from "next/link";
import WordLadderGame from "@/components/WordLadderGame";
import MoreDailyGames from "@/components/MoreDailyGames";
import GameJsonLd from "@/components/seo/GameJsonLd";
import { getWordLadderPuzzle, getTodayDate } from "@/lib/word-ladder-puzzles";
import { buildGameMetadata } from "@/lib/seo";

export const revalidate = 60;

export const metadata = buildGameMetadata({
  title: "Word Ladder Puzzle — Free Daily Word Game",
  description:
    "Change one letter at a time to transform one word into another. Free daily word ladder puzzle — train your vocabulary and logic skills.",
  path: "daily/word-ladder",
  color: "teal",
});

export default function WordLadderPage() {
  const today = getTodayDate();
  const puzzle = getWordLadderPuzzle(today);

  return (
    <main>
      <GameJsonLd name="Word Ladder" description="Change one letter at a time to transform the start word into the target word." path="daily/word-ladder" category="daily" />
      <WordLadderGame puzzle={puzzle} date={today} />
      <div className="flex flex-wrap justify-center gap-3 py-6">
        <Link
          href="/daily/word-ladder/archive"
          className="inline-flex items-center gap-2 rounded-full bg-teal px-6 py-3 text-sm font-semibold text-white shadow-md hover:brightness-90 hover:shadow-lg active:scale-95 transition-all no-underline"
        >
          Play past puzzles &rarr;
        </Link>
        <Link
          href="/daily/word-ladder/hints"
          className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-6 py-3 text-sm font-semibold text-zinc-600 shadow-sm hover:bg-zinc-50 hover:shadow-md active:scale-95 transition-all no-underline dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          Need a hint?
        </Link>
      </div>
      <MoreDailyGames currentSlug="word-ladder" />

      <section className="mx-auto max-w-2xl px-4 pb-12 text-sm text-zinc-500 dark:text-zinc-400 space-y-3">
        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          What is Word Ladder?
        </h2>
        <p>
          Word Ladder is a classic word puzzle where you transform one word into
          another by changing a single letter at a time. Each step must form a
          valid English word. The challenge is finding the shortest path between
          the start word and the target word — sometimes the obvious route leads
          to a dead end and you need to think creatively.
        </p>
        <p>
          A new Word Ladder puzzle is available every day on Gamesite. It is
          completely free to play in your browser on any device. The concept dates
          back to Lewis Carroll, who invented the game in 1877 under the name
          &quot;Doublets.&quot;
        </p>

        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          How to Play
        </h2>
        <ol className="list-decimal list-inside space-y-1">
          <li>You are given a start word and a target word.</li>
          <li>Change exactly one letter to form a new valid word.</li>
          <li>Repeat until you reach the target word.</li>
          <li>Each intermediate word must be a real English word.</li>
          <li>Try to solve it in the fewest steps possible.</li>
        </ol>

        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          Tips &amp; Strategy
        </h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Work from both ends — think about what words are one step away from the target as well as the start.</li>
          <li>Focus on vowels first. Changing vowels often opens up more word options than consonants.</li>
          <li>If you get stuck, try changing a different letter position than the one you have been focusing on.</li>
          <li>Common short words (like CAT, DOG, HAT) have many neighbors — use them as stepping stones.</li>
          <li>There is usually more than one valid path. If your current route dead-ends, backtrack and try another.</li>
        </ul>
      </section>
    </main>
  );
}
