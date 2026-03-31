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
          className="text-text-muted text-sm hover:text-teal transition-colors no-underline"
        >
          Play past puzzles &rarr;
        </Link>
      </div>
      <MoreDailyGames currentSlug="timeline" />
    </main>
  );
}
