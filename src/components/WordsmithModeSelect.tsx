"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import WordsmithGame from "@/components/WordsmithGame";
import { getDayNumber } from "@/lib/wordsmith-engine";

interface Props {
  dateStr: string;
}

export default function WordsmithModeSelect({ dateStr }: Props) {
  const [selection, setSelection] = useState<"menu" | "daily">("menu");
  const [dailyCompleted, setDailyCompleted] = useState(false);
  const dayNumber = getDayNumber(dateStr);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`wordsmith-${dateStr}`);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved.phase === "results") {
          setDailyCompleted(true);
        }
      }
    } catch {
      /* ignore */
    }
  }, [dateStr]);

  // If they chose daily, render the game directly
  if (selection === "daily") {
    return <WordsmithGame dateStr={dateStr} />;
  }

  // Mode selection menu
  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center p-4">
      <div className="clay-card mx-auto w-full max-w-md animate-[fade-up_0.5s_ease_forwards] p-8 text-center">
        <div className="mb-2 text-5xl">{"\u2692\uFE0F"}</div>
        <h1 className="font-display mb-2 text-3xl font-bold text-amber">
          WORDSMITH
        </h1>
        <p className="text-text-secondary mb-6 text-sm leading-relaxed">
          Form the best word from 7 letters across 5 rounds.
          <br />
          Collect power-ups that stack and synergize.
        </p>

        <div className="flex flex-col gap-3">
          {/* Daily Puzzle */}
          <button
            onClick={() => setSelection("daily")}
            className="group relative w-full rounded-xl bg-amber px-6 py-4 text-left text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">
                  Daily Puzzle
                </p>
                <p className="text-xs text-white/70">
                  Day #{dayNumber}
                  {dailyCompleted && " \u00b7 Completed"}
                </p>
              </div>
              <svg
                className="h-5 w-5 text-white/70 transition-transform group-hover:translate-x-0.5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 4.5l7.5 7.5-7.5 7.5"
                />
              </svg>
            </div>
          </button>

          {/* Quickplay */}
          <Link
            href="/daily/wordsmith/quickplay"
            className="group relative w-full rounded-xl border-2 border-amber px-6 py-4 text-left no-underline transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-amber">
                  Quickplay
                </p>
                <p className="text-xs text-text-secondary">
                  Unlimited random puzzles
                </p>
              </div>
              <svg
                className="h-5 w-5 text-amber/70 transition-transform group-hover:translate-x-0.5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 4.5l7.5 7.5-7.5 7.5"
                />
              </svg>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
