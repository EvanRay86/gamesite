import { buildGameMetadata } from "@/lib/seo";
import GameJsonLd from "@/components/seo/GameJsonLd";
import GameFAQ from "@/components/seo/GameFAQ";
import BrickBlitz from "@/components/BrickBlitz";
import MoreArcadeGames from "@/components/MoreArcadeGames";

export const metadata = buildGameMetadata({
  title: "Brick Blitz — Neon Brick Breaker Game Online",
  description:
    "Smash every brick, catch power-ups, and chain combos in this neon brick breaker. Free online Breakout-style arcade game — play instantly in your browser.",
  path: "arcade/brick-blitz",
  color: "teal",
});

export default function BrickBlitzPage() {
  return (
    <main>
      <GameJsonLd
        name="Brick Blitz"
        description="Smash every brick, catch power-ups, and chain combos in this neon brick breaker."
        path="arcade/brick-blitz"
        category="arcade"
      />
      <BrickBlitz />
      <MoreArcadeGames currentSlug="brick-blitz" />

      <section className="mx-auto max-w-2xl px-4 pb-12 text-sm text-zinc-500 dark:text-zinc-400 space-y-3">
        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          What is Brick Blitz?
        </h2>
        <p>
          Brick Blitz is a modern, neon-soaked take on the classic brick breaker
          (Breakout / Arkanoid). Bounce the ball off your paddle to smash every
          brick on the board, catch falling power-ups, and clear level after
          level as the layouts get tougher and the ball gets faster.
        </p>
        <p>
          Play Brick Blitz free in your browser on Gamesite — no download, no
          account. Tougher bricks take multiple hits, steel bricks can&apos;t be
          broken at all, and chaining brick breaks without touching your paddle
          builds a score multiplier. How many levels can you clear?
        </p>

        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          How to Play
        </h2>
        <ol className="list-decimal list-inside space-y-1">
          <li>Move your paddle with the mouse, your finger, or the arrow keys (or A/D).</li>
          <li>Tap, click, or press Space to launch the ball.</li>
          <li>Bounce the ball into bricks to break them — where it hits the paddle changes its angle.</li>
          <li>Catch falling power-ups: multiball, wide paddle, slow-mo, laser, and extra lives.</li>
          <li>Clear every breakable brick to advance to the next level.</li>
        </ol>

        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          Tips &amp; Strategy
        </h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Hit the ball with the edge of the paddle to steer it into hard-to-reach bricks.</li>
          <li>Keep the ball off your paddle as long as possible to build a bigger combo multiplier.</li>
          <li>Grab the laser power-up to chew through tough multi-hit bricks fast.</li>
          <li>When multiball is active, keep your paddle centered to cover more balls at once.</li>
          <li>Steel bricks never break — angle your shots around them instead of fighting them.</li>
        </ul>
      </section>

      <GameFAQ
        faqs={[
          { question: "Is Brick Blitz free to play?", answer: "Yes! Brick Blitz is completely free to play on Gamesite. No downloads, no accounts, no hidden fees." },
          { question: "Can I play Brick Blitz on my phone?", answer: "Absolutely. Brick Blitz works on any device with a modern web browser — drag your finger to move the paddle and tap to launch the ball." },
          { question: "How do power-ups work?", answer: "Breaking a brick sometimes drops a capsule. Catch it with your paddle to trigger its effect: multiball splits your ball, wide grows your paddle, slow eases the ball's speed, laser lets your paddle shoot, and the heart grants an extra life." },
          { question: "How is my score calculated?", answer: "Each brick you break is worth points multiplied by your current combo. Breaking bricks in a row without the ball touching your paddle raises the multiplier, and clearing a full level awards a bonus." },
          { question: "Does Brick Blitz save my progress?", answer: "Your best score is saved locally in your browser. Each run starts fresh at level 1, so jump in anytime and try to beat your personal best." },
        ]}
      />
    </main>
  );
}
