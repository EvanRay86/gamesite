"use client";

import { useState, useCallback, type ReactNode } from "react";
import CreditGate from "@/components/CreditGate";

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
    // Clean up old dates to avoid localStorage bloat
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
  children: (onGameStart: () => void) => ReactNode;
}

export default function FreePlaysGate({ creditCost, gameSlug, children }: FreePlaysGateProps) {
  const [playsToday, setPlaysToday] = useState(() => getPlaysToday());
  const freePlaysLeft = Math.max(0, MAX_FREE_PLAYS - playsToday);
  const needsCredits = freePlaysLeft <= 0;

  const handleGameStart = useCallback(() => {
    if (!needsCredits) {
      incrementPlays();
      setPlaysToday((p) => p + 1);
    }
  }, [needsCredits]);

  return (
    <div>
      {/* Free plays banner */}
      <div className="mx-auto max-w-[960px] px-4 pt-6">
        <div className={`rounded-xl px-4 py-2.5 text-center text-sm font-medium ${
          freePlaysLeft > 0
            ? "bg-green/10 text-green"
            : "bg-amber/10 text-amber"
        }`}>
          {freePlaysLeft > 0 ? (
            <>🎮 <strong>{freePlaysLeft}</strong> free play{freePlaysLeft !== 1 ? "s" : ""} remaining today</>
          ) : (
            <>Free plays used up for today — credits required to keep playing</>
          )}
        </div>
      </div>

      {needsCredits ? (
        <CreditGate creditCost={creditCost} gameSlug={gameSlug}>
          {children(handleGameStart)}
        </CreditGate>
      ) : (
        children(handleGameStart)
      )}
    </div>
  );
}
