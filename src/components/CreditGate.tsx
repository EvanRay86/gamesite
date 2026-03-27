"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

interface CreditGateProps {
  creditCost: number;
  gameSlug: string;
  children: ReactNode;
}

export default function CreditGate({ creditCost, gameSlug, children }: CreditGateProps) {
  const { user, credits, loading, refreshProfile } = useAuth();
  const [unlocked, setUnlocked] = useState(false);
  const [deducting, setDeducting] = useState(false);
  const [error, setError] = useState("");

  // Free games pass through
  if (creditCost <= 0) {
    return <>{children}</>;
  }

  // Already paid for this session
  if (unlocked) {
    return <>{children}</>;
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
        <div className="text-4xl">🎮</div>
        <h2 className="font-display text-xl text-text-primary">
          Log in to play
        </h2>
        <p className="text-text-muted text-sm max-w-sm">
          This game costs {creditCost} credits to play. Log in or create an account to get started.
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
        <div className="text-4xl">💰</div>
        <h2 className="font-display text-xl text-text-primary">
          Not enough credits
        </h2>
        <p className="text-text-muted text-sm max-w-sm">
          This game costs {creditCost} credits. You have {credits}.
        </p>
        <Link
          href="/subscribe"
          className="rounded-full bg-amber px-6 py-2.5 text-sm font-bold text-white no-underline
                     hover:bg-amber/90 transition-colors"
        >
          Buy Credits
        </Link>
      </div>
    );
  }

  // Ready to pay
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
