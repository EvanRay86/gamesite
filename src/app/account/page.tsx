"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import DailyLoginDashboard from "@/components/DailyLoginDashboard";

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-text-muted">Loading…</div>}>
      <AccountContent />
    </Suspense>
  );
}

function AccountContent() {
  const { user, profile, isSubscriber, credits, loading, signOut, refreshProfile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [portalLoading, setPortalLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      setShowSuccess(true);
      refreshProfile();
      // Clear the param from URL
      const url = new URL(window.location.href);
      url.searchParams.delete("success");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams, refreshProfile]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login?redirect=/account");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-text-muted">Loading…</div>
      </main>
    );
  }

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setPortalLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-md">
        <h1 className="font-display text-3xl text-text-primary mb-8">Account</h1>

        {showSuccess && (
          <div className="bg-green/10 text-green text-sm rounded-lg p-3 mb-6">
            Payment successful! Your account has been updated.
          </div>
        )}

        {/* Daily Login Rewards */}
        <DailyLoginDashboard />

        {/* Profile info */}
        <div className="bg-surface border border-border rounded-2xl p-6 mb-6">
          <div className="text-text-muted text-xs uppercase tracking-wide mb-1">Email</div>
          <div className="text-text-primary font-semibold mb-4">{user.email}</div>

          <div className="text-text-muted text-xs uppercase tracking-wide mb-1">Credits</div>
          <div className="text-text-primary font-semibold text-2xl mb-1">{credits}</div>
          <Link
            href="/subscribe"
            className="text-teal text-sm font-semibold no-underline hover:underline"
          >
            Buy more credits
          </Link>
        </div>

        {/* Subscription */}
        <div className="bg-surface border border-border rounded-2xl p-6 mb-6">
          <div className="text-text-muted text-xs uppercase tracking-wide mb-2">Subscription</div>
          {isSubscriber ? (
            <>
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-block w-2 h-2 rounded-full bg-green" />
                <span className="text-text-primary font-semibold">Premium — Active</span>
              </div>
              <button
                onClick={handlePortal}
                disabled={portalLoading}
                className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-text-secondary
                           hover:bg-surface-hover transition-colors disabled:opacity-50"
              >
                {portalLoading ? "Loading…" : "Manage Subscription"}
              </button>
            </>
          ) : (
            <>
              <div className="text-text-muted text-sm mb-4">No active subscription</div>
              <Link
                href="/subscribe"
                className="inline-block rounded-full bg-teal px-6 py-2.5 text-sm font-bold text-white
                           hover:bg-teal/90 transition-colors no-underline"
              >
                Subscribe — $3/mo
              </Link>
            </>
          )}
        </div>

        {/* Sign out */}
        <button
          onClick={async () => {
            await signOut();
            router.push("/");
          }}
          className="w-full rounded-full border border-border py-3 text-sm font-semibold text-text-muted
                     hover:bg-surface-hover hover:text-coral transition-colors"
        >
          Sign Out
        </button>
      </div>
    </main>
  );
}
