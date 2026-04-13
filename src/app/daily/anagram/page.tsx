import Link from "next/link";
import AnagramGame from "@/components/AnagramGame";
import MoreDailyGames from "@/components/MoreDailyGames";
import GameJsonLd from "@/components/seo/GameJsonLd";
import GameFAQ from "@/components/seo/GameFAQ";
import {
  getAnagramPuzzleByDate,
  getTodayDate,
  getFallbackAnagramPuzzle,
} from "@/lib/anagram-puzzles";
import { buildGameMetadata } from "@/lib/seo";

export const revalidate = 60;

export const metadata = buildGameMetadata({
  title: "Anagram Scramble — Unscramble Words Daily Puzzle",
  description:
    "Unscramble five jumbled words before time runs out. Free daily anagram puzzle game — play online in your browser.",
  path: "daily/anagram",
  color: "teal",
});

export default async function AnagramPage() {
  const today = getTodayDate();

  let puzzle = await getAnagramPuzzleByDate(today);

  if (!puzzle) {
    puzzle = getFallbackAnagramPuzzle(today);
  }

  return (
    <main>
      <GameJsonLd name="Anagram Scramble" description="Unscramble five words before time runs out. A new challenge every day." path="daily/anagram" category="daily" />
      <AnagramGame puzzle={puzzle} />
      <div className="flex flex-wrap justify-center gap-3 py-6">
        <Link
          href="/daily/anagram/archive"
          className="inline-flex items-center gap-2 rounded-full bg-teal px-6 py-3 text-sm font-semibold text-white shadow-md hover:brightness-90 hover:shadow-lg active:scale-95 transition-all no-underline"
        >
          Play past puzzles &rarr;
        </Link>
        <Link
          href="/daily/anagram/hints"
          className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-6 py-3 text-sm font-semibold text-zinc-600 shadow-sm hover:bg-zinc-50 hover:shadow-md active:scale-95 transition-all no-underline dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          Need a hint?
        </Link>
      </div>
      <MoreDailyGames currentSlug="anagram" />

      <section className="mx-auto max-w-2xl px-4 pb-12 text-sm text-zinc-500 dark:text-zinc-400 space-y-3">
        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          What is Anagram Scramble?
        </h2>
        <p>
          Anagram Scramble is a fast-paced daily word game where you unscramble
          five jumbled words before the clock runs out. Each word comes with a
          category hint to point you in the right direction, but the scrambled
          letters can be deceptively tricky. It is the perfect quick brain
          exercise — most rounds take under two minutes.
        </p>
        <p>
          New anagram puzzles are published every day on Gamesite. Play for free
          in your browser with no account or download needed. Challenge yourself
          to solve all five before time expires and compare your speed with
          friends.
        </p>

        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          How to Play
        </h2>
        <ol className="list-decimal list-inside space-y-1">
          <li>Five scrambled words are presented one at a time with a countdown timer.</li>
          <li>Read the hint to understand the category of the answer.</li>
          <li>Rearrange the letters to form the correct word.</li>
          <li>Type your answer and submit. Correct answers move you to the next word.</li>
          <li>Solve all five before time runs out to complete the puzzle.</li>
        </ol>

        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          Tips &amp; Strategy
        </h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Read the hint first — knowing the category dramatically narrows your options.</li>
          <li>Look for common letter patterns like TH, ING, TION, or ED to anchor part of the word.</li>
          <li>Try saying the scrambled letters out loud. Your brain often recognizes words through sound faster than sight.</li>
          <li>Focus on consonant clusters first, then fit vowels around them.</li>
          <li>If you are completely stuck, skip and come back — fresh eyes on a scramble often reveal the answer instantly.</li>
        </ul>
      </section>

      <GameFAQ faqs={[
        { question: "Is Anagram Scramble free to play?", answer: "Yes! Anagram Scramble is completely free to play on Gamesite. No downloads, no accounts, no hidden fees." },
        { question: "Can I play Anagram Scramble on my phone?", answer: "Absolutely. Anagram Scramble works on any device with a modern web browser — phones, tablets, and desktops." },
        { question: "How often does Anagram Scramble update?", answer: "A brand-new Anagram Scramble puzzle is published every day. Come back tomorrow for a fresh challenge." },
        { question: "How much time do I get to solve the anagrams?", answer: "You have a countdown timer to unscramble all five words. Most rounds take under two minutes, making it the perfect quick brain exercise during a break." },
        { question: "Are the anagram words random or themed?", answer: "Each word comes with a category hint to point you in the right direction. The categories vary daily and can range from animals and food to science and geography." },
      ]} />
    </main>
  );
}
