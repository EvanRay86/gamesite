import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Gamesite — Free Browser Games & Daily Puzzles",
  description: "Learn about Gamesite — free daily puzzles, trivia, and arcade games in your browser.",
  alternates: { canonical: "https://gamesite.app/about" },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-[720px] px-4 py-10">
      <div className="bg-white rounded-2xl border border-border-light p-6 sm:p-10 shadow-sm">
        <h1 className="font-body text-3xl font-bold text-text-primary mb-2">
          About Gamesite
        </h1>
        <p className="text-sm text-text-dim mb-8">gamesite.app</p>

        <div className="space-y-6 text-sm text-text-secondary leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-text-primary mb-2">What We Do</h2>
            <p>
              Gamesite is a free browser-based gaming platform featuring daily word puzzles,
              trivia challenges, and arcade games. No downloads, no installs — just open your
              browser and play. New puzzles drop every day, and our arcade library is always growing.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text-primary mb-2">Our Games</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Daily Puzzles:</strong> Word games, trivia, crosswords, geography challenges, and more — a fresh puzzle every day.</li>
              <li><strong>Arcade:</strong> Quick-play games like Snake Arena, 2048, Slime Volleyball, and others you can jump into anytime.</li>
              <li><strong>Community:</strong> Collaborative experiences like PixelVille where players build together.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text-primary mb-2">Free to Play</h2>
            <p>
              All daily puzzles are free to play. Optional premium subscriptions unlock puzzle
              archives so you can revisit or catch up on past games. Arcade credits let you access
              premium arcade titles at your own pace.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text-primary mb-2">Advertising</h2>
            <p>
              Gamesite is partially supported by advertising through Google AdSense. Ads help us
              keep the core experience free for everyone. We strive to keep ad placements
              non-intrusive so they don&apos;t interfere with gameplay.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text-primary mb-2">Contact</h2>
            <p>
              Questions, feedback, or partnership inquiries? Reach us at{" "}
              <a href="mailto:hello@gamesite.app" className="text-coral hover:text-coral-dark transition-colors">
                hello@gamesite.app
              </a>
              {" "}or visit our{" "}
              <Link href="/contact" className="text-coral hover:text-coral-dark transition-colors">
                Contact page
              </Link>.
            </p>
          </section>
        </div>

        <div className="mt-8 pt-6 border-t border-border-light flex gap-4">
          <Link href="/privacy" className="text-sm text-coral hover:text-coral-dark transition-colors no-underline">
            Privacy Policy &rarr;
          </Link>
          <Link href="/terms" className="text-sm text-coral hover:text-coral-dark transition-colors no-underline">
            Terms of Service &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
