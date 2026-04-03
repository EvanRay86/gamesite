import type { Metadata, Viewport } from "next";
import TopNav from "@/components/layout/TopNav";
import Footer from "@/components/layout/Footer";
import CookieBanner from "@/components/CookieBanner";
import ConsentScripts from "@/components/ConsentScripts";
import { AuthProvider } from "@/contexts/AuthContext";
import "./globals.css";

const siteUrl = "https://gamesite.app";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: {
    default: "Gamesite — Free Daily Puzzles, Trivia & Arcade Games",
    template: "%s | Gamesite",
  },
  description:
    "Play daily word puzzles, trivia, arcade games, and more — free in your browser. No downloads required.",
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Gamesite",
    title: "Gamesite — Free Daily Puzzles, Trivia & Arcade Games",
    description:
      "Play daily word puzzles, trivia, arcade games, and more — free in your browser.",
  },
  twitter: {
    card: "summary_large_image",
    site: "@GamesiteAppEvan",
    creator: "@GamesiteAppEvan",
    title: "Gamesite — Free Daily Puzzles, Trivia & Arcade Games",
    description:
      "Play daily word puzzles, trivia, arcade games, and more — free in your browser.",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: siteUrl,
  },
};

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Gamesite",
    url: siteUrl,
    description:
      "Play daily word puzzles, trivia, arcade games, and more — free in your browser.",
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/daily`,
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Gamesite",
    url: siteUrl,
    logo: `${siteUrl}/icon.png`,
    sameAs: [],
  },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="google-adsense-account" content="ca-pub-9472092135896672" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Outfit:wght@100..900&family=Space+Grotesk:wght@400..700&family=Syne:wght@700;800&family=Russo+One&family=Fredoka:wght@600;700&family=Playfair+Display:wght@700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        {jsonLd.map((schema, i) => (
          <script
            key={i}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}
        <AuthProvider>
          <div className="overflow-wrapper">
            <a href="#main-content" className="skip-to-content">
              Skip to content
            </a>
            <TopNav />
            <main id="main-content">
              {children}
            </main>
            <Footer />
          </div>
          <CookieBanner />
          <ConsentScripts />
        </AuthProvider>
      </body>
    </html>
  );
}
