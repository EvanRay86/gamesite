import Link from "next/link";
import MathlerGame from "@/components/MathlerGame";
import MoreDailyGames from "@/components/MoreDailyGames";
import GameJsonLd from "@/components/seo/GameJsonLd";
import { getMathlerPuzzle, getTodayDate } from "@/lib/mathler-puzzles";
import { buildGameMetadata } from "@/lib/seo";

export const revalidate = 60;

export const metadata = buildGameMetadata({
  title: "Mathler",
  description:
    "Find the hidden math equation that equals the target number. 6 guesses, 6 characters.",
  path: "daily/mathler",
});

export default function MathlerPage() {
  const today = getTodayDate();
  const puzzle = getMathlerPuzzle(today);

  return (
    <main>
      <GameJsonLd name="Mathler" description="Find the hidden math equation that equals the target number. 6 guesses, 6 characters." path="daily/mathler" category="daily" />
      <MathlerGame puzzle={puzzle} date={today} />
      <div className="flex justify-center py-6">
        <Link
          href="/daily/mathler/archive"
          className="inline-flex items-center gap-2 rounded-full bg-teal px-6 py-3 text-sm font-semibold text-white shadow-md hover:brightness-90 hover:shadow-lg active:scale-95 transition-all no-underline"
        >
          Play past puzzles &rarr;
        </Link>
      </div>
      <MoreDailyGames currentSlug="mathler" />
    </main>
  );
}
