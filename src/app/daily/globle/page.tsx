import GlobleGame from "@/components/GlobleGame";
import MoreDailyGames from "@/components/MoreDailyGames";
import GameJsonLd from "@/components/seo/GameJsonLd";
import { buildGameMetadata } from "@/lib/seo";

export const revalidate = 60;

export const metadata = buildGameMetadata({
  title: "Play Globle Online Free — Guess the Country on the Globe",
  description:
    "Play Globle today — guess the mystery country on an interactive 3D globe! Each guess is color-coded by proximity. Hotter = closer. A free daily geography game with unlimited guesses, stats tracking, and practice mode.",
  path: "daily/globle",
  color: "green",
});

export default function GloblePage() {
  return (
    <main>
      <GameJsonLd
        name="Globle"
        description="Guess the mystery country on an interactive 3D globe. Each guess highlights the country with a color showing how close you are — hotter means closer. A free daily geography guessing game."
        path="daily/globle"
        category="daily"
      />
      <GlobleGame />

      {/* SEO content */}
      <section className="mx-auto max-w-2xl px-4 py-8">
        <h2 className="text-2xl font-bold text-text-primary mb-3">
          How to Play Globle
        </h2>
        <p className="text-text-secondary mb-4 leading-relaxed">
          Globle is a daily geography guessing game. Each day a new mystery
          country is selected. Type any country name to make a guess — the
          country will appear on the 3D globe colored by how close it is to the
          answer. <strong>Hotter colors</strong> (red, orange) mean you&apos;re
          close. <strong>Cooler colors</strong> (blue, green) mean you&apos;re
          far away. Use the distance and direction clues to narrow down the
          mystery country.
        </p>
        <h3 className="text-lg font-semibold text-text-primary mb-2">
          Color Guide
        </h3>
        <ul className="text-text-secondary mb-4 space-y-1 list-disc pl-5">
          <li>
            <span className="font-semibold" style={{ color: "#dc2626" }}>Red</span> — Very close, almost there!
          </li>
          <li>
            <span className="font-semibold" style={{ color: "#f97316" }}>Orange</span> — Getting warm, nearby region
          </li>
          <li>
            <span className="font-semibold" style={{ color: "#facc15" }}>Yellow</span> — Moderate distance away
          </li>
          <li>
            <span className="font-semibold" style={{ color: "#4ade80" }}>Green</span> — Fairly far, different region
          </li>
          <li>
            <span className="font-semibold" style={{ color: "#67e8f9" }}>Blue</span> — Very far, opposite side of the world
          </li>
        </ul>
        <h3 className="text-lg font-semibold text-text-primary mb-2">
          Tips & Strategy
        </h3>
        <p className="text-text-secondary leading-relaxed">
          Start with a country in the center of a continent to quickly eliminate
          large regions. Pay attention to the direction arrows — they point
          toward the mystery country. After completing the daily puzzle, try
          <strong> Quickplay</strong> mode for unlimited practice rounds with
          random countries. Track your stats including win streaks and average
          guesses.
        </p>
      </section>

      <MoreDailyGames currentSlug="globle" />
    </main>
  );
}
