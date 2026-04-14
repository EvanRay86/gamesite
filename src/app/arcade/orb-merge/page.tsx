import { buildGameMetadata } from "@/lib/seo";
import GameJsonLd from "@/components/seo/GameJsonLd";
import GameFAQ from "@/components/seo/GameFAQ";
import OrbMerge from "@/components/OrbMerge";
import MoreArcadeGames from "@/components/MoreArcadeGames";

export const metadata = buildGameMetadata({
  title: "Orb Merge — Physics Puzzle Merge Game",
  description:
    "Drop orbs, match colors, and merge your way to the top tier. A physics-based puzzle game — free to play in your browser.",
  path: "arcade/orb-merge",
  color: "purple",
});

export default function OrbMergePage() {
  return (
    <main>
      <GameJsonLd name="Orb Merge" description="Drop orbs, match colors, and merge your way to the top tier. Physics-based chaos." path="arcade/orb-merge" category="arcade" />
      <OrbMerge />
      <MoreArcadeGames currentSlug="orb-merge" />

      <section className="mx-auto max-w-2xl px-4 pb-12 text-sm text-zinc-500 dark:text-zinc-400 space-y-3">
        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          What is Orb Merge?
        </h2>
        <p>
          Orb Merge is a physics-based puzzle game where you drop colorful orbs
          into a container and merge matching pairs into bigger, higher-tier orbs.
          Think of it as 2048 meets Suika — gravity and momentum make every drop
          unpredictable, and one bad placement can end your run.
        </p>
        <p>
          Play Orb Merge free on Gamesite — no ads blocking the play area, no
          account needed. Drop, merge, and chase the highest-tier orb you can
          create.
        </p>

        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          How to Play
        </h2>
        <ol className="list-decimal list-inside space-y-1">
          <li>Move your cursor (or finger) left and right to position the next orb above the container.</li>
          <li>Click or tap to drop the orb — it falls and bounces off other orbs due to physics.</li>
          <li>When two orbs of the same color touch, they merge into one larger orb of the next tier.</li>
          <li>Keep merging to create higher-tier orbs and rack up points.</li>
          <li>The game ends if orbs stack above the top line of the container.</li>
        </ol>

        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          Tips &amp; Strategy
        </h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Group same-colored orbs on one side of the container so they can merge easily.</li>
          <li>Drop smaller orbs on top of larger ones — gravity will settle them into merging position.</li>
          <li>Avoid scattering different colors across the container; it leads to gridlock fast.</li>
          <li>Be patient with drops — rushing causes orbs to bounce unpredictably and waste space.</li>
          <li>Focus on chain merges: one well-placed orb can trigger a cascade of combinations.</li>
        </ul>
      </section>

      <GameFAQ faqs={[
        { question: "Is Orb Merge free to play?", answer: "Yes! Orb Merge is completely free to play on Gamesite. No downloads, no accounts, no hidden fees." },
        { question: "Can I play Orb Merge on my phone?", answer: "Absolutely. Orb Merge works on any device with a modern web browser — phones, tablets, and desktops. Touch controls work perfectly for positioning and dropping orbs." },
        { question: "Does Orb Merge save my progress?", answer: "Each game is a standalone run. Your high score is tracked locally, so you can always try to beat your best. The game ends when orbs stack above the container line." },
        { question: "Is Orb Merge similar to Suika Game?", answer: "Yes, Orb Merge is inspired by the Suika (Watermelon) Game. Both feature physics-based merging where matching items combine into larger ones. Orb Merge uses colorful orbs and has its own tier system and scoring." },
        { question: "What is the highest-tier orb in Orb Merge?", answer: "There are multiple orb tiers, each with a unique color and size. The goal is to keep merging to reach the highest tier possible. Strategic placement and chain reactions are key to creating top-tier orbs." },
      ]} />
    </main>
  );
}
