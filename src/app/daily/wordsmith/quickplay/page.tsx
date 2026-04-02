import Link from "next/link";
import WordsmithGame from "@/components/WordsmithGame";
import { isUserSubscribed } from "@/lib/check-subscription";

export const metadata = {
  title: "Wordsmith Quickplay — Gamesite",
  description:
    "Play unlimited Wordsmith puzzles — a fresh random game every time.",
};

export default async function WordsmithQuickplayPage() {
  const subscribed = await isUserSubscribed();

  if (!subscribed) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Back link */}
          <div className="mb-6">
            <Link
              href="/daily/wordsmith"
              className="rounded-full px-4 py-1.5 text-sm font-medium bg-surface hover:bg-surface-hover text-text-muted hover:text-text-primary transition-colors no-underline"
            >
              &larr; Today&apos;s Puzzle
            </Link>
          </div>

          {/* Paywall card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal via-teal/90 to-sky p-[1px] shadow-xl shadow-teal/15">
            <div className="relative rounded-[15px] bg-gradient-to-br from-teal via-teal/95 to-sky px-6 py-7 text-center">
              {/* Decorative rings */}
              <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full border border-white/10" />
              <div className="pointer-events-none absolute -left-6 -bottom-6 h-24 w-24 rounded-full border border-white/10" />

              {/* Badge */}
              <span className="inline-block rounded-full bg-white/15 backdrop-blur-sm px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/90 mb-3">
                Subscriber Perk
              </span>

              <div className="mb-3 text-4xl">{"\u2692\uFE0F"}</div>

              <h2 className="text-xl font-bold text-white mb-1.5">
                Wordsmith Quickplay
              </h2>
              <p className="text-white/70 text-sm mb-5">
                Unlimited random puzzles for just{" "}
                <span className="font-semibold text-white">$3/month</span>
              </p>

              <ul className="space-y-2.5 text-left max-w-[280px] mx-auto mb-6">
                {[
                  "Fresh random puzzle every time",
                  "Full Wordsmith archive access",
                  "Archives for every game",
                ].map((perk) => (
                  <li
                    key={perk}
                    className="flex items-start gap-2.5 text-sm text-white/90"
                  >
                    <svg
                      className="mt-0.5 h-4 w-4 shrink-0 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                      />
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
                <svg
                  className="ml-1.5 h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <main>
      <WordsmithGame dateStr={today} mode="quickplay" />
    </main>
  );
}
