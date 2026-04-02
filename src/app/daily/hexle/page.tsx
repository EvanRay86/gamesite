import Link from "next/link";
import HexleGame from "@/components/HexleGame";
import MoreDailyGames from "@/components/MoreDailyGames";
import GameJsonLd from "@/components/seo/GameJsonLd";
import { getHexlePuzzle, getFallbackHexleWord } from "@/lib/hexle-words";
import { buildGameMetadata } from "@/lib/seo";

export const revalidate = 60;

export const metadata = buildGameMetadata({
  title: "Hexle",
  description:
    "Seven guesses to crack the six-letter word. A new puzzle every day.",
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
      <div className="flex justify-center py-6">
        <Link
          href="/daily/hexle/archive"
          className="inline-flex items-center gap-2 rounded-full bg-amber px-6 py-3 text-sm font-semibold text-white shadow-md hover:brightness-90 hover:shadow-lg active:scale-95 transition-all no-underline"
        >
          Play past puzzles &rarr;
        </Link>
      </div>
      <MoreDailyGames currentSlug="hexle" />
    </main>
  );
}
