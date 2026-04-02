import Link from "next/link";
import WordBloomGame from "@/components/WordBloomGame";
import { isUserSubscribed } from "@/lib/check-subscription";
import { generateQuickplayPuzzle } from "@/lib/word-bloom-puzzles";

export const metadata = {
  title: "Word Bloom Quickplay — Gamesite",
  description:
    "Play unlimited Word Bloom puzzles — a fresh random bloom every time.",
};

export default async function WordBloomQuickplayPage() {
  const subscribed = await isUserSubscribed();

  if (!subscribed) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="mb-6">
            <Link
              href="/daily/word-bloom"
              className="rounded-full px-4 py-1.5 text-sm font-medium bg-surface hover:bg-surface-hover text-text-muted hover:text-text-primary transition-colors no-underline"
            >
              &larr; Today&apos;s Puzzle
            </Link>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green via-green/90 to-teal p-[1px] shadow-xl shadow-green/15">
            <div className="relative rounded-[15px] bg-gradient-to-br from-green via-green/95 to-teal px-6 py-7 text-center">
              <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full border border-white/10" />
              <div className="pointer-events-none absolute -left-6 -bottom-6 h-24 w-24 rounded-full border border-white/10" />

              <span className="inline-block rounded-full bg-white/15 backdrop-blur-sm px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/90 mb-3">
                Subscriber Perk
              </span>

              <div className="mb-3 text-4xl">{"\uD83C\uDF3B"}</div>

              <h2 className="text-xl font-bold text-white mb-1.5">
                Word Bloom Quickplay
              </h2>
              <p className="text-white/70 text-sm mb-5">
                Unlimited random puzzles for just{" "}
                <span className="font-semibold text-white">$3/month</span>
              </p>

              <ul className="space-y-2.5 text-left max-w-[280px] mx-auto mb-6">
                {[
                  "Fresh random letters every time",
                  "Endless mode after every round",
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
                className="inline-flex items-center justify-center bg-white text-green font-bold rounded-full
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

  const puzzle = generateQuickplayPuzzle();

  return (
    <main>
      <WordBloomGame puzzle={puzzle} mode="quickplay" />
      <div className="flex justify-center py-4">
        <Link
          href="/daily/word-bloom"
          className="rounded-full px-4 py-1.5 text-sm font-medium bg-surface hover:bg-surface-hover text-text-muted hover:text-text-primary transition-colors no-underline"
        >
          &larr; Today&apos;s daily puzzle
        </Link>
      </div>
    </main>
  );
}
