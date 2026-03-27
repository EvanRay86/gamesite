"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { CREDIT_PACKS, STRIPE_PRICES } from "@/lib/stripe-config";

export default function SubscribePage() {
  const { user, isSubscriber } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleCheckout = async (priceId: string, mode: "subscription" | "payment") => {
    if (!user) {
      router.push("/login?redirect=/subscribe");
      return;
    }

    setLoading(priceId);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId, mode }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setLoading(null);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Premium Subscription */}
        <div className="text-center mb-10">
          <h1 className="font-display text-4xl text-text-primary mb-3">
            Go Premium
          </h1>
          <p className="text-text-muted max-w-md mx-auto">
            Unlock the full archive for every daily game. Play any puzzle from any day.
          </p>
        </div>

        <div className="relative rounded-2xl bg-gradient-to-br from-teal via-teal to-sky p-8 text-center text-white shadow-lg shadow-teal/20 mb-12">
          <div className="text-sm font-semibold uppercase tracking-wide text-white/70 mb-2">
            Premium
          </div>
          <div className="mb-1">
            <span className="text-5xl font-extrabold">$6</span>
            <span className="text-white/70 text-lg">/month</span>
          </div>
          <ul className="text-left text-sm text-white/90 space-y-2 mt-6 mb-8 max-w-xs mx-auto">
            <li className="flex items-start gap-2">
              <span className="text-white mt-0.5">✓</span>
              Full archive access for all 14+ daily games
            </li>
            <li className="flex items-start gap-2">
              <span className="text-white mt-0.5">✓</span>
              Play any past puzzle, any time
            </li>
            <li className="flex items-start gap-2">
              <span className="text-white mt-0.5">✓</span>
              Cancel anytime
            </li>
          </ul>

          {isSubscriber ? (
            <div className="inline-block bg-white/20 text-white font-bold rounded-full px-6 py-3 text-sm">
              You&apos;re subscribed!
            </div>
          ) : (
            <button
              onClick={() => handleCheckout(STRIPE_PRICES.premium_monthly, "subscription")}
              disabled={loading === STRIPE_PRICES.premium_monthly}
              className="inline-block bg-white text-teal font-bold rounded-full px-8 py-3 text-sm
                         hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50"
            >
              {loading === STRIPE_PRICES.premium_monthly ? "Redirecting…" : "Subscribe Now"}
            </button>
          )}
        </div>

        {/* Credit Packs */}
        <div className="text-center mb-8">
          <h2 className="font-display text-2xl text-text-primary mb-2">
            Arcade Credits
          </h2>
          <p className="text-text-muted text-sm">
            Buy credits to play premium arcade games.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {CREDIT_PACKS.map((pack) => {
            const priceId = STRIPE_PRICES[pack.priceEnv];
            return (
              <div
                key={pack.priceEnv}
                className={`relative rounded-2xl border p-5 text-center ${
                  pack.popular
                    ? "border-amber bg-amber/5 shadow-md"
                    : "border-border bg-surface"
                }`}
              >
                {pack.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber text-white text-xs font-bold rounded-full px-3 py-1">
                    Popular
                  </span>
                )}
                <div className="text-2xl font-extrabold text-text-primary mb-1">
                  {pack.credits}
                </div>
                <div className="text-text-muted text-xs mb-4">credits</div>
                <div className="text-lg font-bold text-text-primary mb-4">
                  {pack.price}
                </div>
                <button
                  onClick={() => {
                    if (!user) {
                      router.push("/login?redirect=/subscribe");
                      return;
                    }
                    handleCheckout(priceId, "payment");
                  }}
                  disabled={loading === priceId}
                  className="w-full rounded-full bg-text-primary text-white py-2 text-sm font-semibold
                             hover:bg-text-secondary transition-colors disabled:opacity-50"
                >
                  {loading === priceId ? "…" : "Buy"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
