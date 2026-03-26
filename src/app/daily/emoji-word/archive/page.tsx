import Link from "next/link";
import {
  getEmojiWordArchiveDates,
  getTodayDate,
} from "@/lib/emoji-word-puzzles";

export const revalidate = 3600;

export const metadata = {
  title: "Emoji Decoder Archive — Gamesite",
  description: "Play past Emoji Decoder puzzles.",
};

export default async function EmojiWordArchivePage() {
  let dates = await getEmojiWordArchiveDates();

  // Fallback: generate dates from seed data if Supabase isn't configured
  if (dates.length === 0) {
    const today = new Date(getTodayDate());
    dates = Array.from({ length: 10 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      return { puzzle_date: d.toISOString().split("T")[0] };
    });
  }

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-[520px]">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-3xl text-text-primary">
            Emoji Decoder Archive
          </h1>
          <Link
            href="/daily/emoji-word"
            className="text-text-muted text-sm hover:text-text-secondary transition-colors no-underline"
          >
            &larr; Today&apos;s Puzzle
          </Link>
        </div>

        <div className="space-y-2">
          {dates.map(({ puzzle_date }) => {
            const d = new Date(puzzle_date + "T00:00:00");
            const label = d.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            });

            return (
              <Link
                key={puzzle_date}
                href={`/daily/emoji-word/archive/${puzzle_date}`}
                className="block bg-surface border border-border rounded-xl p-4
                           hover:bg-surface-hover hover:border-border-light
                           transition-all no-underline group"
              >
                <div className="text-text-primary font-semibold group-hover:text-amber transition-colors">
                  {label}
                </div>
                <div className="text-text-dim text-xs mt-1">{puzzle_date}</div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
