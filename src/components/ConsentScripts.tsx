"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

/**
 * Loads Google Analytics and AdSense scripts only when the user has
 * accepted cookies. If consent is "declined" or not yet given, no
 * tracking or ad scripts are loaded.
 */
export default function ConsentScripts() {
  const [consent, setConsent] = useState<string | null>(null);

  useEffect(() => {
    setConsent(localStorage.getItem("cookie-consent"));

    // Re-check when consent changes (e.g., user clicks accept/decline)
    const onStorage = (e: StorageEvent) => {
      if (e.key === "cookie-consent") {
        setConsent(e.newValue);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Also listen for custom event from CookieBanner (same-tab updates)
  useEffect(() => {
    const handler = () => {
      setConsent(localStorage.getItem("cookie-consent"));
    };
    window.addEventListener("cookie-consent-change", handler);
    return () => window.removeEventListener("cookie-consent-change", handler);
  }, []);

  if (consent !== "accepted") return null;

  return (
    <>
      {/* Google AdSense */}
      <Script
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9472092135896672"
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />

      {/* Google Analytics */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-TB8LQYPT6J"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-TB8LQYPT6J');
        `}
      </Script>
    </>
  );
}
