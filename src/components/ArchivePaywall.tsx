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
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal via-teal/90 to-sky p-[1px] shadow-xl shadow-teal/15 mb-6">
            {/* Inner card */}
            <div className="relative rounded-[15px] bg-gradient-to-br from-teal via-teal/95 to-sky px-6 py-7 text-center">
              {/* Decorative rings */}
              <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full border border-white/10" />
              <div className="pointer-events-none absolute -left-6 -bottom-6 h-24 w-24 rounded-full border border-white/10" />

              {/* Badge */}
              <span className="inline-block rounded-full bg-white/15 backdrop-blur-sm px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/90 mb-3">
                Subscriber Perk
              </span>

              <h2 className="text-xl font-bold text-white mb-1.5">
                Unlock the full archive
              </h2>
              <p className="text-white/70 text-sm mb-5">
                Everything included for just <span className="font-semibold text-white">$3/month</span>
              </p>

              {/* Perks list */}
              <ul className="space-y-2.5 text-left max-w-[280px] mx-auto mb-6">
                {[
                  `All past ${gameName} puzzles`,
                  "Archives for every game",
                  "New puzzles added daily",
                ].map((perk) => (
                  <li key={perk} className="flex items-start gap-2.5 text-sm text-white/90">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {perk}
                  </li>
                ))}
              </ul>

              <Link
                href="/subscribe"
                className="inline-flex items-center justify-center bg-white text-teal font-bold rounded-full
                           px-8 py-3 text-sm no-underline shadow-lg shadow-black/10
                           hover:shadow-xl hover:scale-[1.03] active:scale-[0.98] transition-all duration-200"
              >
                Subscribe to unlock
                <svg className="ml-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
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
