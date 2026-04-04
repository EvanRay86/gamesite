import Link from "next/link";
import WordsmithModeSelect from "@/components/WordsmithModeSelect";
import MoreDailyGames from "@/components/MoreDailyGames";
import GameJsonLd from "@/components/seo/GameJsonLd";
import { buildGameMetadata } from "@/lib/seo";

export const metadata = buildGameMetadata({
  title: "Play Wordsmith Online Free — Daily Word Game",
  description:
    "Play Wordsmith today — forge words through five rounds, collect power-ups, and chase the daily high score. Free in your browser.",
  path: "daily/wordsmith",
  color: "amber",
});

export default function WordsmithPage() {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <main>
      <GameJsonLd name="Wordsmith" description="Forge words through five rounds, collect power-ups, and chase the daily high score." path="daily/wordsmith" category="daily" />
      <WordsmithModeSelect dateStr={today} />
      <div className="flex justify-center py-6">
        <Link
          href="/daily/wordsmith/archive"
          className="inline-flex items-center gap-2 rounded-full bg-amber px-6 py-3 text-sm font-semibold text-white shadow-md hover:brightness-90 hover:shadow-lg active:scale-95 transition-all no-underline"
        >
          Play past puzzles &rarr;
        </Link>
      </div>
      <MoreDailyGames currentSlug="wordsmith" />
    </main>
  );
}
