import { buildGameMetadata } from "@/lib/seo";
import GameJsonLd from "@/components/seo/GameJsonLd";
import GameFAQ from "@/components/seo/GameFAQ";
import Cascade from "@/components/Cascade";
import MoreArcadeGames from "@/components/MoreArcadeGames";

export const metadata = buildGameMetadata({
  title: "Cascade — Neon Falling-Blocks Stacker Game Online",
  description:
    "Stack and rotate falling blocks to clear neon lines in Cascade. A fast, free Tetris-style block puzzle — play instantly in your browser, no download or account.",
  path: "arcade/cascade",
  color: "sky",
});

export default function CascadePage() {
  return (
    <main>
      <GameJsonLd
        name="Cascade"
        description="Stack and rotate falling blocks to clear neon lines and chase your high score as the speed climbs."
        path="arcade/cascade"
        category="arcade"
      />
      <Cascade />
      <MoreArcadeGames currentSlug="cascade" />

      <section className="mx-auto max-w-2xl px-4 pb-12 text-sm text-zinc-500 dark:text-zinc-400 space-y-3">
        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          What is Cascade?
        </h2>
        <p>
          Cascade is a modern, neon-soaked take on the classic falling-block
          stacker. Seven shapes drop into the well one at a time — slide and
          rotate each piece to pack them tightly and complete full horizontal
          rows. Every completed row clears, drops everything above it, and adds
          to your score. Clear four rows at once for the biggest payoff.
        </p>
        <p>
          Play Cascade free in your browser on Gamesite — no download, no
          account. The pieces fall faster every ten lines, and clearing lines on
          back-to-back drops builds a combo multiplier. How long can you keep the
          stack under control?
        </p>

        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          How to Play
        </h2>
        <ol className="list-decimal list-inside space-y-1">
          <li>Move the falling piece with the left/right arrow keys (or A/D), or the on-screen buttons.</li>
          <li>Rotate with the up arrow or X (clockwise) and Z (counter-clockwise).</li>
          <li>Press the down arrow to soft-drop faster, or Space to hard-drop instantly.</li>
          <li>Press C (or Hold) to stash a piece for later and swap it in when you need it.</li>
          <li>Complete full rows to clear them — fill the well to the top and it&apos;s game over.</li>
        </ol>

        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          Tips &amp; Strategy
        </h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Keep your stack flat and low — towering columns leave you no room to recover.</li>
          <li>Leave one column open for the long I-piece and clear four rows at once for max points.</li>
          <li>Use the ghost piece (the outline at the bottom) to line up drops precisely.</li>
          <li>Clear lines on consecutive pieces to build a combo multiplier.</li>
          <li>Stash an awkward piece with Hold instead of forcing it into a bad spot.</li>
        </ul>
      </section>

      <GameFAQ
        faqs={[
          { question: "Is Cascade free to play?", answer: "Yes! Cascade is completely free to play on Gamesite. No downloads, no accounts, no hidden fees." },
          { question: "Can I play Cascade on my phone?", answer: "Absolutely. Cascade works on any device with a modern web browser — use the on-screen buttons to move, rotate, and drop the pieces." },
          { question: "How does the combo multiplier work?", answer: "Clearing at least one line on consecutive pieces builds a combo. Each consecutive clear adds a bonus on top of the base line points, so chaining clears is worth far more than clearing the same lines separately." },
          { question: "How is my score calculated?", answer: "You earn points for each set of lines cleared — more lines at once is worth more, and a four-line clear pays the most. Points scale with your level, soft and hard drops add a little extra, and combos stack a bonus on top." },
          { question: "Does Cascade save my progress?", answer: "Your best score is saved locally in your browser. Each run starts fresh, so jump in anytime and try to beat your personal best." },
        ]}
      />
    </main>
  );
}
