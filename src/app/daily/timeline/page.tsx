import Link from "next/link";
import TimelineGame from "@/components/TimelineGame";
import MoreDailyGames from "@/components/MoreDailyGames";
import GameJsonLd from "@/components/seo/GameJsonLd";
import {
  getTimelinePuzzleByDate,
  getTodayDate,
  getFallbackTimelinePuzzle,
} from "@/lib/timeline-puzzles";
import { buildGameMetadata } from "@/lib/seo";

export const revalidate = 60;

export const metadata = buildGameMetadata({
  title: "Timeline",
  description: "Put five events in chronological order. A new challenge every day.",
  path: "daily/timeline",
});

export default async function TimelinePage() {
  const today = getTodayDate();

  let puzzle = await getTimelinePuzzleByDate(today);

  if (!puzzle) {
    puzzle = getFallbackTimelinePuzzle(today);
  }

  return (
    <main>
      <GameJsonLd name="Timeline" description="Put five events in chronological order. A new challenge every day." path="daily/timeline" category="daily" />
      <TimelineGame puzzle={puzzle} />
      <div className="flex justify-center py-6">
        <Link
          href="/daily/timeline/archive"
          className="inline-flex items-center gap-2 rounded-full bg-teal px-6 py-3 text-sm font-semibold text-white shadow-md hover:brightness-90 hover:shadow-lg active:scale-95 transition-all no-underline"
        >
          Play past puzzles &rarr;
        </Link>
      </div>
      <MoreDailyGames currentSlug="timeline" />
    </main>
  );
}
