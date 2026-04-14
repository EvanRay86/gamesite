import Link from "next/link";
import MathlerGame from "@/components/MathlerGame";
import MoreDailyGames from "@/components/MoreDailyGames";
import GameJsonLd from "@/components/seo/GameJsonLd";
import GameFAQ from "@/components/seo/GameFAQ";
import { getMathlerPuzzle, getTodayDate } from "@/lib/mathler-puzzles";
import { buildGameMetadata } from "@/lib/seo";

export const revalidate = 60;

export const metadata = buildGameMetadata({
  title: "Mathler — Daily Math Equation Puzzle Game",
  description:
    "Find the hidden math equation that equals the target number. A free daily math puzzle like Wordle but for equations.",
  path: "daily/mathler",
  color: "purple",
});

export default function MathlerPage() {
  const today = getTodayDate();
  const puzzle = getMathlerPuzzle(today);

  return (
    <main>
      <GameJsonLd name="Mathler" description="Find the hidden math equation that equals the target number. 6 guesses, 6 characters." path="daily/mathler" category="daily" />
      <MathlerGame puzzle={puzzle} date={today} />
      <div className="flex flex-wrap justify-center gap-3 py-6">
        <Link
          href="/daily/mathler/archive"
          className="inline-flex items-center gap-2 rounded-full bg-teal px-6 py-3 text-sm font-semibold text-white shadow-md hover:brightness-90 hover:shadow-lg active:scale-95 transition-all no-underline"
        >
          Play past puzzles &rarr;
        </Link>
        <Link
          href="/daily/mathler/hints"
          className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-6 py-3 text-sm font-semibold text-zinc-600 shadow-sm hover:bg-zinc-50 hover:shadow-md active:scale-95 transition-all no-underline dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          Need a hint?
        </Link>
      </div>
      <MoreDailyGames currentSlug="mathler" />

      <section className="mx-auto max-w-2xl px-4 pb-12 text-sm text-zinc-500 dark:text-zinc-400 space-y-3">
        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          What is Mathler?
        </h2>
        <p>
          Mathler is a daily math puzzle that combines the logic of Wordle with
          arithmetic. You are given a target number and must find the six-character
          equation that produces it. The equation uses digits (0-9) and basic
          operators (+, -, *, /). After each guess, tiles turn green, yellow, or
          gray to show which characters are correct, misplaced, or absent — just
          like a word game, but with numbers.
        </p>
        <p>
          A new Mathler puzzle is available every day on Gamesite. It is
          completely free and runs in your browser on any device. Whether you are
          a math enthusiast or just looking for a different kind of daily
          challenge, Mathler exercises a different part of your brain than word
          puzzles.
        </p>

        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          How to Play
        </h2>
        <ol className="list-decimal list-inside space-y-1">
          <li>The target number is displayed at the top of the puzzle.</li>
          <li>Enter a six-character math equation using digits and operators (+, -, *, /).</li>
          <li>Your equation must evaluate to the target number to be a valid guess.</li>
          <li>After each guess, tiles change color: green (correct position), yellow (in the equation but wrong spot), gray (not used).</li>
          <li>Find the exact equation in six guesses or fewer.</li>
        </ol>

        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          Tips &amp; Strategy
        </h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Start by thinking about which operations could produce the target. A target of 100 could be 50+50 or 20*5+0.</li>
          <li>Use your first guess to test common digits and operators — this maximizes the information you get from the color feedback.</li>
          <li>Remember order of operations — multiplication and division happen before addition and subtraction.</li>
          <li>If you know certain digits are in the equation, try different positions for them systematically.</li>
          <li>Leading zeros are not allowed, but zero can appear in other positions (like 10+90).</li>
        </ul>
      </section>

      <GameFAQ faqs={[
        { question: "Is Mathler free to play?", answer: "Yes! Mathler is completely free to play on Gamesite. No downloads, no accounts, no hidden fees." },
        { question: "Can I play Mathler on my phone?", answer: "Absolutely. Mathler works on any device with a modern web browser — phones, tablets, and desktops." },
        { question: "How often does Mathler update?", answer: "A brand-new Mathler puzzle is published every day. Come back tomorrow for a fresh challenge." },
        { question: "Does Mathler follow order of operations?", answer: "Yes, standard mathematical order of operations (PEMDAS/BODMAS) applies. Multiplication and division are evaluated before addition and subtraction, which is important when constructing your equations." },
        { question: "Can the equation include leading zeros?", answer: "No, leading zeros are not allowed. However, zero can appear in other positions within the equation, such as in the number 10 or 20." },
      ]} />
    </main>
  );
}
