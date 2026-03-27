import type { Metadata } from "next";
import { DM_Serif_Display, Outfit } from "next/font/google";
import TopNav from "@/components/layout/TopNav";
import CookieBanner from "@/components/CookieBanner";
import { AuthProvider } from "@/contexts/AuthContext";
import "./globals.css";

const dmSerifDisplay = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

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
    <html lang="en" className={`${dmSerifDisplay.variable} ${outfit.variable}`}>
      <body className="font-body antialiased">
        <AuthProvider>
          <TopNav />
          {children}
          <CookieBanner />
        </AuthProvider>
      </body>
    </html>
  );
}
