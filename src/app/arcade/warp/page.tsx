import { buildGameMetadata } from "@/lib/seo";
import GameJsonLd from "@/components/seo/GameJsonLd";
import GameFAQ from "@/components/seo/GameFAQ";
import WarpGame from "@/components/WarpGame";
import MoreArcadeGames from "@/components/MoreArcadeGames";

export const metadata = buildGameMetadata({
  title: "WARP — Gravitational Slingshot Puzzle Game",
  description:
    "Aim, launch, and slingshot through gravitational fields in this orbital puzzle game. 30 levels of n-body physics. Free browser game.",
  path: "arcade/warp",
  color: "purple",
});

export default function WarpPage() {
  return (
    <main>
      <GameJsonLd
        name="WARP"
        description="Aim, launch, and slingshot through gravitational fields in this orbital puzzle game."
        path="arcade/warp"
        category="arcade"
      />
      <WarpGame />
      <MoreArcadeGames currentSlug="warp" />

      <section className="mx-auto max-w-2xl px-4 pb-12 text-sm text-zinc-500 dark:text-zinc-400 space-y-3">
        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          What is WARP?
        </h2>
        <p>
          WARP is a gravitational slingshot puzzle game where you launch a
          projectile through fields of orbiting bodies and use their gravity to
          bend your trajectory toward the target. Each of the 30 levels introduces
          new configurations of planets, moons, and gravitational wells that
          require you to think in curves, not straight lines.
        </p>
        <p>
          Play WARP free on Gamesite — it&apos;s a brain-bending mix of physics and
          puzzle-solving that rewards patience and spatial thinking. No download
          needed.
        </p>

        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          How to Play
        </h2>
        <ol className="list-decimal list-inside space-y-1">
          <li>Click and drag from the launch point to set your projectile&apos;s direction and power.</li>
          <li>Release to fire — your projectile will travel in a straight line until gravity takes over.</li>
          <li>Gravitational bodies pull your projectile as it passes, curving its path.</li>
          <li>Use these gravity assists to slingshot around obstacles and reach the target zone.</li>
          <li>Complete all 30 levels, each with increasingly complex orbital puzzles.</li>
        </ol>

        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          Tips &amp; Strategy
        </h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Aim to pass close to gravitational bodies — the closer you fly, the stronger the pull and the tighter the curve.</li>
          <li>Sometimes the indirect route is the only route; don&apos;t always aim straight at the target.</li>
          <li>Watch the trajectory preview line carefully before releasing your shot.</li>
          <li>Larger planets have stronger gravity — factor their pull into every launch angle.</li>
          <li>If a level stumps you, try launching at a completely different angle. Small changes in direction create huge differences in trajectory.</li>
        </ul>
      </section>

      <GameFAQ faqs={[
        { question: "Is WARP free to play?", answer: "Yes! WARP is completely free to play on Gamesite. No downloads, no accounts, no hidden fees." },
        { question: "Can I play WARP on my phone?", answer: "Absolutely. WARP works on any device with a modern web browser — phones, tablets, and desktops. Drag-to-aim controls work great on touchscreens." },
        { question: "Does WARP save my progress?", answer: "Yes, your level progress is saved in your browser so you can pick up where you left off. Complete all 30 levels at your own pace." },
        { question: "How many levels are in WARP?", answer: "WARP features 30 levels of increasingly complex gravitational puzzles. Each level introduces new configurations of planets, moons, and gravitational wells that challenge your spatial reasoning." },
        { question: "Do I need to understand physics to play WARP?", answer: "No prior physics knowledge is needed. The game teaches gravitational concepts intuitively as you play. You will naturally develop an understanding of how gravity bends trajectories through experimentation." },
      ]} />
    </main>
  );
}
