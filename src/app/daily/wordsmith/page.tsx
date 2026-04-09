import Link from "next/link";
import WordsmithModeSelect from "@/components/WordsmithModeSelect";
import MoreDailyGames from "@/components/MoreDailyGames";
import GameJsonLd from "@/components/seo/GameJsonLd";
import { buildGameMetadata } from "@/lib/seo";

export const metadata = buildGameMetadata({
  title: "Play Wordsmith Online Free — Daily Word Game",
  description:
    "Play Wordsmith today — forge words through five rounds, collect power-ups, and chase the daily high score. Free in your browser.",
  path: "daily/wordsmith",
  color: "amber",
});

export default function WordsmithPage() {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <main>
      <GameJsonLd name="Wordsmith" description="Forge words through five rounds, collect power-ups, and chase the daily high score." path="daily/wordsmith" category="daily" />
      <WordsmithModeSelect dateStr={today} />
      <div className="flex justify-center py-6">
        <Link
          href="/daily/wordsmith/archive"
          className="inline-flex items-center gap-2 rounded-full bg-amber px-6 py-3 text-sm font-semibold text-white shadow-md hover:brightness-90 hover:shadow-lg active:scale-95 transition-all no-underline"
        >
          Play past puzzles &rarr;
        </Link>
      </div>
      <MoreDailyGames currentSlug="wordsmith" />

      <section className="mx-auto max-w-2xl px-4 pb-12 text-sm text-zinc-500 dark:text-zinc-400 space-y-3">
        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          What is Wordsmith?
        </h2>
        <p>
          Wordsmith is a daily word-building game with a twist — it plays like a
          roguelike. You forge words across five rounds, earning points based on
          word length and letter rarity. Along the way you collect power-ups that
          multiply your score, give bonus letters, or extend your time. The goal
          is to chase the daily high score and see how you stack up.
        </p>
        <p>
          Every day brings a new set of letters and power-ups on Gamesite. Play
          for free in your browser — no download or account needed. If you love
          Scrabble or Boggle but want something faster and more strategic,
          Wordsmith is for you. You can also try Quickplay mode for unlimited
          random rounds.
        </p>

        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          How to Play
        </h2>
        <ol className="list-decimal list-inside space-y-1">
          <li>Each round gives you a set of letters to build words from.</li>
          <li>Type valid words and submit them to earn points.</li>
          <li>Longer words and words with rare letters (like Q, Z, X) score higher.</li>
          <li>Between rounds, choose power-ups that boost your strategy.</li>
          <li>After five rounds, your total score is calculated. Compare it to the daily leaderboard.</li>
        </ol>

        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          Tips &amp; Strategy
        </h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Prioritize longer words — a single six-letter word often scores more than two three-letter words.</li>
          <li>Choose power-ups that complement your playing style. Score multipliers are great if you find long words consistently.</li>
          <li>Look for rare-letter combinations early. Words with Z, Q, X, or J earn significant bonus points.</li>
          <li>Do not ignore common prefixes and suffixes — adding UN, RE, ING, or ED to a root word is an easy score boost.</li>
          <li>Play Quickplay mode to practice without affecting your daily score.</li>
        </ul>
      </section>
    </main>
  );
}
