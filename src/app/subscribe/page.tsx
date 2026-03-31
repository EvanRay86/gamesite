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

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal via-teal/90 to-sky p-[1px] shadow-xl shadow-teal/15 mb-12">
          <div className="relative rounded-[15px] bg-gradient-to-br from-teal via-teal/95 to-sky px-8 py-9 text-center">
            {/* Decorative rings */}
            <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full border border-white/10" />
            <div className="pointer-events-none absolute -left-6 -bottom-6 h-24 w-24 rounded-full border border-white/10" />

            <span className="inline-block rounded-full bg-white/15 backdrop-blur-sm px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/90 mb-4">
              Premium
            </span>

            <ul className="space-y-2.5 text-left max-w-[280px] mx-auto mb-8">
              {[
                "Full archive for all 14+ daily games",
                "Play any past puzzle, any time",
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

            {isSubscriber ? (
              <div className="inline-flex items-center gap-2 bg-white/20 text-white font-bold rounded-full px-6 py-3 text-sm">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                You&apos;re subscribed!
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => handleCheckout(STRIPE_PRICES.premium_monthly, "subscription")}
                  disabled={loading === STRIPE_PRICES.premium_monthly}
                  className="inline-flex items-center justify-center bg-white/20 text-white font-bold rounded-full
                             px-6 py-3 text-sm border border-white/30
                             hover:bg-white/30 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 disabled:opacity-50"
                >
                  {loading === STRIPE_PRICES.premium_monthly ? "Redirecting…" : "$3/month"}
                </button>
                <button
                  onClick={() => handleCheckout(STRIPE_PRICES.premium_annual, "subscription")}
                  disabled={loading === STRIPE_PRICES.premium_annual}
                  className="inline-flex items-center justify-center bg-white text-teal font-bold rounded-full
                             px-6 py-3 text-sm shadow-lg shadow-black/10
                             hover:shadow-xl hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 disabled:opacity-50"
                >
                  {loading === STRIPE_PRICES.premium_annual ? "Redirecting…" : "$30/year"}
                  <span className="ml-1.5 text-xs font-semibold text-teal/70">Save 17%</span>
                </button>
              </div>
            )}
          </div>
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
                  className="w-full rounded-full bg-text-primary text-white py-3 text-sm font-semibold
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
