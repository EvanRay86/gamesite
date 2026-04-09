import Link from "next/link";
import HexleGame from "@/components/HexleGame";
import MoreDailyGames from "@/components/MoreDailyGames";
import GameJsonLd from "@/components/seo/GameJsonLd";
import { getHexlePuzzle, getFallbackHexleWord } from "@/lib/hexle-words";
import { buildGameMetadata } from "@/lib/seo";

export const revalidate = 60;

export const metadata = buildGameMetadata({
  title: "Play Hexle Online Free — Daily 6-Letter Word Game",
  description:
    "Play Hexle today — guess the six-letter word in seven tries. A free daily word puzzle like Wordle but harder. No download required.",
  path: "daily/hexle",
  color: "amber",
});

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

export default async function HexlePage() {
  const today = getTodayDate();
  let answer = await getHexlePuzzle(today);

  if (!answer) {
    answer = getFallbackHexleWord(today);
  }

  return (
    <main>
      <GameJsonLd name="Hexle" description="Seven guesses to crack the six-letter word. A new puzzle every day." path="daily/hexle" category="daily" />
      <HexleGame answer={answer} puzzleDate={today} />
      <div className="flex flex-wrap justify-center gap-3 py-6">
        <Link
          href="/daily/hexle/archive"
          className="inline-flex items-center gap-2 rounded-full bg-amber px-6 py-3 text-sm font-semibold text-white shadow-md hover:brightness-90 hover:shadow-lg active:scale-95 transition-all no-underline"
        >
          Play past puzzles &rarr;
        </Link>
        <Link
          href="/daily/hexle/hints"
          className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-6 py-3 text-sm font-semibold text-zinc-600 shadow-sm hover:bg-zinc-50 hover:shadow-md active:scale-95 transition-all no-underline dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          Need a hint?
        </Link>
      </div>
      <MoreDailyGames currentSlug="hexle" />

      <section className="mx-auto max-w-2xl px-4 pb-12 text-sm text-zinc-500 dark:text-zinc-400 space-y-3">
        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          What is Hexle?
        </h2>
        <p>
          Hexle is a free daily word puzzle where you have seven attempts to guess
          a six-letter word. After each guess, every letter is color-coded to show
          whether it is in the correct position, in the word but misplaced, or not
          in the word at all. Think of it as a harder version of Wordle — six
          letters instead of five means more possibilities and tougher deductions.
        </p>
        <p>
          A new Hexle puzzle is published every day on Gamesite. Play it right in
          your browser on any device — no app download or account needed. Share
          your results with friends and compare streaks.
        </p>

        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          How to Play Hexle
        </h2>
        <ol className="list-decimal list-inside space-y-1">
          <li>Type a valid six-letter word and press Enter.</li>
          <li>Green means the letter is correct and in the right spot.</li>
          <li>Yellow means the letter is in the word but in the wrong position.</li>
          <li>Gray means the letter is not in the word at all.</li>
          <li>Use the feedback to refine your next guess. You have seven tries total.</li>
        </ol>

        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          Tips &amp; Strategy
        </h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Start with a word that has common letters — vowels like A, E, I and popular consonants like R, S, T, N.</li>
          <li>Your second guess should test new letters rather than rearranging ones you already know about.</li>
          <li>Pay close attention to yellow letters — knowing a letter is present but misplaced eliminates many options.</li>
          <li>Think about common six-letter word patterns like _TION, _MENT, or _NESS endings.</li>
          <li>If you are stuck after four guesses, use the hints page for a nudge in the right direction.</li>
        </ul>
      </section>
    </main>
  );
}
