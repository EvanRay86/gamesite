"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      setVisible(true);
    }
  }, []);

  function accept() {
    localStorage.setItem("cookie-consent", "accepted");
    window.dispatchEvent(new Event("cookie-consent-change"));
    setVisible(false);
  }

  function decline() {
    localStorage.setItem("cookie-consent", "declined");
    window.dispatchEvent(new Event("cookie-consent-change"));
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4 animate-[fade-up_0.3s_ease_forwards]">
      <div className="mx-auto max-w-2xl rounded-2xl bg-white border border-border-light shadow-lg p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1 text-sm text-text-secondary leading-relaxed">
          We use cookies to keep the site working and to understand how it&apos;s used.{" "}
          <Link
            href="/privacy"
            className="inline-flex items-center rounded-full px-3 py-0.5 text-sm font-medium bg-coral/10 text-coral hover:bg-coral/20 transition-colors no-underline"
          >
            Privacy Policy
          </Link>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={decline}
            className="rounded-full px-4 py-1.5 text-sm font-semibold text-text-muted hover:text-text-primary
                       bg-surface hover:bg-surface-hover transition-colors"
          >
            Decline
          </button>
          <button
            onClick={accept}
            className="rounded-full px-4 py-1.5 text-sm font-semibold text-white bg-coral
                       hover:bg-coral-dark transition-colors"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
