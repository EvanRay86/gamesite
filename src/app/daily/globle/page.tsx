import GlobleGame from "@/components/GlobleGame";
import MoreDailyGames from "@/components/MoreDailyGames";
import GameJsonLd from "@/components/seo/GameJsonLd";
import GameFAQ from "@/components/seo/GameFAQ";
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

      <GameFAQ faqs={[
        { question: "Is Globle free to play?", answer: "Yes! Globle is completely free to play on Gamesite. No downloads, no accounts, no hidden fees." },
        { question: "Can I play Globle on my phone?", answer: "Absolutely. Globle works on any device with a modern web browser — phones, tablets, and desktops. The 3D globe is fully touch-friendly." },
        { question: "How often does Globle update?", answer: "A brand-new mystery country is selected every day. Come back tomorrow for a fresh challenge." },
        { question: "How does the color system work in Globle?", answer: "After each guess, the country is colored based on distance from the answer. Red and orange mean you are close, yellow is moderate distance, green is fairly far, and blue means you are on the opposite side of the world." },
        { question: "Is there a limit to how many guesses I can make?", answer: "No, Globle has unlimited guesses. The goal is to find the mystery country in as few guesses as possible, but you can keep guessing until you get it right." },
      ]} />
    </main>
  );
}
