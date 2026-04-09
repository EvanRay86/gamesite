import Link from "next/link";
import FramedGame from "@/components/FramedGame";
import MoreDailyGames from "@/components/MoreDailyGames";
import GameJsonLd from "@/components/seo/GameJsonLd";
import { getFramedPuzzleAsync, getTodayDate } from "@/lib/framed-puzzles";
import { buildGameMetadata } from "@/lib/seo";

export const revalidate = 60;

export const metadata = buildGameMetadata({
  title: "Play Framed Online Free — Guess the Movie Game",
  description:
    "Play Framed today — guess the movie from a single frame. Get it wrong and another frame is revealed. A free daily movie guessing game, no download required.",
  path: "daily/framed",
  color: "green",
});

export default async function FramedPage() {
  const today = getTodayDate();
  const puzzle = await getFramedPuzzleAsync(today, "all");

  return (
    <main>
      <GameJsonLd name="Framed" description="Play Framed today — guess the movie from a single frame. A free daily movie guessing game." path="daily/framed" category="daily" />
      <FramedGame puzzle={puzzle} variant="all" />
      <div className="flex flex-wrap justify-center gap-3 py-6">
        <Link
          href="/daily/framed/archive"
          className="inline-flex items-center gap-2 rounded-full bg-coral px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-coral-dark hover:shadow-lg active:scale-95 transition-all no-underline"
        >
          Play past puzzles &rarr;
        </Link>
        <Link
          href="/daily/framed/hints"
          className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-6 py-3 text-sm font-semibold text-zinc-600 shadow-sm hover:bg-zinc-50 hover:shadow-md active:scale-95 transition-all no-underline dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          Need a hint?
        </Link>
      </div>
      <MoreDailyGames currentSlug="framed" />

      <section className="mx-auto max-w-2xl px-4 pb-12 text-sm text-zinc-500 dark:text-zinc-400 space-y-3">
        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          What is Framed?
        </h2>
        <p>
          Framed is a free daily movie guessing game. You are shown one frame
          from a movie and have six attempts to guess the title. Each wrong
          answer reveals a new, more recognizable frame — the first frame is
          usually obscure, while later frames show iconic scenes or well-known
          actors. It is the ultimate test for film buffs.
        </p>
        <p>
          Play Framed online every day on Gamesite — no app download needed.
          Test your film knowledge, share your results, and explore genre
          variants like Framed Action, Framed Horror, Framed Sci-Fi, and Framed
          2000s. Each variant focuses on movies from a specific genre, so you can
          play to your strengths.
        </p>

        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          How to Play Framed
        </h2>
        <ol className="list-decimal list-inside space-y-1">
          <li>A single frame from a movie is displayed.</li>
          <li>Type the movie title to make your guess.</li>
          <li>If wrong, a new frame is revealed — each one is a little more recognizable.</li>
          <li>You have six guesses total. You can also skip to reveal the next frame.</li>
          <li>Guess the movie in as few frames as possible for the best score.</li>
        </ol>

        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          Tips &amp; Strategy
        </h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Look at the color grading and visual style of the frame — period films, horror movies, and sci-fi all have distinctive looks.</li>
          <li>Check for recognizable actors, locations, or props in the frame. Even a partial face can be a giveaway.</li>
          <li>If the frame looks unfamiliar, skip to the next one. A second frame often provides dramatically more context.</li>
          <li>Play the genre variants to narrow the pool of possible movies — guessing from all movies ever is harder than guessing from just horror films.</li>
          <li>Movies span decades, so consider classics as well as recent releases. Older films appear regularly.</li>
        </ul>
      </section>
    </main>
  );
}
