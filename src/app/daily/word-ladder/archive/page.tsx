import Link from "next/link";
import {
  getWordLadderArchiveDates,
  getTodayDate,
  getSeedPuzzleCount,
} from "@/lib/word-ladder-puzzles";

export const revalidate = 3600;

export const metadata = {
  title: "Word Ladder Archive — Gamesite",
  description: "Play past Word Ladder puzzles.",
};

export default async function WordLadderArchivePage() {
  let dates = await getWordLadderArchiveDates();

  // Fallback: generate dates from seed data if Supabase isn't configured
  if (dates.length === 0) {
    const today = new Date(getTodayDate());
    dates = Array.from({ length: getSeedPuzzleCount() }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      return { puzzle_date: d.toISOString().split("T")[0] };
    });
  }

  // Paywall: only today's puzzle is free; archive requires subscription
  const todayStr = getTodayDate();
  const freeDates = dates.filter((d) => d.puzzle_date === todayStr);
  const lockedDates = dates.filter((d) => d.puzzle_date !== todayStr);

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-[520px]">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-3xl text-text-primary">
            Word Ladder Archive
          </h1>
          <Link
            href="/daily/word-ladder"
            className="text-text-muted text-sm hover:text-text-secondary transition-colors no-underline"
          >
            &larr; Today&apos;s Puzzle
          </Link>
        </div>

        {/* Free: today's puzzle */}
        {freeDates.length > 0 && (
          <div className="space-y-2 mb-6">
            {freeDates.map(({ puzzle_date }) => {
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
                  href={`/daily/word-ladder/archive/${puzzle_date}`}
                  className="block bg-surface border border-border rounded-xl p-4
                             hover:bg-surface-hover hover:border-border-light
                             transition-all no-underline group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-text-primary font-semibold group-hover:text-teal transition-colors">
                        {label}
                      </div>
                      <div className="text-text-dim text-xs mt-1">
                        {puzzle_date}
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-green bg-green/10 rounded-full px-3 py-1">
                      Free
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Paywall banner */}
        {lockedDates.length > 0 && (
          <>
            <div className="relative rounded-2xl bg-gradient-to-br from-teal via-teal to-sky p-6 text-center text-white shadow-lg shadow-teal/20 mb-6">
              <h2 className="text-lg font-bold mb-1">
                Unlock the full archive
              </h2>
              <p className="text-white/80 text-sm max-w-sm mx-auto mb-4">
                Subscribe for $6/month to play all past Word Ladder puzzles,
                plus archives for every game.
              </p>
              <Link
                href="/subscribe"
                className="inline-block bg-white text-teal font-bold rounded-full px-6 py-2.5 text-sm no-underline
                           hover:shadow-lg hover:scale-105 transition-all duration-200"
              >
                Subscribe to unlock
              </Link>
            </div>

            {/* Locked dates (visible but not clickable) */}
            <div className="space-y-2 opacity-60">
              {lockedDates.map(({ puzzle_date }) => {
                const d = new Date(puzzle_date + "T00:00:00");
                const label = d.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                });
                return (
                  <div
                    key={puzzle_date}
                    className="block bg-surface border border-border rounded-xl p-4 cursor-not-allowed"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-text-primary font-semibold">
                          {label}
                        </div>
                        <div className="text-text-dim text-xs mt-1">
                          {puzzle_date}
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-amber bg-amber/10 rounded-full px-3 py-1">
                        Subscribers only
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
