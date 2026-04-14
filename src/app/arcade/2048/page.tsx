import { buildGameMetadata } from "@/lib/seo";
import GameJsonLd from "@/components/seo/GameJsonLd";
import GameFAQ from "@/components/seo/GameFAQ";
import Game2048 from "@/components/Game2048";
import MoreArcadeGames from "@/components/MoreArcadeGames";

export const metadata = buildGameMetadata({
  title: "2048 Game — Free Online Number Puzzle",
  description:
    "Slide numbered tiles, combine matching numbers, and reach the 2048 tile. Play the classic 2048 puzzle game free online.",
  path: "arcade/2048",
  color: "amber",
});

export default function Game2048Page() {
  return (
    <main>
      <GameJsonLd name="2048" description="Slide tiles, combine numbers, and reach the 2048 tile to win." path="arcade/2048" category="arcade" />
      <Game2048 />
      <MoreArcadeGames currentSlug="2048" />

      <section className="mx-auto max-w-2xl px-4 pb-12 text-sm text-zinc-500 dark:text-zinc-400 space-y-3">
        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          What is 2048?
        </h2>
        <p>
          2048 is the classic sliding-tile number puzzle that took the internet by
          storm. Your goal is simple: combine matching numbered tiles to create
          the elusive 2048 tile. Swipe in any direction and every tile on the
          board slides as far as it can go — when two tiles with the same number
          collide, they merge into one tile worth their combined value.
        </p>
        <p>
          Play 2048 online for free on Gamesite — no download, no account, no ads
          blocking the board. The game saves your progress automatically so you
          can pick up right where you left off.
        </p>

        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          How to Play
        </h2>
        <ol className="list-decimal list-inside space-y-1">
          <li>Swipe (or use arrow keys) to slide all tiles in one direction — up, down, left, or right.</li>
          <li>When two tiles with the same number touch, they merge into one tile with double the value.</li>
          <li>After every move a new tile (2 or 4) appears in a random empty spot.</li>
          <li>Keep merging tiles to build higher numbers — 4, 8, 16, 32, 64, 128, 256, 512, 1024…</li>
          <li>Reach the 2048 tile to win, or keep going for an even higher score.</li>
        </ol>

        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          Tips &amp; Strategy
        </h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Pick a corner and keep your highest tile locked there — most pros use the bottom-left or bottom-right.</li>
          <li>Avoid pushing tiles toward the center of the board; edges and corners give you more control.</li>
          <li>Try to keep your tiles in a descending &quot;snake&quot; pattern so merges chain together naturally.</li>
          <li>Never swipe up unless you absolutely have to — it disrupts your corner strategy.</li>
          <li>Plan two or three moves ahead instead of reacting to each new tile as it appears.</li>
        </ul>
      </section>

      <GameFAQ faqs={[
        { question: "Is 2048 free to play?", answer: "Yes! 2048 is completely free to play on Gamesite. No downloads, no accounts, no hidden fees." },
        { question: "Can I play 2048 on my phone?", answer: "Absolutely. 2048 works on any device with a modern web browser — phones, tablets, and desktops. Swipe controls work perfectly on touchscreens." },
        { question: "Does 2048 save my progress?", answer: "Yes, your game progress is saved automatically in your browser. You can close the tab and come back later to pick up exactly where you left off." },
        { question: "What is the highest possible score in 2048?", answer: "The theoretical maximum tile is 131,072 on a standard 4x4 grid, though reaching it is practically impossible. Most skilled players aim for the 2048 tile and beyond, with scores in the tens of thousands." },
        { question: "Can I keep playing after reaching 2048?", answer: "Yes! Reaching the 2048 tile counts as a win, but you can continue playing to build even higher tiles like 4096, 8192, and beyond. The game only ends when no more moves are possible." },
      ]} />
    </main>
  );
}
