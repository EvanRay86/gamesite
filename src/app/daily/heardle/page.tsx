import Link from "next/link";
import HeardleGame from "@/components/HeardleGame";
import MoreDailyGames from "@/components/MoreDailyGames";
import GameJsonLd from "@/components/seo/GameJsonLd";
import { getHeardlePuzzleAsync, getTodayDate } from "@/lib/heardle-puzzles";
import { buildGameMetadata } from "@/lib/seo";

export const revalidate = 60;

export const metadata = buildGameMetadata({
  title: "Play Heardle Online Free — Guess the Song",
  description:
    "Play Heardle today — listen to the opening seconds of a song and guess the title in 6 tries. A free daily music guessing game, no download required.",
  path: "daily/heardle",
  color: "purple",
});

export default async function HeardlePage() {
  const today = getTodayDate();
  const puzzle = await getHeardlePuzzleAsync(today, "all");

  return (
    <main>
      <GameJsonLd name="Heardle" description="Play Heardle today — listen to the opening seconds of a song and guess the title in 6 tries. A free daily music guessing game." path="daily/heardle" category="daily" />
      <HeardleGame puzzle={puzzle} variant="all" />
      <div className="flex flex-wrap justify-center gap-3 py-6">
        <Link
          href="/daily/heardle/archive"
          className="inline-flex items-center gap-2 rounded-full bg-coral px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-coral-dark hover:shadow-lg active:scale-95 transition-all no-underline"
        >
          Play past puzzles &rarr;
        </Link>
        <Link
          href="/daily/heardle/hints"
          className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-6 py-3 text-sm font-semibold text-zinc-600 shadow-sm hover:bg-zinc-50 hover:shadow-md active:scale-95 transition-all no-underline dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          Need a hint?
        </Link>
      </div>
      <MoreDailyGames currentSlug="heardle" />

      <section className="mx-auto max-w-2xl px-4 pb-12 text-sm text-zinc-500 dark:text-zinc-400 space-y-3">
        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          What is Heardle?
        </h2>
        <p>
          Heardle is a free daily music guessing game. Each day you hear the
          opening seconds of a song and try to name it in six guesses. With
          every wrong answer, a longer clip is revealed. Think of it as Wordle
          for music lovers.
        </p>
        <p>
          Play Heardle online every day on Gamesite — no app download needed.
          Challenge your friends, share your score, and explore genre variants
          like Heardle Pop, Heardle Rap, and more.
        </p>
      </section>
    </main>
  );
}
