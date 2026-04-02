import Link from "next/link";
import FramedGame from "@/components/FramedGame";
import MoreDailyGames from "@/components/MoreDailyGames";
import GameJsonLd from "@/components/seo/GameJsonLd";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import { getFramedPuzzleAsync, getTodayDate } from "@/lib/framed-puzzles";
import { buildGameMetadata } from "@/lib/seo";

export const revalidate = 60;

export const metadata = buildGameMetadata({
  title: "Framed",
  description: "Guess the movie one frame at a time. 6 frames, 6 guesses.",
  path: "daily/framed",
});

export default async function FramedPage() {
  const today = getTodayDate();
  const puzzle = await getFramedPuzzleAsync(today, "all");

  return (
    <main>
      <GameJsonLd name="Framed" description="Guess the movie one frame at a time. 6 frames, 6 guesses." path="daily/framed" category="daily" />
      <Breadcrumbs crumbs={[
        { label: "Home", href: "/" },
        { label: "Daily", href: "/daily" },
        { label: "Framed" },
      ]} />
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
    </main>
  );
}
