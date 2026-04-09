import Link from "next/link";
import PeriodicPuzzleGame from "@/components/PeriodicPuzzleGame";
import MoreDailyGames from "@/components/MoreDailyGames";
import GameJsonLd from "@/components/seo/GameJsonLd";
import { getPeriodicPuzzleByDate, getTodayDate, getFallbackPeriodicPuzzle } from "@/lib/periodic-puzzle-puzzles";
import { buildGameMetadata } from "@/lib/seo";

export const revalidate = 60;

export const metadata = buildGameMetadata({
  title: "Play Periodic Puzzle Online Free — Daily Chemistry Game",
  description: "Play Periodic Puzzle today — guess the chemical element from progressive clues about atomic number, period, group, and category. A free daily science game.",
  path: "daily/periodic-puzzle",
  color: "green",
});

export default async function PeriodicPuzzlePage() {
  const today = getTodayDate();
  let puzzle = await getPeriodicPuzzleByDate(today);
  if (!puzzle) puzzle = getFallbackPeriodicPuzzle(today);

  return (
    <main>
      <GameJsonLd name="Periodic Puzzle" description="Guess the chemical element from comparison clues. Six attempts to identify the mystery element." path="daily/periodic-puzzle" category="daily" />
      <PeriodicPuzzleGame puzzle={puzzle} />
      <div className="flex flex-wrap justify-center gap-3 py-6">
        <Link href="/daily/periodic-puzzle/archive" className="inline-flex items-center gap-2 rounded-full bg-green px-6 py-3 text-sm font-semibold text-white shadow-md hover:brightness-90 hover:shadow-lg active:scale-95 transition-all no-underline">Play past puzzles &rarr;</Link>
        <Link href="/daily/periodic-puzzle/hints" className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-6 py-3 text-sm font-semibold text-zinc-600 shadow-sm hover:bg-zinc-50 hover:shadow-md active:scale-95 transition-all no-underline dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700">Need a hint?</Link>
      </div>
      <MoreDailyGames currentSlug="periodic-puzzle" />

      <section className="mx-auto max-w-2xl px-4 pb-12 text-sm text-zinc-500 dark:text-zinc-400 space-y-3">
        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">What is Periodic Puzzle?</h2>
        <p>Periodic Puzzle is a free daily chemistry game where you guess a mystery element from the periodic table. After each guess, you receive comparison clues showing whether the answer has a higher or lower atomic number, period, and group, and whether the category and state at room temperature match. It is like Wordle for science enthusiasts — deductive reasoning meets chemistry knowledge.</p>
        <p>A new element is featured every day on Gamesite. Play in your browser on any device, completely free. Whether you are a chemistry student, a science teacher, or just curious about the elements, Periodic Puzzle makes learning the periodic table genuinely fun.</p>

        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">How to Play</h2>
        <ol className="list-decimal list-inside space-y-1">
          <li>Type the name of any element and submit your guess.</li>
          <li>After each guess, five comparison clues are revealed: atomic number (higher/lower), period, group, element category, and state at room temperature.</li>
          <li>Green means your guess matches the answer for that property. Arrows mean the answer is higher or lower.</li>
          <li>Use the clues to narrow down which element it could be. You have six guesses.</li>
          <li>Identify the mystery element in as few guesses as possible.</li>
        </ol>

        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">Tips &amp; Strategy</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Start with an element near the middle of the table — something like Iron (26) or Copper (29) — to quickly narrow the range.</li>
          <li>The category clue is extremely valuable. If your guess shows the same category, you know the answer is the same type (e.g., transition metal, noble gas).</li>
          <li>Use period and group clues together to pinpoint a region of the table. Period tells you the row, group tells you the column.</li>
          <li>Remember that most elements are solids at room temperature. If the state clue shows gas, you are likely looking at a noble gas or a few nonmetals.</li>
          <li>Play daily to reinforce your periodic table knowledge. You will be surprised how quickly you memorize element positions and properties.</li>
        </ul>
      </section>
    </main>
  );
}
