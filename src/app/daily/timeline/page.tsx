import Link from "next/link";
import TimelineGame from "@/components/TimelineGame";
import MoreDailyGames from "@/components/MoreDailyGames";
import {
  getTimelinePuzzleByDate,
  getTodayDate,
  getFallbackTimelinePuzzle,
} from "@/lib/timeline-puzzles";

export const revalidate = 60;

export const metadata = {
  title: "Timeline — Gamesite",
  description: "Put five events in chronological order. A new challenge every day.",
};

export default async function TimelinePage() {
  const today = getTodayDate();

  let puzzle = await getTimelinePuzzleByDate(today);

  if (!puzzle) {
    puzzle = getFallbackTimelinePuzzle(today);
  }

  return (
    <main>
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
