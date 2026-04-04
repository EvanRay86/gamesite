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
      <div className="flex justify-center py-6">
        <Link
          href="/daily/framed/archive"
          className="inline-flex items-center gap-2 rounded-full bg-coral px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-coral-dark hover:shadow-lg active:scale-95 transition-all no-underline"
        >
          Play past puzzles &rarr;
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
          answer reveals a new frame, making it progressively easier.
        </p>
        <p>
          Play Framed online every day on Gamesite — no app download needed.
          Test your film knowledge, share your results, and explore genre
          variants like Framed Horror, Framed Animation, and more.
        </p>
      </section>
    </main>
  );
}
