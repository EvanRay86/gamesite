import Link from "next/link";

interface ArchiveDate {
  puzzle_date: string;
}

interface ArchivePaywallProps {
  dates: ArchiveDate[];
  todayDate: string;
  gameName: string;
  gameSlug: string;
  gameColor: string;
  todayHref: string;
  isSubscriber: boolean;
}

export default function ArchivePaywall({
  dates,
  todayDate,
  gameName,
  gameSlug,
  gameColor,
  todayHref,
  isSubscriber,
}: ArchivePaywallProps) {
  const freeDates = dates.filter((d) => d.puzzle_date === todayDate);
  const pastDates = dates.filter((d) => d.puzzle_date !== todayDate);

  const hoverColor = `group-hover:${gameColor}`;

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-[520px]">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-3xl text-text-primary">
            {gameName} Archive
          </h1>
          <Link
            href={todayHref}
            className="text-text-muted text-sm hover:text-text-secondary transition-colors no-underline"
          >
            &larr; Today&apos;s Puzzle
          </Link>
        </div>

        {/* Free: today's puzzle */}
        {freeDates.length > 0 && (
          <div className="space-y-2 mb-6">
            {freeDates.map(({ puzzle_date }) => (
              <DateLink
                key={puzzle_date}
                puzzleDate={puzzle_date}
                href={`/daily/${gameSlug}/archive/${puzzle_date}`}
                hoverColor={hoverColor}
                badge={<span className="text-xs font-semibold text-green bg-green/10 rounded-full px-3 py-1">Free</span>}
              />
            ))}
          </div>
        )}

        {/* Past dates */}
        {pastDates.length > 0 && !isSubscriber && (
          <div className="relative rounded-2xl bg-gradient-to-br from-teal via-teal to-sky p-6 text-center text-white shadow-lg shadow-teal/20 mb-6">
            <h2 className="text-lg font-bold mb-1">Unlock the full archive</h2>
            <p className="text-white/80 text-sm max-w-sm mx-auto mb-4">
              Subscribe for $6/month to play all past {gameName} puzzles,
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
        )}

        {pastDates.length > 0 && (
          <div className={`space-y-2 ${!isSubscriber ? "opacity-60" : ""}`}>
            {pastDates.map(({ puzzle_date }) =>
              isSubscriber ? (
                <DateLink
                  key={puzzle_date}
                  puzzleDate={puzzle_date}
                  href={`/daily/${gameSlug}/archive/${puzzle_date}`}
                  hoverColor={hoverColor}
                />
              ) : (
                <LockedDate key={puzzle_date} puzzleDate={puzzle_date} />
              ),
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function DateLink({
  puzzleDate,
  href,
  hoverColor,
  badge,
}: {
  puzzleDate: string;
  href: string;
  hoverColor: string;
  badge?: React.ReactNode;
}) {
  const d = new Date(puzzleDate + "T00:00:00");
  const label = d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Link
      href={href}
      className="block bg-surface border border-border rounded-xl p-4
                 hover:bg-surface-hover hover:border-border-light
                 transition-all no-underline group"
    >
      <div className="flex items-center justify-between">
        <div>
          <div className={`text-text-primary font-semibold ${hoverColor} transition-colors`}>
            {label}
          </div>
          <div className="text-text-dim text-xs mt-1">{puzzleDate}</div>
        </div>
        {badge}
      </div>
    </Link>
  );
}

function LockedDate({ puzzleDate }: { puzzleDate: string }) {
  const d = new Date(puzzleDate + "T00:00:00");
  const label = d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="block bg-surface border border-border rounded-xl p-4 cursor-not-allowed">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-text-primary font-semibold">{label}</div>
          <div className="text-text-dim text-xs mt-1">{puzzleDate}</div>
        </div>
        <span className="text-xs font-semibold text-amber bg-amber/10 rounded-full px-3 py-1">
          Subscribers only
        </span>
      </div>
    </div>
  );
}
