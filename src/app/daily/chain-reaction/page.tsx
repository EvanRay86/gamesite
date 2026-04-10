import Link from "next/link";
import ChainReactionGame from "@/components/ChainReactionGame";
import MoreDailyGames from "@/components/MoreDailyGames";
import GameJsonLd from "@/components/seo/GameJsonLd";
import {
  getChainReactionPuzzle,
  getTodayDate,
} from "@/lib/chain-reaction-puzzles";
import { buildGameMetadata } from "@/lib/seo";

export const revalidate = 60;

export const metadata = buildGameMetadata({
  title: "Chain Reaction Word Game — Complete the Word Chain",
  description:
    "Complete the word chain where each pair forms a compound word or phrase. Free daily word association puzzle game.",
  path: "daily/chain-reaction",
  color: "coral",
});

export default function ChainReactionPage() {
  const today = getTodayDate();
  const puzzle = getChainReactionPuzzle(today);

  return (
    <main>
      <GameJsonLd name="Chain Reaction" description="Complete the word chain — each pair of neighbors forms a compound word or phrase." path="daily/chain-reaction" category="daily" />
      <ChainReactionGame puzzle={puzzle} date={today} />
      <div className="flex flex-wrap justify-center gap-3 py-6">
        <Link
          href="/daily/chain-reaction/archive"
          className="inline-flex items-center gap-2 rounded-full bg-amber px-6 py-3 text-sm font-semibold text-white shadow-md hover:brightness-90 hover:shadow-lg active:scale-95 transition-all no-underline"
        >
          Play past puzzles &rarr;
        </Link>
        <Link
          href="/daily/chain-reaction/hints"
          className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-6 py-3 text-sm font-semibold text-zinc-600 shadow-sm hover:bg-zinc-50 hover:shadow-md active:scale-95 transition-all no-underline dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          Need a hint?
        </Link>
      </div>
      <MoreDailyGames currentSlug="chain-reaction" />

      <section className="mx-auto max-w-2xl px-4 pb-12 text-sm text-zinc-500 dark:text-zinc-400 space-y-3">
        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          What is Chain Reaction?
        </h2>
        <p>
          Chain Reaction is a daily word puzzle where you complete a chain of five
          words. The first and last words are given — your job is to fill in the
          three hidden words in between. The trick is that every pair of adjacent
          words must form a compound word or common phrase. For example, if the
          chain goes FIRE → ??? → ??? → ??? → BALL, you need words where each
          pair connects naturally.
        </p>
        <p>
          A new chain is available every day on Gamesite, completely free. Play in
          your browser on any device with no download or account required. It is a
          great quick puzzle that trains your vocabulary and lateral thinking.
        </p>

        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          How to Play
        </h2>
        <ol className="list-decimal list-inside space-y-1">
          <li>The first and last words of the chain are revealed.</li>
          <li>Fill in the three missing words between them.</li>
          <li>Each pair of neighbors must form a compound word or well-known phrase.</li>
          <li>Type your guesses and submit when ready.</li>
          <li>All three hidden words must be correct to complete the chain.</li>
        </ol>

        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          Tips &amp; Strategy
        </h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Start by brainstorming compound words for the first and last given words — this gives you possible entry and exit points.</li>
          <li>Work from both ends toward the middle. The middle word is the linchpin that connects both halves.</li>
          <li>Think about common compound word patterns — words like HOUSE, LIGHT, FIRE, WATER, and BACK appear frequently.</li>
          <li>Say potential pairs out loud — &quot;snowball,&quot; &quot;baseball,&quot; &quot;fireball&quot; — your ear often catches valid compounds your eyes miss.</li>
          <li>If stuck, check the hints page for word lengths and first letters.</li>
        </ul>
      </section>
    </main>
  );
}
