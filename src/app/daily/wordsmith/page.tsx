import Link from "next/link";
import WordsmithModeSelect from "@/components/WordsmithModeSelect";
import MoreDailyGames from "@/components/MoreDailyGames";

export const metadata = {
  title: "Wordsmith — Gamesite",
  description:
    "Forge words through five rounds, collect power-ups, and chase the daily high score.",
};

export default function WordsmithPage() {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <main>
      <WordsmithModeSelect dateStr={today} />
      <div className="flex justify-center py-6">
        <Link
          href="/daily/wordsmith/archive"
          className="text-text-muted text-sm hover:text-amber transition-colors no-underline"
        >
          Play past puzzles &rarr;
        </Link>
      </div>
      <MoreDailyGames currentSlug="wordsmith" />
    </main>
  );
}
