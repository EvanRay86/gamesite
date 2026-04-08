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
    </main>
  );
}
