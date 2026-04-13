import { buildGameMetadata } from "@/lib/seo";
import GameJsonLd from "@/components/seo/GameJsonLd";
import GameFAQ from "@/components/seo/GameFAQ";
import SlimeVolleyball from "@/components/SlimeVolleyball";
import MoreArcadeGames from "@/components/MoreArcadeGames";

export const metadata = buildGameMetadata({
  title: "Slime Volleyball — Free Online Volleyball Game",
  description:
    "Jump, bump, and spike your way to victory in this classic slime volleyball game. Play free in your browser — first to 7 points wins.",
  path: "arcade/slime-volleyball",
  color: "teal",
});

export default function SlimePage() {
  return (
    <main>
      <GameJsonLd name="Slime Volleyball" description="Jump, bump, and spike your way to 7 points." path="arcade/slime-volleyball" category="arcade" />
      <SlimeVolleyball />
      <MoreArcadeGames currentSlug="slime-volleyball" />

      <section className="mx-auto max-w-2xl px-4 pb-12 text-sm text-zinc-500 dark:text-zinc-400 space-y-3">
        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          What is Slime Volleyball?
        </h2>
        <p>
          Slime Volleyball is the beloved retro browser game where two blob-shaped
          slimes face off across a net. Bump the ball over the divider and try to
          land it on your opponent&apos;s side — first player to 7 points wins the
          match. The physics are bouncy, the rallies are frantic, and every game
          is over in minutes.
        </p>
        <p>
          Play Slime Volleyball free on Gamesite against a surprisingly tricky AI
          opponent. No downloads, no sign-ups — just jump in and start bumping.
        </p>

        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          How to Play
        </h2>
        <ol className="list-decimal list-inside space-y-1">
          <li>Use the left and right arrow keys (or A/D) to move your slime across the court.</li>
          <li>Press the up arrow (or W) to jump — you can only bump the ball with your body.</li>
          <li>Angle the ball over the net by hitting it with different parts of your slime.</li>
          <li>Score a point when the ball lands on your opponent&apos;s side of the net.</li>
          <li>First to reach 7 points wins. Press any key to start the next round.</li>
        </ol>

        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          Tips &amp; Strategy
        </h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Position yourself directly under the ball before jumping for the most controlled hit.</li>
          <li>Hit the ball with the edge of your slime to send it at a sharp angle that&apos;s hard to return.</li>
          <li>Stay near the center of your side — rushing the net leaves you exposed to lobs.</li>
          <li>Watch the ball&apos;s arc carefully; timing your jump is more important than raw speed.</li>
          <li>Use quick taps instead of holding movement keys for precise positioning.</li>
        </ul>
      </section>

      <GameFAQ faqs={[
        { question: "Is Slime Volleyball free to play?", answer: "Yes! Slime Volleyball is completely free to play on Gamesite. No downloads, no accounts, no hidden fees." },
        { question: "Can I play Slime Volleyball on my phone?", answer: "Absolutely. Slime Volleyball works on any device with a modern web browser — phones, tablets, and desktops." },
        { question: "Does Slime Volleyball save my progress?", answer: "Each match is a quick standalone game (first to 7 points wins), so there is no persistent progress to save. Jump in and play a match anytime." },
        { question: "Can I play Slime Volleyball against a friend?", answer: "Currently you play against an AI opponent. The AI is surprisingly tricky and provides a satisfying challenge even for experienced players." },
        { question: "What are the controls for Slime Volleyball?", answer: "Use the left and right arrow keys (or A/D) to move and the up arrow (or W) to jump. The goal is to bump the ball over the net and land it on your opponent&apos;s side." },
      ]} />
    </main>
  );
}
