"use client";

import { useState, useCallback, type ReactNode } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

const FREE_PLAYS_KEY = "meteor-mayhem-free-plays";
const MAX_FREE_PLAYS = 5;

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getPlaysToday(): number {
  try {
    const data = JSON.parse(localStorage.getItem(FREE_PLAYS_KEY) || "{}");
    return data[getTodayKey()] ?? 0;
  } catch {
    return 0;
  }
}

function incrementPlays() {
  const key = getTodayKey();
  try {
    const data = JSON.parse(localStorage.getItem(FREE_PLAYS_KEY) || "{}");
    data[key] = (data[key] ?? 0) + 1;
    // Clean up old dates
    for (const k of Object.keys(data)) {
      if (k !== key) delete data[k];
    }
    localStorage.setItem(FREE_PLAYS_KEY, JSON.stringify(data));
  } catch {
    localStorage.setItem(FREE_PLAYS_KEY, JSON.stringify({ [key]: 1 }));
  }
}

interface FreePlaysGateProps {
  creditCost: number;
  gameSlug: string;
  children: ReactNode;
  /** Called when a game starts during free play period */
  onFreePlay?: () => void;
}

export default function FreePlaysGate({ creditCost, gameSlug, children }: FreePlaysGateProps) {
  const { user, credits, loading, refreshProfile } = useAuth();
  const [playsToday, setPlaysToday] = useState(() => {
    if (typeof window === "undefined") return 0;
    return getPlaysToday();
  });
  const [unlocked, setUnlocked] = useState(false);
  const [deducting, setDeducting] = useState(false);
  const [error, setError] = useState("");

  const freePlaysLeft = Math.max(0, MAX_FREE_PLAYS - playsToday);
  const needsCredits = freePlaysLeft <= 0;

  const recordFreePlay = useCallback(() => {
    if (!needsCredits) {
      incrementPlays();
      setPlaysToday((p) => p + 1);
    }
  }, [needsCredits]);

  // Free plays remaining — show game with banner
  if (!needsCredits) {
    return (
      <div>
        <div className="mx-auto max-w-[960px] px-4 pt-6">
          <div className="rounded-xl px-4 py-2.5 text-center text-sm font-medium bg-green/10 text-green">
            <strong>{freePlaysLeft}</strong> free play{freePlaysLeft !== 1 ? "s" : ""} remaining today
          </div>
        </div>
        <FreePlaysContext.Provider value={recordFreePlay}>
          {children}
        </FreePlaysContext.Provider>
      </div>
    );
  }

  // ── Below: free plays exhausted, credit gate logic ──────────────────

  // Already paid for this session
  if (unlocked) {
    return (
      <div>
        <div className="mx-auto max-w-[960px] px-4 pt-6">
          <div className="rounded-xl px-4 py-2.5 text-center text-sm font-medium bg-amber/10 text-amber">
            Free plays used up for today — using credits
          </div>
        </div>
        {children}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-text-muted">
        Loading…
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 text-center px-4">
        <div className="mx-auto max-w-[960px] w-full mb-2">
          <div className="rounded-xl px-4 py-2.5 text-center text-sm font-medium bg-amber/10 text-amber">
            Free plays used up for today
          </div>
        </div>
        <div className="text-4xl">🎮</div>
        <h2 className="font-display text-xl text-text-primary">
          Log in to keep playing
        </h2>
        <p className="text-text-muted text-sm max-w-sm">
          This game costs {creditCost} credits to play. Log in or create an account to continue.
        </p>
        <Link
          href={`/login?redirect=/arcade/${gameSlug}`}
          className="rounded-full bg-teal px-6 py-2.5 text-sm font-bold text-white no-underline
                     hover:bg-teal/90 transition-colors"
        >
          Log In
        </Link>
      </div>
    );
  }

  // Insufficient credits
  if (credits < creditCost) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 text-center px-4">
        <div className="mx-auto max-w-[960px] w-full mb-2">
          <div className="rounded-xl px-4 py-2.5 text-center text-sm font-medium bg-amber/10 text-amber">
            Free plays used up for today
          </div>
        </div>
        <svg className="h-10 w-10 text-amber" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125v-3.75" />
        </svg>
        <h2 className="font-display text-xl text-text-primary">
          Not enough credits
        </h2>
        <p className="text-text-muted text-sm max-w-sm">
          This game costs <strong className="text-text-primary">{creditCost}</strong> credits. You have <strong className="text-amber">{credits}</strong>.
        </p>
        <Link
          href="/subscribe"
          className="inline-flex items-center gap-1.5 rounded-full bg-amber px-6 py-2.5 text-sm font-bold text-white no-underline
                     shadow-md shadow-amber/20 hover:shadow-lg hover:scale-[1.03] active:scale-[0.98] transition-all duration-200"
        >
          Buy Credits
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      </div>
    );
  }

  // Ready to pay with credits
  const handlePlay = async () => {
    setDeducting(true);
    setError("");
    try {
      const res = await fetch("/api/credits/deduct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameSlug }),
      });
      if (res.ok) {
        setUnlocked(true);
        await refreshProfile();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to deduct credits");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setDeducting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 text-center px-4">
      <div className="mx-auto max-w-[960px] w-full mb-2">
        <div className="rounded-xl px-4 py-2.5 text-center text-sm font-medium bg-amber/10 text-amber">
          Free plays used up for today — credits required to keep playing
        </div>
      </div>
      <div className="text-4xl">🎮</div>
      <h2 className="font-display text-xl text-text-primary">
        Ready to play?
      </h2>
      <p className="text-text-muted text-sm">
        This game costs <strong className="text-amber">{creditCost} credits</strong>.
        You have <strong>{credits}</strong>.
      </p>

      {error && (
        <div className="bg-coral/10 text-coral text-sm rounded-lg px-4 py-2">
          {error}
        </div>
      )}

      <button
        onClick={handlePlay}
        disabled={deducting}
        className="rounded-full bg-teal px-8 py-3 text-sm font-bold text-white
                   hover:bg-teal/90 transition-colors disabled:opacity-50"
      >
        {deducting ? "Starting…" : `Play for ${creditCost} credits`}
      </button>
    </div>
  );
}

// Context to let child game components record a free play on game start
import { createContext, useContext } from "react";

const FreePlaysContext = createContext<(() => void) | null>(null);

export function useRecordFreePlay() {
  return useContext(FreePlaysContext);
}
