import Link from "next/link";
import type { HintSet, HintLevel } from "@/types/hints";
import { getGameBySlug } from "@/lib/game-registry";

const levelLabels: Record<HintLevel, string> = {
  mild: "Mild Hints",
  medium: "Medium Hints",
  strong: "Strong Hints",
};

const levelDescriptions: Record<HintLevel, string> = {
  mild: "General direction without giving much away",
  medium: "Narrows things down — some specifics revealed",
  strong: "Almost there — use these if you're really stuck",
};

const colorMap: Record<string, { bg: string; text: string; border: string; accent: string }> = {
  coral: { bg: "bg-red-50 dark:bg-red-950/30", text: "text-red-700 dark:text-red-300", border: "border-red-200 dark:border-red-800", accent: "bg-red-500" },
  teal: { bg: "bg-teal-50 dark:bg-teal-950/30", text: "text-teal-700 dark:text-teal-300", border: "border-teal-200 dark:border-teal-800", accent: "bg-teal-500" },
  sky: { bg: "bg-sky-50 dark:bg-sky-950/30", text: "text-sky-700 dark:text-sky-300", border: "border-sky-200 dark:border-sky-800", accent: "bg-sky-500" },
  amber: { bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-700 dark:text-amber-300", border: "border-amber-200 dark:border-amber-800", accent: "bg-amber-500" },
  purple: { bg: "bg-purple-50 dark:bg-purple-950/30", text: "text-purple-700 dark:text-purple-300", border: "border-purple-200 dark:border-purple-800", accent: "bg-purple-500" },
  green: { bg: "bg-green-50 dark:bg-green-950/30", text: "text-green-700 dark:text-green-300", border: "border-green-200 dark:border-green-800", accent: "bg-green-500" },
};

export default function HintsPageContent({ hintSet }: { hintSet: HintSet }) {
  const game = getGameBySlug(hintSet.gameSlug);
  const color = colorMap[game?.color ?? "coral"] ?? colorMap.coral;

  const d = new Date(hintSet.date + "T00:00:00");
  const formatted = d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const levels: HintLevel[] = ["mild", "medium", "strong"];

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-3xl">
          {hintSet.gameName} Hints
        </h1>
        <p className="mt-1 text-zinc-500 dark:text-zinc-400">{formatted}</p>
        <Link
          href={`/daily/${hintSet.gameSlug}`}
          className={`mt-4 inline-flex items-center gap-2 rounded-full ${color.accent} px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg active:scale-95 transition-all no-underline`}
        >
          Play today&apos;s puzzle &rarr;
        </Link>
        <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
          Stuck on today&apos;s {hintSet.gameName}? We provide three levels of
          progressive hints so you can get just the right amount of help without
          spoiling the answer.
        </p>
      </div>

      {/* Hint Sections */}
      {levels.map((level, i) => {
        const hintsForLevel = hintSet.hints.filter((h) => h.level === level);
        if (hintsForLevel.length === 0) return null;

        return (
          <details key={level} open={i === 0} className="mb-4">
            <summary
              className={`cursor-pointer select-none rounded-lg border ${color.border} ${color.bg} px-4 py-3 text-base font-semibold ${color.text} transition-colors hover:opacity-80`}
            >
              {levelLabels[level]}{" "}
              <span className="text-sm font-normal opacity-70">
                — {levelDescriptions[level]}
              </span>
            </summary>
            <div className="mt-2 space-y-2 pl-1">
              {hintsForLevel.map((hint, j) => (
                <div
                  key={j}
                  className="rounded-md border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  {hint.text}
                </div>
              ))}
            </div>
          </details>
        );
      })}

      {/* About Hints */}
      <section className="mt-8 mb-6 text-sm text-zinc-500 dark:text-zinc-400 space-y-2">
        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          About {hintSet.gameName} Hints
        </h2>
        <p>
          Our hints are designed to preserve the puzzle-solving experience. Start
          with a mild hint for a gentle nudge, move to medium if you need more
          direction, and use the strong hints only when you&apos;re truly stuck. We
          never reveal the full answer — the goal is to help you get unstuck
          while keeping the satisfaction of solving it yourself.
        </p>
        <p>
          New hints are published every day alongside each {hintSet.gameName}{" "}
          puzzle. Bookmark this page to check back whenever you need a hand.
        </p>
      </section>

      {/* FAQ Section */}
      <section className="mt-10 space-y-4">
        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          Frequently Asked Questions
        </h2>
        {hintSet.faqs.map((faq, i) => (
          <details key={i} className="group">
            <summary className="cursor-pointer text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200">
              {faq.question}
            </summary>
            <p className="mt-1 pl-4 text-sm text-zinc-500 dark:text-zinc-400">
              {faq.answer}
            </p>
          </details>
        ))}
      </section>

      {/* Bottom links */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm">
        <Link
          href={`/daily/${hintSet.gameSlug}`}
          className="text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          Play {hintSet.gameName}
        </Link>
        <Link
          href={`/daily/${hintSet.gameSlug}/archive`}
          className="text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          Past puzzles
        </Link>
        <Link
          href="/daily"
          className="text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          All daily games
        </Link>
      </div>
    </div>
  );
}
