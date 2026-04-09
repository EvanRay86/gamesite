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
          every wrong answer, a longer clip is revealed — starting from just one
          second and growing to sixteen seconds by your final attempt. Think of it
          as Wordle for music lovers.
        </p>
        <p>
          Play Heardle online every day on Gamesite — no app download needed.
          Challenge your friends, share your score, and explore genre variants
          like Heardle Pop, Heardle Rock, Heardle Hip-Hop, Heardle Country, and
          Heardle R&amp;B. Each variant features songs from its genre, so you can
          test your expertise in the music you know best.
        </p>

        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          How to Play Heardle
        </h2>
        <ol className="list-decimal list-inside space-y-1">
          <li>Press play to hear the opening seconds of a song.</li>
          <li>Type the song title or artist to make your guess.</li>
          <li>If wrong, a longer clip is revealed — each round adds more seconds.</li>
          <li>You have six total guesses. You can also skip a guess to hear more.</li>
          <li>Guess correctly in as few tries as possible to get the best score.</li>
        </ol>

        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          Tips &amp; Strategy
        </h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Focus on the very first notes — distinctive intros, drum patterns, or synth sounds can identify a song instantly.</li>
          <li>If the intro is not familiar, listen for the tempo and genre to narrow your options before guessing.</li>
          <li>Use the skip button strategically. Sometimes one more second of audio is more valuable than a random guess.</li>
          <li>Play the genre variants to practice in your area of expertise — it is easier to recognize songs you already love.</li>
          <li>Songs span multiple decades, so do not assume everything is recent. Classic hits appear frequently.</li>
        </ul>
      </section>
    </main>
  );
}
