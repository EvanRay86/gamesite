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
          className="inline-flex items-center gap-2 rounded-full bg-amber px-6 py-3 text-sm font-semibold text-white shadow-md hover:brightness-90 hover:shadow-lg active:scale-95 transition-all no-underline"
        >
          Play past puzzles &rarr;
        </Link>
      </div>
      <MoreDailyGames currentSlug="wordsmith" />
    </main>
  );
}
