import Link from "next/link";
import Top5Game from "@/components/Top5Game";
import MoreDailyGames from "@/components/MoreDailyGames";
import GameJsonLd from "@/components/seo/GameJsonLd";
import {
  getTop5PuzzleByDate,
  getTodayDate,
  getFallbackTop5Puzzle,
} from "@/lib/top5-puzzles";
import { buildGameMetadata } from "@/lib/seo";

export const revalidate = 60;

export const metadata = buildGameMetadata({
  title: "Play Top 5 Online Free — Daily Ranking Game",
  description:
    "Play Top 5 today — rank five items in the correct order. A free daily trivia and ranking game you can play in your browser.",
  path: "daily/top-5",
  color: "amber",
});

export default async function Top5Page() {
  const today = getTodayDate();

  let puzzle = await getTop5PuzzleByDate(today);

  if (!puzzle) {
    puzzle = getFallbackTop5Puzzle(today);
  }

  return (
    <main>
      <GameJsonLd name="Top 5" description="Rank five items in the correct order. A new challenge every day." path="daily/top-5" category="daily" />
      <Top5Game puzzle={puzzle} />
      <div className="flex flex-wrap justify-center gap-3 py-6">
        <Link
          href="/daily/top-5/archive"
          className="inline-flex items-center gap-2 rounded-full bg-amber px-6 py-3 text-sm font-semibold text-white shadow-md hover:brightness-90 hover:shadow-lg active:scale-95 transition-all no-underline"
        >
          Play past puzzles &rarr;
        </Link>
        <Link
          href="/daily/top-5/hints"
          className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-6 py-3 text-sm font-semibold text-zinc-600 shadow-sm hover:bg-zinc-50 hover:shadow-md active:scale-95 transition-all no-underline dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          Need a hint?
        </Link>
      </div>
      <MoreDailyGames currentSlug="top-5" />

      <section className="mx-auto max-w-2xl px-4 pb-12 text-sm text-zinc-500 dark:text-zinc-400 space-y-3">
        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          What is Top 5?
        </h2>
        <p>
          Top 5 is a daily ranking game that tests your general knowledge. You are
          given a category and five items — your challenge is to drag them into the
          correct order from first to fifth. Categories range from geography and
          science to sports and pop culture, so every day brings a new surprise.
        </p>
        <p>
          A new Top 5 challenge is published every day on Gamesite. Play for free
          in your browser on any device. It is a quick, satisfying puzzle that
          rewards broad knowledge and smart estimation.
        </p>

        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          How to Play
        </h2>
        <ol className="list-decimal list-inside space-y-1">
          <li>Read the category — it tells you what the items are ranked by.</li>
          <li>Drag and drop the five items into what you believe is the correct order.</li>
          <li>Submit your ranking when you are confident.</li>
          <li>Correct placements are highlighted. Closer guesses score better.</li>
          <li>Try to get a perfect score by ranking all five correctly.</li>
        </ol>

        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          Tips &amp; Strategy
        </h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Start with the items you are most certain about — anchoring the top and bottom makes the middle easier.</li>
          <li>Use estimation and comparison. Even if you do not know exact values, you can often reason about relative order.</li>
          <li>Pay close attention to the category wording — &quot;most populated&quot; vs &quot;largest by area&quot; gives very different answers.</li>
          <li>If two items feel close, go with your first instinct. Second-guessing often makes things worse.</li>
          <li>The more you play, the better your general knowledge becomes — Top 5 is as educational as it is fun.</li>
        </ul>
      </section>
    </main>
  );
}
