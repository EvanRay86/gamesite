import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Linked — Daily Word Puzzle",
  description: "Find four groups of four words that share a hidden link.",
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
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}
