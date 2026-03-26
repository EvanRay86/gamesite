import type { Metadata } from "next";
import TopNav from "@/components/layout/TopNav";
import CookieBanner from "@/components/CookieBanner";
import "./globals.css";

const siteUrl = "https://gamesite.app";

export const metadata: Metadata = {
  title: {
    default: "Gamesite — Browser Games",
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
    title: "Gamesite — Browser Games",
    description:
      "Play daily word puzzles, trivia, arcade games, and more — free in your browser.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gamesite — Browser Games",
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Outfit:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <TopNav />
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
